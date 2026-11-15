import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { command } from "@/lib/schema";
import { interviewStore } from "@/lib/interview-store";
import { StorageConfigurationError } from "@/lib/redis-store";
import type { InterviewSession } from "@/lib/schema";
import OpenAI from "openai";
import { advance, publicSession } from "@/lib/state";
import { evaluate, follow, plan } from "@/lib/ai";

export const maxDuration = 165;
const { acquire, allowed, load, release, remove, write } = interviewStore;
const cookie = "interview_owner";
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest) {
  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (!req.cookies.get(cookie)) response.cookies.set(cookie, randomUUID(), {
    httpOnly: true, sameSite: "strict", secure: req.nextUrl.protocol === "https:", path: "/", maxAge: 8 * 86400,
  });
  return response;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const expectedOrigin = host ? req.nextUrl.protocol + "//" + host : req.nextUrl.origin;
  if (req.headers.get("sec-fetch-site") === "cross-site" ||
      (origin !== null && origin !== expectedOrigin)) {
    return fail("請從本站操作。", 403);
  }
  const secret = req.cookies.get(cookie)?.value;
  if (!secret || !/^[a-f0-9-]{36}$/i.test(secret)) return fail("請重新開啟面試設定以建立瀏覽器會話。", 401);
  const owner = createHash("sha256").update(secret).digest("hex");
  let payload;
  try {
    const reader = req.body?.getReader();
    if (!reader) return fail("缺少請求內容。", 400);
    const decoder = new TextDecoder();
    let size = 0;
    let raw = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 40_000) {
        await reader.cancel();
        return fail("請求內容過長。", 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    payload = command.safeParse(JSON.parse(raw + decoder.decode()));
  } catch {
    return fail("請求格式有誤。", 400);
  }
  if (!payload.success) return fail("請確認面試設定或回答的格式。", 400);

  const input = payload.data;
  const token = randomUUID();
  const success = (session: InterviewSession) =>
    NextResponse.json({ session: publicSession(session) }, { headers: { "Cache-Control": "no-store" } });

  try {
    if (!(await allowed("request:" + owner, 90, 60_000))) return fail("操作過於頻繁，請稍後再試。", 429);
    let session = await load(input.id, owner);
    if (input.action === "read") return session ? success(session) : fail("找不到這場面試，或面試已過期。", 404);
    if (!session && input.action !== "start") return fail("找不到這場面試，或面試已過期。", 404);
    if (!(await acquire(input.id, token))) return fail("這場面試正在處理中，請稍後重試。", 409);
    try {
      session = await load(input.id, owner);
      if (input.action === "delete") {
        await remove(input.id, owner, token);
        return new NextResponse(null, { status: 204 });
      }
      if (input.action === "start" && session) return success(session);
      if (input.action !== "start" && !session) return fail("面試已過期。", 404);
      if (input.action === "answer" && session && input.revision < session.revision) return success(session);
      if (input.action === "answer" && session && (input.revision !== session.revision || !["ASKING", "FOLLOW_UP"].includes(session.status))) return fail("進度已更新，請重新整理。", 409);
      if (input.action === "evaluate" && session?.status === "COMPLETED") return success(session);
      if (input.action === "evaluate" && session?.status !== "EVALUATING") return fail("請先完成所有面試題目。", 409);
      if (!process.env.OPENAI_API_KEY?.trim()) return fail("面試服務尚未設定 AI 金鑰，請聯絡管理者。", 503);
      if (!(await allowed("ai:" + owner, 36, 3600_000)) || !(await allowed("ai:global", 180, 3600_000))) return fail("已達面試服務使用上限，請稍後再試。", 429);

      if (input.action === "start") {
        session = { id: input.id, settings: input.settings, questions: await plan(input.settings), answers: [], index: 0, revision: 0, status: "ASKING" };
      } else if (input.action === "answer" && session) {
        const probe = session.status === "ASKING" ? await follow(session, input.answer) : null;
        session = advance(session, input.answer, probe);
      } else if (input.action === "evaluate" && session) {
        session = { ...session, evaluation: await evaluate(session), status: "COMPLETED", revision: session.revision + 1 };
      }
      if (!session || !(await write(session, owner, token))) return fail("無法儲存本次操作，請重試。", 409);
      return success(session);
    } finally {
      await Promise.resolve().then(() => release(input.id, token)).catch(() => console.warn("Interview lease release failed"));
    }
  } catch (error) {
    if (error instanceof StorageConfigurationError) return fail("面試服務尚未設定雲端資料庫，請聯絡管理者。", 503);
    if (error instanceof OpenAI.APIError) {
      console.error("Interview AI request failed", { status: error.status });
      return fail("AI 服務目前無法回應，請稍後重試。", 503);
    }
    console.error("Interview request failed", { action: input.action });
    return fail("面試服務暫時無法完成操作，請稍後重試。", 503);
  }
}
