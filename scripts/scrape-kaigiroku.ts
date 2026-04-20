import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SEARCH_URL = "https://ssp.kaigiroku.net/tenant/fujikawaguchiko/SpMinuteSearch.html";
const KEYWORDS = ["宿泊税", "オーバーツーリズム", "インバウンド", "観光", "混雑"];
const OUTPUT_PATH = path.join(process.cwd(), "data", "kaigiroku-raw.json");

interface KaigirokuRecord {
  date: string;
  meeting: string;
  speaker: string;
  keyword: string;
  excerpt: string;
  full_text: string;
  source_url: string;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeKeyword(keyword: string): Promise<KaigirokuRecord[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "ja-JP",
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const records: KaigirokuRecord[] = [];

  try {
    await page.goto(SEARCH_URL, { waitUntil: "load", timeout: 30000 });
    await sleep(3000);

    // 全年対象
    await page.selectOption("#se-view-years", "all");
    const input = await page.waitForSelector("#in-detail-keywords", { timeout: 5000 });
    await input.fill(keyword);
    await page.click("#v-search");
    await sleep(5000);

    // 会議ごとの発言リストを取得
    const schedules = await page.$$(".schedule");
    console.log(`  ${schedules.length} 件の会議でヒット`);

    for (const schedule of schedules) {
      const meetingText = await schedule.$eval("span", (el: Element) => el.textContent?.trim() ?? "").catch(() => "");
      const dateMatch = meetingText.match(/(\d+)年\s*(\d+)月/);
      const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}` : "";

      // 発言リストを取得（最初の5件のみ）
      const minutes = await schedule.$$("li.minute");
      for (const minute of minutes.slice(0, 5)) {
        const text = await minute.evaluate((el: Element) => el.textContent?.trim() ?? "");
        const speakerMatch = text.match(/^([^◎○\n]+[君氏])/);
        const speaker = speakerMatch?.[1]?.trim() ?? "";

        // data-doc="222-151-3-70" → council_id=151, schedule_id=3, minute_id=70
        const datadoc = await minute.getAttribute("data-doc").catch(() => null);
        const base = "https://ssp.kaigiroku.net";
        let source_url = `${base}/tenant/fujikawaguchiko/SpMinuteSearch.html`;
        if (datadoc) {
          const parts = datadoc.split("-");
          if (parts.length >= 4) {
            source_url = `${base}/tenant/fujikawaguchiko/SpMinuteView.html?council_id=${parts[1]}&schedule_id=${parts[2]}&minute_id=${parts[3]}&is_search=true`;
          }
        }

        records.push({
          date,
          meeting: meetingText.replace(/\s+/g, " ").trim(),
          speaker,
          keyword,
          excerpt: text.slice(0, 300),
          full_text: text,
          source_url,
        });
      }
    }
  } finally {
    await browser.close();
  }

  return records;
}

async function scrape(): Promise<void> {
  if (!fs.existsSync(path.join(process.cwd(), "data"))) {
    fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  }

  const allRecords: KaigirokuRecord[] = [];

  for (const keyword of KEYWORDS) {
    console.log(`\n🔍 「${keyword}」を検索中...`);
    try {
      const records = await scrapeKeyword(keyword);
      allRecords.push(...records);
      console.log(`  ✅ ${records.length} 件取得`);
    } catch (err) {
      console.error(`  ❌ エラー:`, err);
    }
    await sleep(2000);
  }

  // 重複除去（同じ発言テキスト）
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    const key = r.excerpt.slice(0, 100);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(unique, null, 2), "utf-8");
  console.log(`\n✅ 完了: ${unique.length} 件（重複除去後）を ${OUTPUT_PATH} に保存`);
}

scrape().catch((err) => {
  console.error("致命的なエラー:", err);
  process.exit(1);
});
