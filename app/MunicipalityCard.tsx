"use client";

import Link from "next/link";
import Image from "next/image";
import { Municipality } from "@/lib/municipalities";

interface Props {
  mc: Municipality;
  topics: number;
  opinions: number;
}

export default function MunicipalityCard({ mc, topics, opinions }: Props) {
  return (
    <Link href={`/${mc.slug}`} style={{ textDecoration: "none" }}>
      <div
        className="municipality-card"
        style={{
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid var(--mc-border-soft)",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          transition: "box-shadow .15s, transform .15s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,.08)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.04)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        <div style={{ height: "120px", overflow: "hidden" }}>
          <Image
            src={mc.hero}
            alt={mc.heroAlt}
            width={832}
            height={320}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <div style={{ padding: "16px 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: "18px", color: "var(--mc-ink-900)" }}>
                {mc.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--mc-ink-500)", marginTop: "2px" }}>
                {mc.tagline}
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mc-primary-500)" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "12px", color: "var(--mc-ink-500)" }}>
            <span>議題 <b className="font-num" style={{ color: "var(--mc-ink-900)", fontWeight: 600 }}>{topics}</b> 件</span>
            <span>·</span>
            <span>みんなの声 <b className="font-num" style={{ color: mc.color, fontWeight: 600 }}>{opinions}</b> 件</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
