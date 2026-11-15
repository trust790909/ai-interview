"use client";

import { useState } from "react";
import { ArrowUpRight, Bot, Check } from "lucide-react";

const tabs = ["模擬面試", "能力評分", "逐題優化"];
const scores = [["職務專業", 86], ["分析與解決", 83], ["表達與邏輯", 88], ["合作與溝通", 81], ["完整與具體", 76]] as const;
export const demoQuestion = "如果業務員數位工具上線後使用率偏低，你會怎麼找出原因並推動改善？";
export const demoAnswer = "我會先找第一線業務員了解使用障礙，再與資訊單位討論改善。";

export function Preview({ interactive = false }: { interactive?: boolean }) {
  const [tab, setTab] = useState(0);
  const active = interactive ? tab : 0;
  return <div className={interactive ? "preview interactive" : "preview"}>
    <div className="preview-top"><span className="window-dots"><i /><i /><i /></span><strong>面試工作台</strong><span className="sample">示範畫面</span></div>
    {interactive && <div className="preview-tabs" role="group" aria-label="選擇展示內容">{tabs.map((label, i) =>
      <button key={label} type="button" aria-pressed={active === i} onClick={() => setTab(i)}>{label}</button>)}</div>}
    <div className={interactive ? "preview-body" : "preview-body hero-preview-body"}>
      {active === 0 && <><div className="preview-context"><div><strong>數位專案經理</strong><small>保險業 · 中階</small></div><span className="pill">第 2 / 5 題</span></div>
        <div className="track"><span style={{ width: "40%" }} /></div>
        <div className="mini-message"><span className="bot"><Bot size={17} /></span><div><small>AI 面試官</small><div className="bubble">{demoQuestion}</div></div></div>
        <div className="mini-response"><small>我的回答</small><div className="bubble">{demoAnswer}</div></div>
        {!interactive && <div className="preview-score"><span className="preview-score-icon"><ArrowUpRight size={18} /></span><div><strong>練習報告預覽</strong><small>能力評分與逐題改善建議</small></div><strong className="sample-score">84<span> / 100</span></strong></div>}
      </>}
      {active === 1 && <div className="demo-bars"><h3>五大能力評分</h3>{scores.map(([name, value]) => <div key={name}><div className="spread"><span>{name}</span><strong>{value}</strong></div><div className="track"><span style={{ width: value + "%" }} /></div></div>)}</div>}
      {active === 2 && <div className="demo-bars"><h3>逐題改善｜數位工具導入</h3><p><Check size={18} /> 從第一線使用者蒐集回饋，是合適的起點。</p><p>下一步可以先用登入率與核心功能使用率定位問題，再用訪談確認原因。</p><div className="answer-example"><strong>示範回答</strong><p>我會先比較各單位的登入率與核心功能使用率，再訪談第一線業務員，釐清障礙來自操作、功能或推廣方式。確認原因後，我會依影響及改善成本排序，與資訊單位安排調整，並追蹤改善前後的使用差異。</p></div></div>}
    </div>
  </div>;
}
