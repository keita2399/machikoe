import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic, Zen_Kaku_Gothic_New, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const zenMaruGothic = Zen_Maru_Gothic({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "マチコエ | 街の声を、議会へ。",
  description: "富士河口湖町の議会議題をわかりやすく届け、あなたの声を議会へ。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.className} ${zenMaruGothic.className} ${zenKakuGothicNew.className} ${inter.className}`}
    >
      <body>
        {/* Header */}
        <header style={{
          background: "#fff",
          borderBottom: "1px solid var(--mc-border-soft)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            maxWidth: "52rem",
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <span style={{
                width: "32px", height: "32px",
                borderRadius: "8px",
                background: "var(--mc-primary-500)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 15c2-4 4-4 6 0s4 4 6 0 4-4 6 0" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </span>
              <div>
                <div className="font-logo" style={{ fontWeight: 700, fontSize: "18px", color: "var(--mc-ink-900)", lineHeight: 1.1 }}>マチコエ</div>
                <div style={{ fontSize: "10px", color: "var(--mc-ink-500)", letterSpacing: "0.08em", lineHeight: 1, marginTop: "1px" }}>Fujikawaguchiko</div>
              </div>
            </Link>
            <nav style={{ display: "flex", gap: "4px" }}>
              <Link href="/" style={{
                fontSize: "13.5px",
                color: "var(--mc-ink-700)",
                padding: "7px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 500,
                transition: "background .15s",
              }}>
                議題一覧
              </Link>
              <Link href="/dashboard" style={{
                fontSize: "13.5px",
                color: "var(--mc-ink-700)",
                padding: "7px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 500,
                transition: "background .15s",
              }}>
                みんなの声
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer style={{
          background: "#fff",
          borderTop: "1px solid var(--mc-border-soft)",
          marginTop: "4rem",
          padding: "1.25rem 1rem",
        }}>
          <div style={{
            maxWidth: "52rem",
            margin: "0 auto",
            textAlign: "center",
            fontSize: "11px",
            color: "var(--mc-ink-400)",
            lineHeight: 1.9,
          }}>
            <p style={{ margin: 0 }}>マチコエは行政を攻撃するツールではなく、住民と議会の「橋渡し」を目指します。</p>
            <p style={{ margin: 0 }}>意見の送信は必ずご本人がボタンを押してください。自動送信は行いません。</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
