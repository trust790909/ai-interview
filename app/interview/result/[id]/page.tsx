import { Suspense } from "react";
import { Result } from "@/components/result";

export const metadata = { title: "面試報告", robots: { index: false, follow: false } };
type Params = Promise<{ id: string }>;

async function Content({ params }: { params: Params }) {
  const { id } = await params;
  return <Result key={id} id={id} />;
}

export default function Page({ params }: { params: Params }) {
  return <section className="service"><div className="narrow">
    <Suspense fallback={<p role="status">載入評估報告中…</p>}><Content params={params} /></Suspense>
  </div></section>;
}
