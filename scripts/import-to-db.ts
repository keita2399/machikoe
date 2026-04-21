import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client/index";
import { PrismaPg } from "@prisma/adapter-pg";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";

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

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.5,
});

async function summarize(text: string, keyword: string): Promise<string> {
  const res = await model.invoke([
    new SystemMessage("あなたは地方議会の議事録を住民向けにわかりやすく要約するアシスタントです。専門用語を避け、3行以内で簡潔に要約してください。"),
    new HumanMessage(`以下の議事録の発言を、住民が「自分ごと」として理解できるよう3行以内で要約してください。\n\nキーワード: ${keyword}\n\n${text.slice(0, 1000)}`),
  ]);
  return typeof res.content === "string" ? res.content : res.content[0]?.toString() ?? "";
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendLineNotification(titles: string[]): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN_FUJIKAWAGUCHIKO;
  const userId = process.env.LINE_USER_ID_FUJIKAWAGUCHIKO;
  if (!token || !userId) return;

  const list = titles.map((t) => `・${t}`).join("\n");
  const text = `📋 富士河口湖町 新着議題 ${titles.length}件\n\n${list}\n\nhttps://machikoe.vercel.app/fujikawaguchiko`;

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
  });
}

async function importData() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error("データファイルが見つかりません。先にスクレイピングを実行してください。");
    process.exit(1);
  }

  const records: KaigirokuRecord[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

  // 会議単位にグループ化
  const groups: Record<string, KaigirokuRecord[]> = {};
  for (const r of records) {
    const key = `${r.meeting}__${r.keyword}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  const groupEntries = Object.entries(groups);
  console.log(`${groupEntries.length} 議題をDBに登録します...`);

  let count = 0;
  const newTitles: string[] = [];
  for (const [, recs] of groupEntries) {
    const first = recs[0];
    const combinedText = recs.map((r) => r.full_text).join("\n\n").slice(0, 2000);

    console.log(`[${++count}/${groupEntries.length}] ${first.meeting.slice(0, 40)}... (${first.keyword})`);

    try {
      const meetingNameShort = first.meeting.split("(")[0].trim();
      const existing = await prisma.topic.findFirst({
        where: { municipality: "fujikawaguchiko", meetingName: meetingNameShort, keywords: { has: first.keyword } },
      });
      if (existing) {
        console.log(`  ⏭ スキップ（既存）`);
        continue;
      }

      const summary = await summarize(combinedText, first.keyword);

      // 日付パース
      const yearMatch = first.meeting.match(/(\d+)年/);
      const monthMatch = first.meeting.match(/(\d+)月/);
      const year = yearMatch ? 2018 + parseInt(yearMatch[1]) : 2025; // 令和換算
      const month = monthMatch ? parseInt(monthMatch[1]) : 1;
      const meetingDate = new Date(year, month - 1, 1);

      const title = `${first.keyword}に関する審議 - ${first.meeting.split("(")[0].trim()}`;
      await prisma.topic.create({
        data: {
          municipality: "fujikawaguchiko",
          title,
          summary,
          rawText: combinedText,
          meetingDate,
          meetingName: first.meeting.split("(")[0].trim(),
          keywords: [first.keyword],
          sourceUrl: first.source_url ?? null,
          status: "active",
        },
      });
      newTitles.push(title);

      await sleep(1500); // Gemini APIレート制限対策
    } catch (err) {
      console.error(`  ❌ エラー:`, err);
    }
  }

  await prisma.$disconnect();
  console.log(`\n✅ ${count} 件をDBに登録しました`);

  if (newTitles.length > 0) {
    console.log(`📩 LINE通知を送信します...`);
    await sendLineNotification(newTitles);
    console.log(`✅ LINE通知完了`);
  } else {
    console.log(`新着なし・LINE通知スキップ`);
  }
}

importData().catch((err) => {
  console.error("致命的なエラー:", err);
  process.exit(1);
});
