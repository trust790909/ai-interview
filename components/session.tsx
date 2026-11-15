"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import Image from "next/image";
import { message, recentKey, request } from "@/lib/client";
import { useInterview } from "./use-interview";

function Message({ label, text, user = false }: { label: string; text: string; user?: boolean }) {
  return <article className={user ? "message user" : "message"}>{!user && <Image className="bot" src="/interview-mascot-blue.svg" width={36} height={36} alt="" />}<div><div className="fine font-bold">{label}</div><div className="bubble">{text}</div></div></article>;
}

export function Session({ id }: { id: string }) {
  const router = useRouter();
  const { session, setSession, loading, error, setError, reload } = useInterview(id);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const nextFocus = useRef<HTMLTextAreaElement>(null);
  const tail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tail.current?.parentElement) tail.current.parentElement.scrollTop = tail.current.parentElement.scrollHeight;
  }, [session, busy]);

  async function operation(action: "answer" | "evaluate" | "delete") {
    if (!session || active.current || (action === "answer" && !draft.trim())) return;
    if (action === "delete" && !window.confirm("確定要刪除這場面試及報告？刪除後無法恢復。")) return;
    active.current = true;
    setError("");
    setBusy(true);
    try {
      const next = await request(action === "answer" ? { action, id, revision: session.revision, answer: draft } : { action, id });
      if (action === "delete") {
        if (localStorage.getItem(recentKey) === id) localStorage.removeItem(recentKey);
        router.replace("/interview");
        return;
      }
      setSession(next);
      if (action === "answer") setDraft("");
      if (next.status === "COMPLETED") router.push("/interview/result/" + id);
    } catch (e) {
      setError(message(e));
    } finally {
      active.current = false;
      setBusy(false);
      if (action === "answer") requestAnimationFrame(() => nextFocus.current?.focus());
    }
  }

  if (loading && !session) return <p role="status">載入面試進度中…</p>;
  if (!session) return <div className="card stack"><p className="notice error" role="alert">{error}</p><div className="actions"><button className="btn secondary" onClick={() => void reload()}>重新載入</button><Link href="/interview" className="btn primary">回面試設定</Link></div></div>;
  const count = session.settings.questionCount;
  const answering = session.status === "ASKING" || session.status === "FOLLOW_UP";

  return <div className="stack">
    <div className="page-title"><h1>{session.settings.jobTitle}</h1><p>{session.settings.industry === "其他產業" ? session.settings.customIndustry : session.settings.industry} · {session.settings.difficulty} · 文字模擬面試</p></div>
    <section className="card stack" aria-label="面試對話">
      <div className="spread"><h2 className="text-xl">AI 面試官</h2><span className="pill">{answering ? session.status === "FOLLOW_UP" ? "第 " + (session.index + 1) + " 題｜延伸追問" : "第 " + (session.index + 1) + " / " + count + " 題" : count + " / " + count + " 題已完成"}</span></div>
      <div className="track" role="progressbar" aria-label="已完成主要題數" aria-valuenow={session.index} aria-valuemin={0} aria-valuemax={count}><span style={{ width: (session.index / count * 100) + "%" }} /></div>
      <div className="messages" role="log" aria-label="答題紀錄">
        {session.questions.map((q, i) => {
          const answer = session.answers[i];
          return <div className="stack" key={i}><Message label={"AI 面試官 · 第 " + (i + 1) + " 題"} text={q.text} />
            {answer && <Message label="我的回答" text={answer.text} user />}
            {answer?.followUp && <Message label="AI 面試官 · 延伸追問" text={answer.followUp.text} />}
            {answer?.followUp?.answer && <Message label="我的追問回答" text={answer.followUp.answer} user />}
          </div>;
        })}
        <div ref={tail} />
      </div>
      {busy && <p role="status" className="notice flex items-center gap-2"><Image className="bot mascot-thinking" src="/interview-mascot-blue.svg" width={36} height={36} alt="" />{answering ? "AI 面試官思考中…" : "正在分析回答，生成能力評分與逐題建議…"} </p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      {answering && <form className="composer" onSubmit={e => { e.preventDefault(); void operation("answer"); }}>
        <label className="form-label" htmlFor="answer">輸入回答</label>
        <textarea ref={nextFocus} id="answer" maxLength={1200} required readOnly={busy} value={draft} onChange={e => setDraft(e.target.value)} placeholder="請用自己的經驗或想法回答…" onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); void operation("answer"); }
        }} />
        <div className="spread"><span className="fine">{draft.length} / 1,200 · Enter 送出，Shift + Enter 換行</span><button className="btn primary" disabled={busy || !draft.trim()}>{error ? "重新送出" : "送出回答"} <Send size={16} /></button></div>
      </form>}
      {session.status === "EVALUATING" && <div className="stack"><p>已完成全部題目。現在可以生成你的練習報告。</p><div><button className="btn primary" disabled={busy} onClick={() => void operation("evaluate")}>{error ? "重試產生報告" : "產生評估報告"}</button></div></div>}
      {session.status === "COMPLETED" && <div><Link className="btn primary" href={"/interview/result/" + id}>查看評估報告</Link></div>}
    </section>
    <div className="spread"><Link className="text-link fine" href="/interview">回設定頁</Link><button type="button" className="fine danger underline" disabled={busy} onClick={() => void operation("delete")}>刪除本次面試</button></div>
  </div>;
}
