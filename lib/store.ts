import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { InterviewSession } from "./schema";

let db: DatabaseSync | undefined;
const retention = 7 * 86400_000;
function database() {
  if (db) return db;
  const dir = join(process.cwd(), ".interview-data");
  mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(join(dir, "interviews.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=3000;
    PRAGMA secure_delete=ON;
    CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, owner TEXT NOT NULL, expires INTEGER NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS leases(id TEXT PRIMARY KEY, token TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS rate(bucket TEXT PRIMARY KEY, expires INTEGER NOT NULL, count INTEGER NOT NULL);`);
  return db;
}
export function load(id: string, owner: string): InterviewSession | undefined {
  const connection = database();
  connection.prepare("DELETE FROM sessions WHERE expires <= ?").run(Date.now());
  const row = connection.prepare("SELECT data FROM sessions WHERE id=? AND owner=?").get(id, owner);
  return row ? JSON.parse(String(row.data)) : undefined;
}
export function write(session: InterviewSession, owner: string, token: string) {
  const now = Date.now();
  return database().prepare(`INSERT INTO sessions SELECT ?,?,?,? FROM leases WHERE id=? AND token=? AND expires>?
    ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE sessions.owner=excluded.owner`)
    .run(session.id, owner, now + retention, JSON.stringify(session), session.id, token, now).changes === 1;
}
export function remove(id: string, owner: string, token: string) {
  database().prepare("DELETE FROM sessions WHERE id=? AND owner=? AND EXISTS (SELECT 1 FROM leases WHERE id=? AND token=? AND expires>?)").run(id, owner, id, token, Date.now());
}
export function acquire(id: string, token: string) {
  const connection = database();
  connection.prepare("DELETE FROM leases WHERE expires<=?").run(Date.now());
  return connection.prepare("INSERT OR IGNORE INTO leases VALUES(?,?,?)").run(id, token, Date.now() + 180_000).changes === 1;
}
export function release(id: string, token: string) {
  database().prepare("DELETE FROM leases WHERE id=? AND token=?").run(id, token);
}
export function allowed(key: string, maximum: number, interval: number) {
  const now = Date.now();
  const end = (Math.floor(now / interval) + 1) * interval;
  const connection = database();
  connection.prepare("DELETE FROM rate WHERE expires<=?").run(now);
  const row = connection.prepare(`INSERT INTO rate VALUES(?,?,1)
    ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<? RETURNING count`).get(key + ":" + end, end, maximum);
  return Boolean(row);
}
