import fs from "fs";
import path from "path";

const BASE = "https://funabashi.gijiroku.com/voices2/cgi/VoiJson.exe";
const KEYWORDS = ["宿泊", "観光", "インバウンド", "交通", "環境", "福祉", "子育て", "教育"];
const OUTPUT_PATH = path.join(process.cwd(), "data", "funabashi-raw.json");

interface VoiHit {
  FINO: string;
  HTGN: string;
  HUID: string;
  KNAM: string;
  NAME: string;
  SBOR: string;
  UNID: string;
  YAKU: string;
}

interface VoiMeeting {
  KGNO: string;
  KGTP: string;
  TITL: string;
  HITCNT: number;
  HITHU: VoiHit[];
}

export interface FunabashiRecord {
  date: string;
  meeting: string;
  speaker: string;
  keyword: string;
  excerpt: string;
  full_text: string;
  source_url: string;
}

function stripHighlight(text: string): string {
  return text.replace(/＜→Ｈ＞/g, "").replace(/＜←＞/g, "").replace(/＜…＞/g, "…");
}

function toHalf(s: string): string {
  return s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

function parseMeetingDate(titl: string): string {
  const normalized = toHalf(titl);
  const m = normalized.match(/令和\s*(\d+)年\s*(\d+)月/);
  if (!m) return "";
  const rYear = parseInt(m[1]);
  const month = m[2].padStart(2, "0");
  const year = 2018 + rYear;
  return `${year}-${month}`;
}

async function fetchSearchResults(keyword: string, page = 1): Promise<VoiMeeting[]> {
  const params = new URLSearchParams({
    AA: "100", RA: "HTGN",
    CA: "0,1,2,3", DA: "1,2,3",
    HB: "", OB: "", PB: "", KA: "", MA: "",
    BB: "1", TA: "SYNONYM",
    SA: keyword,
    BA: String((page - 1) * 15),
    DB: "3", XA: "15",
    QA: String(page), ZA: "UTF8",
  });
  const res = await fetch(`${BASE}?${params}`, {
    headers: { "Referer": "https://funabashi.gijiroku.com/voices2/searchlist.html" },
  });
  const json = await res.json() as { searchlist: { data: VoiMeeting[], hitcount: number, currentpage: number }, status: number };
  if (json.status !== 0) return [];
  return json.searchlist.data ?? [];
}

async function scrapeKeyword(keyword: string): Promise<FunabashiRecord[]> {
  const records: FunabashiRecord[] = [];
  let page = 1;
  let fetched = 0;

  while (true) {
    const meetings = await fetchSearchResults(keyword, page);
    if (meetings.length === 0) break;

    for (const meeting of meetings) {
      const date = parseMeetingDate(meeting.TITL);
      // 直近1年（令和6年4月以降）のみ対象
      if (!date || date < "2024-04") continue;
      const sourceUrl = `https://funabashi.gijiroku.com/voices2/minutes.html?KGNO=${meeting.KGNO}`;

      for (const hit of (meeting.HITHU ?? []).slice(0, 3)) {
        const text = stripHighlight(hit.HTGN ?? "");
        records.push({
          date,
          meeting: meeting.TITL.replace(/\s+/g, " ").trim(),
          speaker: hit.NAME ?? "",
          keyword,
          excerpt: text.slice(0, 300),
          full_text: text,
          source_url: sourceUrl,
        });
      }
      fetched++;
    }

    if (fetched >= 20 || meetings.length < 15) break;
    page++;
    await new Promise(r => setTimeout(r, 1000));
  }

  return records;
}

async function scrape(): Promise<void> {
  if (!fs.existsSync(path.join(process.cwd(), "data"))) {
    fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  }

  const allRecords: FunabashiRecord[] = [];

  for (const keyword of KEYWORDS) {
    console.log(`\n🔍 「${keyword}」を検索中...`);
    try {
      const records = await scrapeKeyword(keyword);
      allRecords.push(...records);
      console.log(`  ✅ ${records.length} 件取得`);
    } catch (err) {
      console.error(`  ❌ エラー:`, err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  // 重複除去（同じ発言テキスト）
  const seen = new Set<string>();
  const unique = allRecords.filter(r => {
    const key = r.excerpt.slice(0, 100);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(unique, null, 2), "utf-8");
  console.log(`\n✅ 完了: ${unique.length} 件（重複除去後）を ${OUTPUT_PATH} に保存`);
}

scrape().catch(err => {
  console.error("致命的なエラー:", err);
  process.exit(1);
});
