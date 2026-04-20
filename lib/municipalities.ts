export type MunicipalitySlug = "fujikawaguchiko" | "funabashi";

export interface Municipality {
  slug: MunicipalitySlug;
  name: string;
  nameEn: string;
  hero: string;
  heroAlt: string;
  color: string;
  tagline: string;
  xHandle: string;
  xHashtags: string;
  inquiryUrl: string;
  inquiryNote: string;
}

export const MUNICIPALITIES: Record<MunicipalitySlug, Municipality> = {
  fujikawaguchiko: {
    slug: "fujikawaguchiko",
    name: "富士河口湖町",
    nameEn: "Fujikawaguchiko",
    hero: "/hero-day.png",
    heroAlt: "河口湖と富士山",
    color: "#0ea57e",
    tagline: "富士山麓の自然と観光のまち",
    xHandle: "@kawaguchikotown",
    xHashtags: "#富士河口湖 #マチコエ",
    inquiryUrl: "https://www.town.fujikawaguchiko.lg.jp/inquiry/inquiry.php",
    inquiryNote: "電話でも受け付けています：政策企画課 ☎ 0555-72-1129（平日 8:30〜17:15）",
  },
  funabashi: {
    slug: "funabashi",
    name: "船橋市",
    nameEn: "Funabashi",
    hero: "/hero-funabashi.svg",
    heroAlt: "船橋市のスイカと梨",
    color: "#16a34a",
    tagline: "千葉県最大の都市・船橋",
    xHandle: "@funabashi_city",
    xHashtags: "#船橋市 #マチコエ",
    inquiryUrl: "https://www.city.funabashi.lg.jp/inquiry/",
    inquiryNote: "電話でも受け付けています：市政情報センター ☎ 047-436-2100（平日 8:30〜17:00）",
  },
};

export function getMunicipality(slug: string): Municipality | null {
  return MUNICIPALITIES[slug as MunicipalitySlug] ?? null;
}

export const MUNICIPALITY_SLUGS = Object.keys(MUNICIPALITIES) as MunicipalitySlug[];
