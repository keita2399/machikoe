import { chromium } from "playwright";

async function inspect() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "ja-JP",
  });
  const page = await context.newPage();

  // webdriver フラグを消す
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const allRequests: string[] = [];
  page.on("request", (req) => allRequests.push(`${req.method()} ${req.url()}`));

  console.log("ページ移動中...");
  await page.goto("https://ssp.kaigiroku.net/tenant/fujikawaguchiko/SpTop.html", {
    waitUntil: "load",
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  console.log("リクエスト数:", allRequests.length);
  allRequests.slice(0, 20).forEach((u) => console.log(" ", u));
  console.log("Title:", await page.title());

  // 検索ボタンをクリック
  const searchIcon = await page.$("#search_icon");
  console.log("search_icon 存在:", !!searchIcon);

  if (searchIcon) {
    await searchIcon.click();
    await page.waitForTimeout(2000);
    const inputs = await page.$$eval("input", (els: Element[]) =>
      els.map((el) => ({ id: el.id, type: (el as HTMLInputElement).type, placeholder: (el as HTMLInputElement).placeholder }))
    );
    console.log("input要素:", JSON.stringify(inputs));
  }

  await browser.close();
}

inspect().catch(console.error);
