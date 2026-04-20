import fs from "fs";
import path from "path";

const INPUT_PATH = path.join(process.cwd(), "data", "kaigiroku-raw.json");

interface KaigirokuRecord {
  date: string;
  meeting: string;
  speaker: string;
  keyword: string;
  excerpt: string;
  full_text: string;
  source_url: string;
}

function summarize() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error("❌ データファイルが見つかりません:", INPUT_PATH);
    console.log("先に scrape-kaigiroku.ts を実行してください。");
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const records: KaigirokuRecord[] = JSON.parse(raw);

  console.log("=== 議事録データサマリー ===\n");
  console.log(`総件数: ${records.length} 件`);

  const dates = records.map((r) => r.date).filter(Boolean).sort();
  if (dates.length > 0) {
    console.log(`日付範囲: ${dates[0]} 〜 ${dates[dates.length - 1]}`);
  }

  console.log("\n--- キーワード別件数 ---");
  const byKeyword: Record<string, number> = {};
  for (const r of records) {
    byKeyword[r.keyword] = (byKeyword[r.keyword] || 0) + 1;
  }
  for (const [kw, count] of Object.entries(byKeyword)) {
    console.log(`  ${kw}: ${count} 件`);
  }

  console.log("\n--- 会議別件数（上位10件）---");
  const byMeeting: Record<string, number> = {};
  for (const r of records) {
    const key = r.meeting?.slice(0, 30) || "不明";
    byMeeting[key] = (byMeeting[key] || 0) + 1;
  }
  const sortedMeetings = Object.entries(byMeeting)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [meeting, count] of sortedMeetings) {
    console.log(`  ${meeting}: ${count} 件`);
  }

  console.log("\n--- サンプルデータ（先頭3件）---");
  for (const r of records.slice(0, 3)) {
    console.log(`\n[${r.date}] ${r.meeting}`);
    console.log(`キーワード: ${r.keyword}`);
    console.log(`抜粋: ${r.excerpt.slice(0, 100)}...`);
    console.log(`URL: ${r.source_url}`);
  }
}

summarize();
