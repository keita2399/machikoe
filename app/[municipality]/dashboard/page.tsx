import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMunicipality } from "@/lib/municipalities";

type OpinionRow = { id: string; stance: string; content: string; createdAt: Date };
type TopicRow = {
  id: string;
  title: string;
  opinions: OpinionRow[];
  _count: { opinions: number };
};

async function getDashboardData(municipality: string) {
  try {
    return await prisma.topic.findMany({
      where: { status: "active", municipality },
      include: {
        opinions: { orderBy: { createdAt: "desc" } },
        _count: { select: { opinions: true } },
      },
      orderBy: { meetingDate: "desc" },
    });
  } catch {
    return [];
  }
}

const stanceMeta: Record<string, { label: string; color: string; barColor: string; bg: string }> = {
  agree:       { label: "賛成",        color: "var(--mc-agree-700)",   barColor: "var(--mc-agree-500)",   bg: "var(--mc-agree-100)" },
  disagree:    { label: "反対",        color: "var(--mc-against-700)", barColor: "var(--mc-against-500)", bg: "var(--mc-against-100)" },
  conditional: { label: "条件付き賛成", color: "var(--mc-cond-700)",    barColor: "var(--mc-cond-500)",    bg: "var(--mc-cond-100)" },
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ municipality: string }>;
}) {
  const { municipality } = await params;
  const mc = getMunicipality(municipality);
  if (!mc) notFound();

  const topics = await getDashboardData(municipality);
  const totalOpinions = topics.reduce((sum: number, t: TopicRow) => sum + t._count.opinions, 0);

  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "0 1rem 4rem" }}>
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Link href={`/${municipality}`} style={{ fontSize: "12px", color: "var(--mc-ink-500)" }}>← {mc.name}</Link>
        </div>
        <div className="eyebrow-label" style={{ marginBottom: "6px" }}>Community</div>
        <h1 className="font-display" style={{ fontWeight: 700, fontSize: "26px", color: "var(--mc-ink-900)", margin: "0 0 6px" }}>
          みんなの声
        </h1>
        <p style={{ fontSize: "14px", color: "var(--mc-ink-700)", margin: 0 }}>
          住民の意見を集計した結果です。合計{" "}
          <b className="font-num" style={{ color: "var(--mc-ink-900)" }}>{totalOpinions}</b>{" "}
          件の意見が集まっています。
        </p>
      </div>

      {topics.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--mc-border-soft)", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📊</div>
          <p style={{ color: "var(--mc-ink-500)", margin: 0 }}>まだデータがありません</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {topics.map((topic: TopicRow) => {
            const counts = { agree: 0, disagree: 0, conditional: 0 };
            for (const op of topic.opinions) {
              if (op.stance in counts) counts[op.stance as keyof typeof counts]++;
            }
            const total = topic._count.opinions;

            return (
              <div key={topic.id} className="surface-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                  <h2 className="font-display" style={{ fontWeight: 700, fontSize: "16px", lineHeight: 1.5, color: "var(--mc-ink-900)", margin: 0 }}>
                    {topic.title}
                  </h2>
                  <span className="font-num" style={{ flexShrink: 0, fontSize: "12px", color: "var(--mc-ink-500)", background: "var(--mc-bg-soft)", padding: "3px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                    {total} 件
                  </span>
                </div>

                {total > 0 ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                      {(["agree", "conditional", "disagree"] as const).map((s) => {
                        const count = counts[s];
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const m = stanceMeta[s];
                        return (
                          <div key={s} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 500, width: "80px", flexShrink: 0, color: m.color }}>
                              {m.label}
                            </span>
                            <div className="bar-track" style={{ flex: 1 }}>
                              <div className="bar-fill" style={{ width: `${pct}%`, background: m.barColor }} />
                            </div>
                            <span className="font-num" style={{ fontSize: "12px", color: "var(--mc-ink-500)", width: "64px", textAlign: "right", flexShrink: 0 }}>
                              {pct}%（{count}）
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: "1px solid var(--mc-border-soft)", paddingTop: "14px" }}>
                      <div className="eyebrow-label" style={{ marginBottom: "10px" }}>最新の意見</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {topic.opinions.slice(0, 3).map((op: OpinionRow) => {
                          const m = stanceMeta[op.stance] ?? { label: op.stance, color: "var(--mc-ink-500)", bg: "var(--mc-bg-soft)" };
                          return (
                            <div key={op.id} style={{ background: "var(--mc-bg)", borderRadius: "10px", padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 500, color: m.color, background: m.bg, padding: "2px 8px", borderRadius: "999px" }}>
                                  {m.label}
                                </span>
                                <span style={{ fontSize: "11px", color: "var(--mc-ink-400)", fontFamily: "'Inter', sans-serif" }}>
                                  {new Date(op.createdAt).toLocaleDateString("ja-JP")}
                                </span>
                              </div>
                              <p style={{ fontSize: "12.5px", color: "var(--mc-ink-700)", lineHeight: 1.8, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {op.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--mc-ink-400)", textAlign: "center", padding: "12px 0" }}>
                    まだ意見がありません
                  </p>
                )}

                <div style={{ marginTop: "14px", textAlign: "right" }}>
                  <Link href={`/${municipality}/topics/${topic.id}`} className="btn-mc-primary" style={{ fontSize: "12.5px", padding: "7px 12px" }}>
                    この議題に意見する →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
