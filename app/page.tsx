import { MUNICIPALITY_SLUGS, MUNICIPALITIES } from "@/lib/municipalities";
import { prisma } from "@/lib/db";
import MunicipalityCard from "./MunicipalityCard";

async function getStats() {
  try {
    const counts = await Promise.all(
      MUNICIPALITY_SLUGS.map(async (slug) => {
        const [topics, opinions] = await Promise.all([
          prisma.topic.count({ where: { status: "active", municipality: slug } }),
          prisma.opinion.count({ where: { topic: { municipality: slug } } }),
        ]);
        return { slug, topics, opinions };
      })
    );
    return Object.fromEntries(counts.map((c) => [c.slug, c]));
  } catch {
    return {} as Record<string, { topics: number; opinions: number }>;
  }
}

export default async function TopPage() {
  const stats = await getStats();

  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "0 1rem 4rem" }}>
      {/* Hero */}
      <div style={{
        margin: "1.25rem 0 2rem",
        borderRadius: "20px",
        background: `
          radial-gradient(ellipse 120% 80% at 0% 0%, rgba(164,236,215,.45) 0%, transparent 55%),
          radial-gradient(ellipse 90% 70% at 100% 100%, rgba(255,237,213,.65) 0%, transparent 55%),
          linear-gradient(180deg, #ffffff 0%, #ecfdf8 100%)
        `,
        border: "1px solid var(--mc-border-soft)",
        padding: "28px 24px",
        textAlign: "center",
      }}>
        <h1 className="font-logo" style={{
          fontWeight: 900,
          fontSize: "clamp(28px, 6vw, 40px)",
          lineHeight: 1.22,
          color: "var(--mc-ink-900)",
          margin: "0 0 10px",
        }}>
          街の声を、<span style={{ color: "var(--mc-primary-600)" }}>議会へ。</span>
        </h1>
        <p style={{ color: "var(--mc-ink-700)", fontSize: "14px", lineHeight: 1.85, margin: 0 }}>
          地域を選んで、今期の議題を確認しましょう。
        </p>
      </div>

      {/* Municipality cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {MUNICIPALITY_SLUGS.map((slug) => {
          const mc = MUNICIPALITIES[slug];
          const s = stats[slug] ?? { topics: 0, opinions: 0 };
          return (
            <MunicipalityCard
              key={slug}
              mc={mc}
              topics={s.topics}
              opinions={s.opinions}
            />
          );
        })}
      </div>
    </div>
  );
}
