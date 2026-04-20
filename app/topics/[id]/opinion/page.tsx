"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type Stance = "agree" | "disagree" | "conditional";
type UserType = "resident" | "business" | "other";

type Topic = {
  id: string;
  title: string;
  summary: string;
};

const stanceMeta: Record<Stance, { label: string; btnClass: string }> = {
  agree:       { label: "賛成",       btnClass: "stance-btn--agree" },
  conditional: { label: "条件付き賛成", btnClass: "stance-btn--cond" },
  disagree:    { label: "反対",       btnClass: "stance-btn--against" },
};

export default function OpinionPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const userType = (searchParams.get("userType") as UserType) ?? "resident";

  const [topic, setTopic] = useState<Topic | null>(null);
  const [stance, setStance] = useState<Stance | null>(null);
  const [draft, setDraft] = useState("");
  const [editedDraft, setEditedDraft] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/topics/${id}`)
      .then((r) => r.json())
      .then(setTopic)
      .catch(() => null);
  }, [id]);

  async function handleSelectStance(s: Stance) {
    setStance(s);
    setDraft("");
    setEditedDraft("");
    setLoadingDraft(true);
    try {
      const res = await fetch(`/api/topics/${id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stance: s, userType }),
      });
      const data = await res.json();
      setDraft(data.draft);
      setEditedDraft(data.draft);
    } catch {
      setEditedDraft("意見の下書きを生成できませんでした。直接入力してください。");
    } finally {
      setLoadingDraft(false);
    }
  }

  async function handleSubmit() {
    if (!stance || !editedDraft.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/opinions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: id, stance, userType, content: editedDraft.trim() }),
      });
      setSubmitted(true);
    } catch {
      alert("送信に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  function handleXShareToTown() {
    const text = encodeURIComponent(`@kawaguchikotown ${editedDraft}\n\n#富士河口湖 #マチコエ`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    window.open("https://www.town.fujikawaguchiko.lg.jp/inquiry/inquiry.php", "_blank");
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "4rem 1rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h2 className="font-display" style={{ fontWeight: 700, fontSize: "22px", color: "var(--mc-ink-900)", margin: "0 0 8px" }}>
          ご意見を記録しました
        </h2>
        <p style={{ color: "var(--mc-ink-700)", fontSize: "14px", lineHeight: 1.85 }}>
          あなたの声が集まって、議会への橋渡しになります。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
          <button onClick={handleXShareToTown} className="btn-mc-ghost" style={{ justifyContent: "center", padding: "12px 20px", width: "100%" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.7 7.6H.5l8.6-9.8L.1 1.2h7.6l5.2 6.9L18.9 1.2zm-1.3 19.4h2L6.6 3.3H4.5L17.6 20.6z"/>
            </svg>
            町役場に届ける（@kawaguchikotown）
          </button>
          <button onClick={handleCopy} className="btn-mc-ghost" style={{ justifyContent: "center", padding: "12px 20px", width: "100%" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            {copied ? "✅ コピーしました" : "パブコメ用にコピー"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "2rem" }}>
          <Link href="/dashboard" className="btn-mc-primary" style={{ justifyContent: "center", padding: "12px 20px" }}>
            みんなの声を見る →
          </Link>
          <Link href="/" style={{ display: "block", textAlign: "center", fontSize: "13.5px", color: "var(--mc-primary-700)" }}>
            ← 議題一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1rem 4rem" }}>
      {/* Back */}
      <div style={{ padding: "12px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href={`/topics/${id}`} className="icon-btn" aria-label="戻る" style={{ border: "none" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <span style={{ fontSize: "12px", color: "var(--mc-ink-500)", letterSpacing: "0.1em", fontFamily: "'Inter', sans-serif" }}>
          意見を伝える
        </span>
        <span style={{ width: "36px" }} />
      </div>

      {/* Topic compact */}
      {topic && (
        <div style={{ padding: "6px 0 14px" }}>
          <h2 className="font-display" style={{ fontWeight: 700, fontSize: "17px", lineHeight: 1.5, color: "var(--mc-ink-900)", margin: 0 }}>
            {topic.title?.split(" - ")[0] ?? topic.title}
          </h2>
        </div>
      )}

      {/* Stance selection */}
      <div className="surface-card" style={{ marginBottom: "14px" }}>
        <div className="eyebrow-label" style={{ marginBottom: "12px" }}>あなたの立場</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(["agree", "conditional", "disagree"] as Stance[]).map((s) => {
            const m = stanceMeta[s];
            return (
              <button
                key={s}
                onClick={() => handleSelectStance(s)}
                className={`stance-btn ${m.btnClass}${stance === s ? " is-selected" : ""}`}
              >
                <span className="stance-btn__dot" />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI draft */}
      {stance && (
        <div className="ai-card" style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="ai-badge__icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
                </svg>
              </span>
              <span className="ai-badge">AIの下書き</span>
            </div>
            {draft && (
              <button
                onClick={() => handleSelectStance(stance)}
                style={{ fontSize: "11.5px", color: "var(--mc-ink-500)", background: "none", border: "0", cursor: "pointer" }}
              >
                書き直す ↻
              </button>
            )}
          </div>

          {loadingDraft ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--mc-primary-600)", padding: "12px 0" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-6.2-8.56"/>
              </svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              下書きを生成中...
            </div>
          ) : (
            <>
              <div style={{ fontSize: "11.5px", color: "var(--mc-ink-400)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                クリックして自由に編集できます
              </div>
              <textarea
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  minHeight: "150px",
                  border: "1px solid var(--mc-border)",
                  borderRadius: "10px",
                  padding: "12px",
                  resize: "vertical",
                  fontFamily: "var(--mc-font-body)",
                  fontSize: "13.5px",
                  lineHeight: 1.9,
                  color: "var(--mc-ink-900)",
                  background: "var(--mc-bg)",
                  outline: "none",
                  transition: "border-color .15s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--mc-primary-400)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--mc-border)"}
                placeholder="意見を入力してください..."
              />
            </>
          )}

          <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--mc-ink-500)", marginTop: "6px" }}>
            <span>文字数 <b className="font-num" style={{ color: "var(--mc-ink-900)", fontWeight: 500 }}>{editedDraft.length}</b></span>
            <span>·</span>
            <span>提出前に編集できます</span>
          </div>
        </div>
      )}

      {/* Share / submit */}
      {stance && !loadingDraft && (
        <div>
          <div className="eyebrow-label" style={{ marginBottom: "12px" }}>どう届ける？</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={handleSubmit}
              disabled={!editedDraft.trim() || submitting}
              className="btn-mc-primary btn-mc-primary--lg"
              style={{ width: "100%", justifyContent: "space-between", opacity: (!editedDraft.trim() || submitting) ? 0.45 : 1 }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 5l7 7-7 7M12 19h9"/>
                </svg>
                {submitting ? "送信中..." : "みんなの声に投稿する"}
              </span>
              <span style={{ opacity: 0.85 }}>→</span>
            </button>

            <button onClick={handleXShareToTown} className="btn-mc-ghost" style={{ width: "100%", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.7 7.6H.5l8.6-9.8L.1 1.2h7.6l5.2 6.9L18.9 1.2zm-1.3 19.4h2L6.6 3.3H4.5L17.6 20.6z"/>
                </svg>
                町役場に届ける
              </span>
              <span style={{ color: "var(--mc-ink-400)", fontSize: "12px" }}>@kawaguchikotown に送る</span>
            </button>

            <button onClick={handleCopy} className="btn-mc-ghost" style={{ width: "100%", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {copied ? "✅ コピーしました" : "パブコメ用にコピー"}
              </span>
              <span style={{ color: "var(--mc-ink-400)", fontSize: "12px" }}>コピー＋フォームを開く</span>
            </button>

            {/* コピー後の提出先案内 */}
            {copied && (
              <div style={{
                background: "var(--mc-primary-50)",
                border: "1px solid var(--mc-primary-200)",
                borderRadius: "12px",
                padding: "14px 16px",
                fontSize: "13px",
                color: "var(--mc-ink-700)",
                lineHeight: 1.75,
              }}>
                ✅ 文章をコピーして町の問い合わせフォームを開きました。<br />
                「ご意見・ご要望」欄にそのまま貼り付けて送信してください。<br />
                <span style={{ fontSize: "12px", color: "var(--mc-ink-400)" }}>
                  電話でも受け付けています：政策企画課 ☎ 0555-72-1129（平日 8:30〜17:15）
                </span>
              </div>
            )}
          </div>

          <p style={{ marginTop: "12px", fontSize: "11.5px", textAlign: "center", color: "var(--mc-ink-400)" }}>
            ※「みんなの声に投稿」は匿名で記録されます。Xへの投稿はアカウント名が表示されます。
          </p>
        </div>
      )}
    </div>
  );
}
