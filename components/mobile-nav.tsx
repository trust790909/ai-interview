"use client";

import { useRef } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

export function MobileNav({ links }: { links: string[][] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => { if (menu.current) menu.current.open = false; };
  return <details ref={menu} className="mobile-nav" onKeyDown={e => {
    if (e.key === "Escape" && menu.current?.open) {
      close();
      menu.current.querySelector("summary")?.focus();
    }
  }}>
    <summary aria-label="開啟導覽"><Menu size={23} /></summary>
    <nav aria-label="手機導覽">
      {links.map(([href, label]) => <Link key={href} href={href} onClick={close}>{label}</Link>)}
      <Link href="/interview" onClick={close}>免費開始模擬</Link>
    </nav>
  </details>;
}
