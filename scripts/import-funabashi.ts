import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client/index";
import { PrismaPg } from "@prisma/adapter-pg";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";

const INPUT_PATH = path.join(process.cwd(), "data", "funabashi-raw.json");

interface FunabashiRecord {
  date: string;
  meeting: string;
  speaker: string;
  keyword: string;
  excerpt: string;
  full_text: string;
  source_url: string;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.5,
});

async function summarize(text: string, keyword: string): Promise<string> {
  const res = await model.invoke([
    new SystemMessage("あなたは地方議会の議事録を住民向けにわかりやすく要約するアシスタントです。回答は必ず1文・50字以内。それ以上は書かないでください。"),
    new HumanMessage(`以下の議事録の発言を「○○について、△△が審議された。」の形で1文・50字以内で答えてください。\n\nキーワード: ${keyword}\n\n${text.slice(0, 1000)}`),
  ]);
  return typeof res.content === "string" ? res.content : res.content[0]?.toString() ?? "";
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function importData() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error("データファイルが見つかりません。先にスクレイピングを実行してください。");
    process.exit(1);
  }

  const records: FunabashiRecord[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

  // 会議×キーワード単位にグループ化
  const groups: Record<string, FunabashiRecord[]> = {};
  for (const r of records) {
    const key = `${r.meeting}__${r.keyword}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  const groupEntries = Object.entries(groups);
  console.log(`${groupEntries.length} 議題をDBに登録します...`);

  let count = 0;
  for (const [, recs] of groupEntries) {
    const first = recs[0];
    const combinedText = recs.map(r => r.full_text).join("\n\n").slice(0, 2000);

    console.log(`[${++count}/${groupEntries.length}] ${first.meeting.slice(0, 40)}... (${first.keyword})`);

    try {
      const summary = await summarize(combinedText, first.keyword);

      const [year, month] = first.date ? first.date.split("-").map(Number) : [2025, 1];
      const meetingDate = new Date(year, (month || 1) - 1, 1);

      await prisma.topic.create({
        data: {
          municipality: "funabashi",
          title: `${first.keyword}に関する審議 - ${first.meeting}`,
          summary,
          rawText: combinedText,
          meetingDate,
          meetingName: first.meeting,
          keywords: [first.keyword],
          sourceUrl: first.source_url,
          status: "active",
        },
      });

      await sleep(1500);
    } catch (err) {
      console.error(`  ❌ エラー:`, err);
    }
  }

  await prisma.$disconnect();
  console.log(`\n✅ ${count} 件をDBに登録しました`);
}

importData().catch(err => {
  console.error("致命的なエラー:", err);
  process.exit(1);
});
