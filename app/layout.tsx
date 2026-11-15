import type { Metadata } from "next";
import { Footer, Header } from "@/components/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-interview-ruddy-eight.vercel.app"),
  title: { default: "AI 面試模擬器", template: "%s｜AI 面試模擬器" },
  description: "貼上職缺描述，進行 AI 模擬面試，取得能力評分與逐題改善建議。",
  referrer: "no-referrer",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "AI 面試模擬器",
    title: "AI 面試模擬器｜練習一下，上場更有自信",
    description: "貼上職缺描述，讓 AI 陪你練面試，回答後還能查看逐題回饋。",
    images: [{ url: "/interview-share-v2.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "戴著麥克風的藍色機器人陪你練面試" }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/interview-mascot-blue.png", type: "image/png", sizes: "192x192" },
      { url: "/interview-mascot-blue.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: "/interview-mascot-blue.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body><a className="skip" href="#main">跳至主要內容</a><Header /><main id="main">{children}</main><Footer /></body></html>;
}
