"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Topic = {
  id: string;
  title: string;
  summary: string;
  meetingDate: string;
  meetingName: string;
  keywords: string[];
  sourceUrl: string | null;
};

type UserType = "resident" | "business" | "other";

const kwMap: Record<string, { cls: string }> = {
  観光:              { cls: "kw-tour" },
  インバウンド:      { cls: "kw-tour" },
  宿泊税:            { cls: "kw-econ" },
  オーバーツーリズム:{ cls: "kw-env" },
  混雑:              { cls: "kw-infra" },
};

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [impact, setImpact] = useState<string>("");
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/topics/${id}`)
      .then((r) => r.json())
      .then((data) => { setTopic(data?.id ? data : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSelectUserType(type: UserType) {
    setUserType(type);
    setLoadingImpact(true);
    setImpact("");
    try {
      const res = await fetch(`/api/topics/${id}/impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType: type }),
      });
      const data = await res.json();
      setImpact(data.impact);
    } catch {
      setImpact("影響の説明を取得できませんでした。");
    } finally {
      setLoadingImpact(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "4rem 1rem", textAlign: "center", color: "var(--mc-ink-500)" }}>
        読み込み中...
      </div>
    );
  }

  if (!topic) {
    return (
      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "4rem 1rem", textAlign: "center" }}>
        <p style={{ color: "var(--mc-ink-500)" }}>議題が見つかりません</p>
        <Link href="/" style={{ color: "var(--mc-primary-700)", fontSize: "14px" }}>← 一覧に戻る</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1rem 4rem" }}>
      {/* Back */}
      <div style={{ padding: "12px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="icon-btn" aria-label="戻る" style={{ border: "none" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <span style={{ fontSize: "12px", color: "var(--mc-ink-500)", letterSpacing: "0.1em", fontFamily: "'Inter', sans-serif" }}>
          議題 / {topic.keywords?.[0] || "詳細"}
        </span>
        <span style={{ width: "36px" }} />
      </div>

      {/* Topic summary */}
      <div style={{ padding: "8px 0 14px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
          {(topic.keywords ?? []).map((kw) => (
            <span key={kw} className={`kw-badge ${(kwMap[kw] ?? {}).cls ?? ""}`}>
              <span className="kw-dot" />{kw}
            </span>
          ))}
        </div>
        <h1 className="font-display" style={{ fontWeight: 700, fontSize: "22px", lineHeight: 1.4, color: "var(--mc-ink-900)", margin: "0 0 8px" }}>
          {topic.title?.split(" - ")[0] ?? topic.title}
        </h1>
        <p style={{ fontSize: "13.5px", lineHeight: 1.85, color: "var(--mc-ink-700)", margin: 0 }}>
          {topic.summary}
        </p>
        <p style={{ fontSize: "11px", color: "var(--mc-ink-400)", marginTop: "8px" }}>
          {new Date(topic.meetingDate).toLocaleDateString("ja-JP")} · {topic.meetingName}
        </p>
      </div>

      {/* User type selector */}
      <div className="surface-card" style={{ marginBottom: "14px" }}>
        <div className="eyebrow-label" style={{ marginBottom: "12px" }}>あなたの立場は？</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {(["resident", "business"] as UserType[]).map((type) => {
            const isSelected = userType === type;
            const labels: Record<string, { title: string; sub: string }> = {
              resident: { title: "住民として", sub: "町内に住んでいる立場" },
              business: { title: "事業者として", sub: "町内で商売している立場" },
            };
            return (
              <button
                key={type}
                onClick={() => handleSelectUserType(type)}
                style={{
                  padding: "14px 12px",
                  borderRadius: "14px",
                  border: isSelected ? "0" : "1.5px solid var(--mc-border)",
                  background: isSelected ? "var(--mc-primary-500)" : "#fff",
                  color: isSelected ? "#fff" : "var(--mc-ink-900)",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 14px rgba(14,110,86,.28)" : "none",
                  transition: "all .16s ease",
                }}
              >
                {isSelected && (
                  <div style={{ fontSize: "11px", opacity: 0.85, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px", fontFamily: "'Inter', sans-serif" }}>
                    選択中
                  </div>
                )}
                {!isSelected && (
                  <div style={{ fontSize: "11px", color: "var(--mc-ink-500)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px", fontFamily: "'Inter', sans-serif" }}>
                    選ぶ
                  </div>
                )}
                <div className="font-display" style={{ fontSize: "15px", fontWeight: 700 }}>{labels[type].title}</div>
                <div style={{ fontSize: "11.5px", marginTop: "2px", opacity: isSelected ? 0.9 : undefined, color: isSelected ? undefined : "var(--mc-ink-500)" }}>
                  {labels[type].sub}
                </div>
              </button>
            );
          })}
        </div>
        {/* Other option */}
        <button
          onClick={() => handleSelectUserType("other")}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: userType === "other" ? "0" : "1px solid var(--mc-border-soft)",
            background: userType === "other" ? "var(--mc-bg-soft)" : "transparent",
            color: "var(--mc-ink-500)",
            fontSize: "13px",
            cursor: "pointer",
            textAlign: "center",
            transition: "all .16s",
          }}
        >
          その他の立場
        </button>
      </div>

      {/* AI impact card */}
      {userType && (
        <div className="ai-card" style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span className="ai-badge__icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
              </svg>
            </span>
            <span className="ai-badge">AIが説明します</span>
          </div>

          <h3 className="font-display" style={{ fontWeight: 700, fontSize: "15px", color: "var(--mc-ink-900)", marginBottom: "10px" }}>
            {userType === "resident" ? "住民" : userType === "business" ? "事業者" : "あなた"}のへの影響
          </h3>

          {loadingImpact ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--mc-primary-600)", padding: "8px 0" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-6.2-8.56"/>
              </svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              分析中...
            </div>
          ) : (
            <p style={{ fontSize: "13.5px", lineHeight: 1.85, color: "var(--mc-ink-700)", margin: 0 }}>{impact}</p>
          )}

          <p style={{ fontSize: "11px", color: "var(--mc-ink-400)", marginTop: "10px" }}>
            ※ AIによる整理です。
            {topic.sourceUrl ? (
              <>
                {" "}<a href={topic.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--mc-primary-600)", textDecoration: "underline" }}>議案原文はこちら</a>
              </>
            ) : (
              "議案原文も確認されることをお勧めします。"
            )}
          </p>
        </div>
      )}

      {/* CTA */}
      {userType && !loadingImpact && impact && (
        <div>
          <button
            onClick={() => router.push(`/topics/${id}/opinion?userType=${userType}`)}
            className="btn-mc-primary btn-mc-primary--lg"
            style={{ width: "100%", justifyContent: "center" }}
          >
            意見を伝える
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
          <p style={{ textAlign: "center", fontSize: "11.5px", color: "var(--mc-ink-500)", marginTop: "8px" }}>
            30秒で完了 · アプリへの投稿は匿名
          </p>
        </div>
      )}
    </div>
  );
}
