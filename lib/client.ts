import type { z } from "zod";
import type { command, InterviewSession } from "./schema";

export async function request(input: z.input<typeof command>): Promise<InterviewSession> {
  const res = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (res.status === 204) return undefined as never;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "連線失敗，請重試。");
  return data.session;
}
export const message = (e: unknown) => e instanceof Error && !(e instanceof TypeError) ? e.message : "網路連線失敗，請重試。";
export const recentKey = "ai-interview-recent";
export const remember = (id: string) => localStorage.setItem(recentKey, id);
export async function prepare() {
  const res = await fetch("/api/interview", { cache: "no-store" });
  if (!res.ok) throw new Error("無法建立瀏覽器會話，請重試。");
}
