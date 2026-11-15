import { Suspense } from "react";
import { Setup } from "@/components/setup";

export const metadata = { title: "面試設定" };
export default function Page() {
  return <section className="service"><div className="narrow"><div className="page-title"><h1>設定你的模擬面試</h1><p>根據你的職缺描述，建立一場專屬的文字面試。</p></div>
    <Suspense fallback={<p role="status">載入面試設定中…</p>}><Setup /></Suspense>
  </div></section>;
}
