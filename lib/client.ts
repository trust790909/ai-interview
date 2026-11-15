import type { z } from "zod";
import type { command, InterviewSession } from "./schema";

class InterviewRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function request(input: z.input<typeof command>): Promise<InterviewSession> {
  const res = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (res.status === 204) return undefined as never;
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.session) {
    if (input.action === "read" && [401, 404].includes(res.status)) forgetRecent(input.id);
    throw new InterviewRequestError(
      typeof data?.error === "string" ? data.error : "面試服務暫時無法完成操作，請稍後重試。",
      res.status,
    );
  }
  return data.session;
}

export const message = (e: unknown) => e instanceof Error && !(e instanceof TypeError) ? e.message : "網路連線失敗，請重試。";
const recentKey = "ai-interview-recent";

export function recentInterview() {
  try { return localStorage.getItem(recentKey); } catch { return null; }
}

export function remember(id: string) {
  try { localStorage.setItem(recentKey, id); } catch { /* The session URL remains usable. */ }
}

export function forgetRecent(id: string) {
  try { if (recentInterview() === id) localStorage.removeItem(recentKey); } catch { /* Recovery is optional. */ }
}

export async function prepare() {
  const res = await fetch("/api/interview", { cache: "no-store" });
  if (!res.ok) throw new Error("無法建立瀏覽器會話，請重試。");
}
