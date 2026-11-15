import type { Metadata } from "next";
import { Footer, Header } from "@/components/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AI 面試模擬器", template: "%s｜AI 面試模擬器" },
  description: "貼上職缺描述，進行 AI 模擬面試，取得能力評分與逐題改善建議。",
  referrer: "no-referrer",
  icons: { icon: "/interview-icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body><a className="skip" href="#main">跳至主要內容</a><Header /><main id="main">{children}</main><Footer /></body></html>;
}
