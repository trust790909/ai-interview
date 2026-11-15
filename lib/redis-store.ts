import type { InterviewSession } from "./schema";

export class StorageConfigurationError extends Error {}

const prefix = "ai-interview:v1:";
const retention = 7 * 86400_000;
const leaseDuration = 180_000;

function credentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token || !url.startsWith("https://")) throw new StorageConfigurationError();
  return { url, token };
}

export function redisEnabled() {
  return Boolean(process.env.VERCEL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
}

async function command<T>(...args: (string | number)[]): Promise<T> {
  const { url, token } = credentials();
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Redis request failed");
  const data = await response.json();
  if (data.error || !("result" in data)) throw new Error("Redis command failed");
  return data.result as T;
}

const sessionKey = (id: string, owner: string) => prefix + "session:" + owner + ":" + id;
const leaseKey = (id: string) => prefix + "lease:" + id;
const verifyLease = "if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end ";
export const redisStore = {
  async load(id: string, owner: string): Promise<InterviewSession | undefined> {
    const raw = await command<string | null>("GET", sessionKey(id, owner));
    return raw === null ? undefined : JSON.parse(raw);
  },
  async acquire(id: string, token: string) {
    return await command("SET", leaseKey(id), token, "NX", "PX", leaseDuration) === "OK";
  },
  async release(id: string, token: string) {
    await command("EVAL", verifyLease + "return redis.call('DEL', KEYS[1])", 1, leaseKey(id), token);
  },
  async write(session: InterviewSession, owner: string, token: string) {
    const script = verifyLease + `
      local ttl = redis.call('PTTL', KEYS[2])
      if ttl == -2 then ttl = tonumber(ARGV[3]) end
      if ttl <= 0 then return 0 end
      redis.call('SET', KEYS[2], ARGV[2], 'PX', ttl)
      return 1`;
    return await command("EVAL", script, 2, leaseKey(session.id), sessionKey(session.id, owner), token,
      JSON.stringify(session), retention) === 1;
  },
  async remove(id: string, owner: string, token: string) {
    await command("EVAL", verifyLease + "return redis.call('DEL', KEYS[2])", 2, leaseKey(id), sessionKey(id, owner), token);
  },
  async allowed(key: string, maximum: number, interval: number) {
    const now = Date.now();
    const end = (Math.floor(now / interval) + 1) * interval;
    const script = `
      local count = tonumber(redis.call('GET', KEYS[1]) or '0')
      if count >= tonumber(ARGV[1]) then return 0 end
      if count == 0 then
        redis.call('SET', KEYS[1], 1, 'PX', ARGV[2])
      else
        redis.call('INCR', KEYS[1])
      end
      return 1`;
    return await command("EVAL", script, 1, prefix + "rate:" + key + ":" + end, maximum, end - now) === 1;
  },
};
