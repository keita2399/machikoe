import { chromium } from "playwright";

async function test() {
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

  await page.goto("https://ssp.kaigiroku.net/tenant/fujikawaguchiko/SpMinuteSearch.html", {
    waitUntil: "load",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  await page.selectOption("#se-view-years", "all");
  const input = await page.waitForSelector("#in-detail-keywords", { timeout: 5000 });
  await input.fill("宿泊税");
  await page.click("#v-search");

  // 結果が表示されるまで待つ
  await page.waitForTimeout(8000);

  // 結果DOM全体を確認
  const resultArea = await page.$eval("#result-area, .result-list, #search-result-list, ul.parent_bar", (el: Element) =>
    el.innerHTML.slice(0, 3000)
  ).catch(() => "not found");
  console.log("結果エリア:", resultArea);

  // すべての見えているulとliを確認
  const lists = await page.$$eval("ul, li", (els: Element[]) =>
    els
      .filter((el: Element) => (el as HTMLElement).offsetHeight > 0)
      .slice(0, 30)
      .map((el: Element) => ({ tag: el.tagName, id: el.id, class: el.className.toString().slice(0, 40), text: el.textContent?.trim().slice(0, 60) }))
  );
  console.log("\n見えているリスト要素:", JSON.stringify(lists, null, 2));

  await browser.close();
}

test().catch(console.error);
