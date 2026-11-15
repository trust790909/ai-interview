import Link from "next/link";
import { ArrowDown, ArrowRight, AudioLines, BarChart3, BriefcaseBusiness, ChevronDown, ClipboardList, FileSearch, ListChecks, MessagesSquare, PenLine, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/brand";
import { Preview } from "@/components/preview";

const features = [
  [FileSearch, "JD 智慧出題", "依產業、職缺與工作描述，練習面試官真正可能關心的問題。"],
  [ListChecks, "自訂面試題數", "從 3 到 10 題，自行安排每次練習的長度。"],
  [MessagesSquare, "AI 動態追問", "根據你實際說了什麼，針對值得補充的地方追問。"],
  [BarChart3, "專業能力評分", "查看五大能力的分數、判斷理由與原始回答證據。"],
  [PenLine, "逐題改善建議", "回顧每一題的優點與缺漏，找出可以補強的細節。"],
  [Sparkles, "優化示範回答", "對照原始回答與示範，練習更清楚、有說服力的表達。"],
] as const;
const steps = ["貼上 JD，設定面試條件", "與 AI 面試官進行互動", "取得完整能力分析報告", "學習逐題改善建議，再次練習"];
const faq = [
  ["AI 面試模擬器如何運作？", "貼上職缺描述並設定難度，AI 會依職務需求出題。你以文字回答，完成後可查看分析報告。"],
  ["可以自行設定面試題數嗎？", "可以設定 3 至 10 道主要題目。每題最多一次追問，追問不計入主要題數。"],
  ["支援哪些產業？", "針對保險業內勤情境強化，並支援金融、科技、製造、服務業及自訂產業。"],
  ["AI 評分的依據是什麼？", "依實際回答呈現的職務專業、問題分析、表達、協作和具體程度評估，並附理由與可從回答找到的證據。"],
  ["每一題都會提供示範回答嗎？", "完成面試後，每道主要題目都有改善策略和完整示範。缺少真實經驗或成果時，示範會提示你補充。"],
  ["AI 分數代表實際錄取機率嗎？", "分數只供練習與自我檢視。實際企業使用的評選方式和錄取決策各有不同。"],
  ["我的面試資料會如何處理？", "職缺描述與必要答題資料會傳送給 OpenAI 生成問題和回饋。會話保存在伺服器，詳情及刪除方式請見隱私說明。"],
];
export default function Home() {
  return <>
    <section className="hero"><div className="wrap hero-grid">
      <div className="hero-copy"><div className="eyebrow"><AudioLines size={18} /> 互動式面試練習</div>
        <h1>下一場面試，<br />從更好的準備開始。</h1>
        <p>貼上應徵職缺，讓 AI 為你打造專屬面試。從專業提問、動態追問到逐題分析，幫助你找到回答盲點，練習更有說服力的表達方式。</p>
        <div className="actions"><Link className="btn primary" href="/interview">立即開始 AI 模擬面試 <ArrowRight size={18} /></Link><a className="btn secondary" href="#workflow">了解如何運作 <ArrowDown size={16} /></a></div>
      </div><Preview />
    </div></section>
    <section className="section wrap" id="features"><SectionHeading title="從練習到回饋，知道下一步怎麼改" />
      <div className="features">{features.map(([Icon, title, desc]) => <article className="card feature" key={title}><span className="tile"><Icon size={22} /></span><h3>{title}</h3><p>{desc}</p></article>)}</div>
    </section>
    <section className="section tint" id="workflow"><div className="wrap"><SectionHeading title="四步完成一次面試練習" />
      <ol className="steps">{steps.map((step, i) => <li key={step}><span>{i + 1}</span><strong>{step}</strong></li>)}</ol>
    </div></section>
    <section className="section wrap showcase" id="preview"><div><div className="eyebrow"><ClipboardList size={17} /> 產品展示</div><h2>看看一場模擬面試<br />會帶給你什麼</h2><p>切換示範畫面，查看面試對話、能力評分和逐題回饋。</p></div><Preview interactive /></section>
    <section className="section tint"><div className="wrap industry"><div><span className="tile"><BriefcaseBusiness size={23} /></span><h2>為保險內勤情境設計<br />也適用其他職缺</h2><p>從通路導入、核保理賠到數位轉型，依職缺挑選和工作有關的情境。其他產業也能用自己的 JD 開始練習。</p></div>
      <div className="industry-list">{["保險業與金融業", "科技資訊業", "製造業", "行銷與企劃", "專案與產品管理", "其他專業職缺"].map(x => <span className="card" key={x}>{x}</span>)}</div>
    </div></section>
    <section className="section wrap faq" id="faq"><SectionHeading title="常見問題" />{faq.map(([q, a], i) => <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a} {i === 6 && <Link href="/privacy">查看隱私說明</Link>}</p></details>)}</section>
    <section className="wrap closing-wrap"><div className="closing"><h2>準備好迎接下一場面試了嗎？</h2><p>從一份職缺描述開始，練習更清楚、更有說服力的回答。</p><Link className="btn light" href="/interview">開始我的模擬面試 <ArrowRight size={18} /></Link></div></section>
  </>;
}
