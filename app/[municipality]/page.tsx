import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getMunicipality } from "@/lib/municipalities";

async function getData(municipality: string) {
  try {
    const topics = await prisma.topic.findMany({
      where: { status: "active", municipality },
      orderBy: { meetingDate: "desc" },
      include: { _count: { select: { opinions: true } } },
    });
    const totalOpinions = topics.reduce((sum, t) => sum + t._count.opinions, 0);
    return { topics, totalOpinions };
  } catch {
    return { topics: [], totalOpinions: 0 };
  }
}

const kwMap: Record<string, { cls: string; accent: string }> = {
  観光:              { cls: "kw-tour",  accent: "var(--cat-tour)" },
  インバウンド:      { cls: "kw-tour",  accent: "var(--cat-tour)" },
  宿泊税:            { cls: "kw-econ",  accent: "var(--cat-econ)" },
  オーバーツーリズム:{ cls: "kw-env",   accent: "var(--cat-env)" },
  混雑:              { cls: "kw-infra", accent: "var(--cat-infra)" },
};
const defaultKw = { cls: "", accent: "var(--mc-primary-500)" };

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ municipality: string }>;
}) {
  const { municipality } = await params;
  const mc = getMunicipality(municipality);
  if (!mc) notFound();

  const { topics, totalOpinions } = await getData(municipality);

  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "0 1rem 4rem" }}>

      {/* Hero */}
      <div style={{
        margin: "1.25rem 0 1.5rem",
        borderRadius: "20px",
        overflow: "hidden",
        background: `
          radial-gradient(ellipse 120% 80% at 0% 0%, rgba(164,236,215,.45) 0%, transparent 55%),
          radial-gradient(ellipse 90% 70% at 100% 100%, rgba(255,237,213,.65) 0%, transparent 55%),
          linear-gradient(180deg, #ffffff 0%, #ecfdf8 100%)
        `,
        border: "1px solid var(--mc-border-soft)",
        padding: "24px 24px 0",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <h1 className="font-logo" style={{
            fontWeight: 900,
            fontSize: "clamp(26px, 6vw, 38px)",
            lineHeight: 1.22,
            color: "var(--mc-ink-900)",
            margin: 0,
          }}>
            街の声を、<br />
            <span style={{ color: "var(--mc-primary-600)" }}>議会へ。</span>
          </h1>
          <div style={{ fontSize: "11px", color: "var(--mc-ink-500)", textAlign: "right", flexShrink: 0, paddingTop: "4px", lineHeight: 1.6 }}>
            <div>{mc.name}</div>
            <div style={{ letterSpacing: "0.06em" }}>{mc.nameEn}</div>
          </div>
        </div>

        <p style={{ color: "var(--mc-ink-700)", fontSize: "13.5px", lineHeight: 1.85, marginTop: "10px" }}>
          読んで、ちょっと考えて、ひと言だけ。<br />
          それだけで、まちの決定は動きはじめます。
        </p>

        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--mc-ink-500)", marginTop: "10px" }}>
          <span>今期の議題 <b className="font-num" style={{ color: "var(--mc-ink-900)", fontWeight: 600 }}>{topics.length}</b></span>
          <span>·</span>
          <Link href={`/${municipality}/dashboard`} style={{ textDecoration: "none", color: "inherit" }}>みんなの声 <b className="font-num" style={{ color: "var(--mc-primary-600)", fontWeight: 600 }}>{totalOpinions}</b></Link>
        </div>

        <div style={{ marginTop: "16px", height: "160px", borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
          <Image
            src={mc.hero}
            alt={mc.heroAlt}
            width={832}
            height={320}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            priority
          />
        </div>
      </div>

      {/* Section heading */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "4px 2px 10px" }}>
        <div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: "17px", color: "var(--mc-ink-900)" }}>今期の議題</div>
          <div style={{ fontSize: "11.5px", color: "var(--mc-ink-500)", letterSpacing: "0.04em", marginTop: "2px" }}>{topics.length} 件</div>
        </div>
      </div>

      {/* Cards */}
      {topics.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--mc-border-soft)", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</div>
          <p style={{ color: "var(--mc-ink-500)", fontWeight: 500, margin: "0 0 4px" }}>まだ議題が登録されていません</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {topics.map((topic) => {
            const firstKw = topic.keywords[0] ?? "";
            const firstMeta = kwMap[firstKw] ?? defaultKw;
            return (
              <article
                key={topic.id}
                className="topic-card"
                style={{ "--accent-color": firstMeta.accent } as React.CSSProperties}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {topic.keywords.map((kw) => {
                      const m = kwMap[kw] ?? defaultKw;
                      return (
                        <span key={kw} className={`kw-badge ${m.cls}`}>
                          <span className="kw-dot" />
                          {kw}
                        </span>
                      );
                    })}
                  </div>
                  <span className="font-num" style={{ fontSize: "11px", color: "var(--mc-ink-500)", flexShrink: 0 }}>
                    {new Date(topic.meetingDate).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                  </span>
                </div>

                <h2 className="font-display" style={{
                  fontWeight: 700, fontSize: "16px", lineHeight: 1.55,
                  color: "var(--mc-ink-900)", margin: "8px 0 6px",
                }}>
                  {topic.title.split(" - ")[0]}
                </h2>

                <p style={{ color: "var(--mc-ink-700)", fontSize: "13px", lineHeight: 1.85, margin: 0 }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "10px", fontWeight: 500,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "var(--mc-primary-700)",
                    background: "var(--mc-primary-50)",
                    padding: "3px 6px", borderRadius: "4px",
                    marginRight: "6px",
                    verticalAlign: "middle",
                  }}>AI要約</span>
                  {topic.summary}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--mc-ink-500)" }}>
                    みんなの声 <b className="font-num" style={{ color: "var(--mc-ink-900)", fontWeight: 500 }}>{topic._count.opinions}</b>
                  </span>
                  <Link href={`/${municipality}/topics/${topic.id}`} className="btn-mc-primary">
                    自分への影響を見る →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
