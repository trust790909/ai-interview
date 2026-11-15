"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, Minus, Plus } from "lucide-react";
import { industries, levels, settingsSchema, type InterviewSettings } from "@/lib/schema";
import { message, prepare, recentKey, remember, request } from "@/lib/client";

const defaults: InterviewSettings = { industry: "保險業", customIndustry: "", jobTitle: "", jobDescription: "", questionCount: 5, difficulty: "中階" };
const example = "負責壽險業務員數位工具的需求訪談、專案規劃與上線推動。與通路、資訊、法遵及營運團隊協作，安排試辦與教育訓練，建立使用率與流程效率指標。須具備跨部門協調、需求分析和數據追蹤能力，有金融服務或數位轉型經驗尤佳。";
const levelNotes = ["基本知識與職務理解", "實務應用、解題與協作", "策略決策與風險管理"];

export function Setup() {
  const router = useRouter();
  const source = useSearchParams().get("from");
  const [settings, set] = useState(defaults);
  const [count, setCount] = useState("5");
  const [recent, setRecent] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(source));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef<{ id: string; body: string } | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    let disposed = false;
    async function initialize() {
      setRecent(localStorage.getItem(recentKey));
      if (!source) return;
      try {
        const session = await request({ action: "read", id: source });
        if (!disposed) { set(session.settings); setCount(String(session.settings.questionCount)); }
      } catch (e) {
        if (!disposed) setError(message(e));
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void initialize();
    return () => { disposed = true; };
  }, [source]);

  function update<K extends keyof InterviewSettings>(key: K, value: InterviewSettings[K]) {
    set(s => ({ ...s, [key]: value }));
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    const parsed = settingsSchema.safeParse({ ...settings, questionCount: Number(count) });
    if (!parsed.success) { setError("請填寫職缺、20 至 5,000 字的 JD，以及 3 至 10 的整數題數。若選擇其他產業，也請填寫產業名稱。"); return; }
    const body = JSON.stringify(parsed.data);
    if (attempt.current?.body !== body) attempt.current = { id: crypto.randomUUID(), body };
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await prepare();
      const session = await request({ action: "start", id: attempt.current.id, settings: parsed.data });
      remember(session.id);
      router.push("/interview/session/" + session.id);
    } catch (e) {
      setError(message(e));
      submitting.current = false;
      setBusy(false);
    }
  }

  return <div className="stack">
    {recent && <div className="notice spread"><span>可以回到這個瀏覽器最近的練習。</span><Link className="text-link" href={"/interview/session/" + recent}>開啟最近練習</Link></div>}
    <form className="card stack" onSubmit={start}>
      <fieldset className="stack" disabled={loading || busy}>
        <div className="form-grid">
          <label className="field">產業<select value={settings.industry} onChange={e => update("industry", e.target.value as InterviewSettings["industry"])}>{industries.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="field">職缺名稱<input required maxLength={100} value={settings.jobTitle} placeholder="例如：數位專案經理" onChange={e => update("jobTitle", e.target.value)} /></label>
        </div>
        {settings.industry === "其他產業" && <label className="field">產業名稱<input required maxLength={60} value={settings.customIndustry} onChange={e => update("customIndustry", e.target.value)} /></label>}
        <div className="field">
          <div className="spread"><label htmlFor="jd">職缺描述（JD）</label><button className="text-link" type="button" onClick={() => set(s => ({ ...s, industry: "保險業", jobTitle: "數位專案經理", jobDescription: example }))}>填入範例 JD</button></div>
          <textarea id="jd" required minLength={20} maxLength={5000} rows={6} placeholder="貼上工作內容、主要職責、專業要求及所需經驗…" value={settings.jobDescription} onChange={e => update("jobDescription", e.target.value)} />
          <div className="spread fine"><small>請移除姓名、聯絡方式及機密資訊。</small><small>{settings.jobDescription.length} / 5,000</small></div>
        </div>
        <div className="field">
          <label htmlFor="count">主要題數</label>
          <div className="stepper">
            <button type="button" aria-label="減少題數" disabled={Number(count) <= 3} onClick={() => setCount(String(Math.max(3, Math.min(10, Math.trunc(Number(count)) - 1))))}><Minus size={16} /></button>
            <input id="count" type="number" min={3} max={10} step={1} required value={count} onChange={e => setCount(e.target.value)} />
            <button type="button" aria-label="增加題數" disabled={Number(count) >= 10} onClick={() => setCount(String(Math.max(3, Math.min(10, Math.trunc(Number(count)) + 1))))}><Plus size={16} /></button>
          </div>
          <small className="fine">可選 3～10 題。每題最多一次追問，追問不計入題數。</small>
        </div>
        <fieldset>
          <legend className="form-label mb-2">面試難度</legend>
          <div className="levels">{levels.map((level, i) => <label className="level" key={level}><input type="radio" name="difficulty" checked={settings.difficulty === level} onChange={() => update("difficulty", level)} /><span><strong>{level}</strong><small className="fine">{levelNotes[i]}</small></span></label>)}</div>
        </fieldset>
      </fieldset>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="actions"><button className="btn primary" disabled={loading || busy} type="submit">{busy ? <><LoaderCircle className="loader" size={18} /> AI 正在根據 JD 出題…</> : <>開始模擬面試 <ArrowRight size={17} /></>}</button><Link className="text-link fine" href="/privacy">面試資料如何處理</Link></div>
    </form>
  </div>;
}
