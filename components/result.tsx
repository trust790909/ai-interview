"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, LoaderCircle, RotateCcw } from "lucide-react";
import { dimensions, weights } from "@/lib/schema";
import { message, remember, request } from "@/lib/client";
import { useInterview } from "./use-interview";

function Evidence({ quotes }: { quotes: string[] }) {
  return <div><strong>回答證據</strong>{quotes.length ? quotes.map((q, i) => <blockquote className="border-l-2 border-brand pl-3 text-sm" key={i}>「{q}」</blockquote>) : <p>回答中沒有足夠的直接證據可引用。</p>}</div>;
}
export function Result({ id }: { id: string }) {
  const { session, loading, error, setError, reload } = useInterview(id);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const retryId = useRef("");
  const active = useRef(false);

  async function restart() {
    if (!session || active.current) return;
    active.current = true;
    setBusy(true);
    setError("");
    try {
      retryId.current ||= crypto.randomUUID();
      const next = await request({ action: "start", id: retryId.current, settings: session.settings });
      remember(next.id);
      router.push("/interview/session/" + next.id);
    } catch (e) {
      setError(message(e));
      active.current = false;
      setBusy(false);
    }
  }

  if (loading && !session) return <p role="status">載入評估報告中…</p>;
  const report = session?.evaluation;
  if (!session || !report) return <div className="card stack"><p className="notice" role="status">{error || "這場面試的報告尚未產生。"}</p><div className="actions"><button className="btn secondary" onClick={() => void reload()}>重新載入</button><Link className="btn primary" href={session ? "/interview/session/" + id : "/interview"}>{session ? "回到面試進度" : "回面試設定"}</Link></div></div>;
  const best = report.dimensions.reduce((top, d, i) => d.score > report.dimensions[top].score ? i : top, 0);
  const low = report.dimensions.reduce((bottom, d, i) => d.score <= report.dimensions[bottom].score ? i : bottom, 0);

  return <div className="stack">
    <div className="page-title"><h1>面試評估報告</h1><p>{session.settings.jobTitle} · {session.settings.difficulty} · {session.settings.questionCount} 道主要題目</p></div>
    <section className="card stack">
      <div><h2 className="text-xl">整體表現</h2><div className="report-total">{report.total}<small> / 100</small></div><p>{report.summary}</p></div>
      <div className="stats"><div className="notice"><strong>最突出的能力</strong><br />{dimensions[best]}</div><div className="notice"><strong>優先改善的能力</strong><br />{dimensions[low]}</div></div>
      {session.settings.questionCount < 5 && <p className="fine">本次題數較少，部分能力可能未獲充分觀察。</p>}
    </section>
    <section className="card"><h2 className="text-xl">五大能力分析</h2>
      {report.dimensions.map((d, i) => <details className="report-details" key={dimensions[i]}><summary className="dimension-summary"><span>{dimensions[i]} <small className="fine">（權重 {weights[i]}%）</small></span><span className="score">{d.score} 分</span><ChevronDown size={18} /><span className="track" aria-hidden="true"><span style={{ width: d.score + "%" }} /></span></summary>
        <div className="content stack"><div><strong>評分理由</strong><p>{d.reason}</p></div><Evidence quotes={d.evidence} /><div><strong>優點</strong><p>{d.strengths}</p><strong>不足</strong><p>{d.gaps}</p><strong>改善建議</strong><p>{d.advice}</p></div></div>
      </details>)}
    </section>
    <section className="card"><h2 className="text-xl">逐題分析</h2>
      {report.feedback.map((f, i) => { const q = session.questions[i]; const a = session.answers[i]; return <details className="report-details" key={i}>
        <summary><span>第 {i + 1} 題｜{q.topic}</span><span className="score">{f.score} 分</span><ChevronDown size={18} /></summary>
        <div className="content stack">
          <div><strong>原始問題</strong><p>{q.text}</p></div>
          <div className="compare"><div><strong>我的回答</strong><p>{a.text}</p>{a.followUp && <><strong>延伸追問</strong><p>{a.followUp.text}</p><strong>我的追問回答</strong><p>{a.followUp.answer}</p></>}</div><div className="answer-example"><strong>優化示範回答</strong><p>{f.improvedAnswer}</p></div></div>
          <div><strong>評分依據</strong><p>{f.reason}</p></div><Evidence quotes={f.evidence} />
          <div><strong>回答優點</strong><p>{f.strengths}</p><strong>回答不足</strong><p>{f.gaps}</p><strong>更好的回答策略</strong><p>{f.strategy}</p></div>
        </div>
      </details>; })}
    </section>
    <section className="card stack"><h2 className="text-xl">下次練習的三項重點</h2>{Object.values(report.priorities).map((p, i) => <article key={i} className="border-t border-slate-200 pt-3"><h3>{p.title}</h3><p><strong>目前問題</strong>　{p.problem}</p><p><strong>建議做法</strong>　{p.action}</p><p><strong>下次練習</strong>　{p.practice}</p></article>)}</section>
    <p className="fine">本報告為 AI 模擬面試練習評估，不代表實際企業的錄取機率或錄取決策。</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="actions"><button className="btn primary" disabled={busy} onClick={() => void restart()}>{busy ? <><LoaderCircle className="loader" size={17} /> 準備新一輪題目…</> : <><RotateCcw size={17} /> 使用相同職缺重新面試</>}</button>
      <Link className="btn secondary" href={"/interview?from=" + id}>修改設定後重新開始 <ArrowRight size={16} /></Link><Link className="text-link" href="/">返回首頁</Link></div>
    <Link className="fine text-link" href={"/interview/session/" + id}>管理或刪除本次面試</Link>
  </div>;
}
