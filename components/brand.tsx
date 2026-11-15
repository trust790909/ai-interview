import Link from "next/link";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import { MobileNav } from "./mobile-nav";

export function Brand() {
  return <Link href="/" className="brand"><span className="brand-icon"><MessagesSquare size={19} /></span>AI 面試模擬器</Link>;
}
const links = [["/#features", "產品特色"], ["/#workflow", "使用流程"], ["/#faq", "常見問題"]];
export function Header() {
  return <header className="site-header"><div className="wrap header-inner">
    <Brand /><nav className="desktop-nav" aria-label="主導覽">{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    <Link className="btn primary header-cta" href="/interview">免費開始模擬 <ArrowUpRight size={15} /></Link>
    <MobileNav links={links} />
  </div></header>;
}
export function Footer() {
  return <footer className="footer"><div className="wrap footer-inner"><div><Brand /><p>練習面試，找到下一次可以做得更好的地方。</p></div>
    <nav aria-label="頁尾導覽">{links.slice(0, 2).map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}<Link href="/interview">開始面試</Link><Link href="/privacy">隱私說明</Link></nav>
    <p className="fine footer-note">AI 評估僅供面試練習，不代表實際企業的錄取機率或錄取決策。</p>
  </div></footer>;
}
export function SectionHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="section-heading"><h2>{title}</h2>{children && <p>{children}</p>}</div>;
}
