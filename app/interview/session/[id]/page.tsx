import { Suspense } from "react";
import { Session } from "@/components/session";

export const metadata = { title: "模擬面試", robots: { index: false, follow: false } };
type Params = Promise<{ id: string }>;

async function Content({ params }: { params: Params }) {
  const { id } = await params;
  return <Session key={id} id={id} />;
}

export default function Page({ params }: { params: Params }) {
  return <section className="service"><div className="narrow">
    <Suspense fallback={<p role="status">載入面試進度中…</p>}><Content params={params} /></Suspense>
  </div></section>;
}
