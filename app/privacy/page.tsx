import Link from "next/link";

export const metadata = { title: "隱私說明" };
const sections = [
  ["會保存哪些資料", "伺服器儲存產業、職缺名稱及描述、面試設定、題目、回答、追問與報告。瀏覽器保留用於識別會話的 Cookie，以及最近一場面試的識別碼。請在貼上資料前移除個人聯絡資訊、客戶資料和公司機密。"],
  ["AI 如何使用面試資料", "出題時，伺服器將設定與職缺描述 傳給 OpenAI。追問時只傳送當前題目、回答及必要的職務資訊。生成整體報告時會傳送本場設定、題目與回答。應用程式要求 OpenAI 不儲存 Responses API 的回應狀態，服務商的其他資料處理依其條款。"],
  ["保存期限與刪除方式", "每場面試自建立起可存取七天，期滿後會清理。你也可以在面試互動頁選擇「刪除本次面試」，移除伺服器上的會話與報告。清除瀏覽器 Cookie 後將無法重新存取原有面試紀錄。"],
  ["評估用途", "報告供求職者練習與自我檢視。AI 提供的分數和示範可能有誤，請依自己的經驗調整回答。本報告不代表實際企業的錄取機率或錄取決策。"],
];
export default function Page() {
  return <section className="service"><div className="narrow"><div className="page-title"><h1>隱私與資料使用</h1><p>了解資料如何用於模擬面試，以及如何刪除。</p></div><article className="card stack">{sections.map(([title, body]) => <section key={title}><h2 className="mb-2 text-xl">{title}</h2><p>{body}</p></section>)}<div><Link className="btn primary" href="/interview">回面試設定</Link></div></article></div></section>;
}
