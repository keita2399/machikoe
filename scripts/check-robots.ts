import https from "https";

const ROBOTS_URL = "https://ssp.kaigiroku.net/robots.txt";
const TARGET_PATH = "/tenant/fujikawaguchiko/pg/index.html";

function fetchRobotsTxt(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });
  });
}

// Disallow/Allowのうち、パスが長い（より具体的な）ルールが優先される
function isPathAllowed(rules: { type: "allow" | "disallow"; path: string }[], targetPath: string): boolean {
  const matching = rules.filter((r) => targetPath.startsWith(r.path) && r.path !== "");
  if (matching.length === 0) return true; // ルールなし → 許可

  // 最も具体的なルール（パスが長い）を優先
  matching.sort((a, b) => b.path.length - a.path.length);
  return matching[0].type === "allow";
}

async function checkRobots() {
  console.log(`robots.txt を確認中: ${ROBOTS_URL}\n`);

  try {
    const content = await fetchRobotsTxt(ROBOTS_URL);
    console.log("=== robots.txt の内容 ===");
    console.log(content);

    const lines = content.split("\n").map((l) => l.trim().toLowerCase());
    const rules: { type: "allow" | "disallow"; path: string }[] = [];
    let inScope = false;

    for (const line of lines) {
      if (line.startsWith("user-agent:")) {
        const agent = line.split(":")[1].trim();
        inScope = agent === "*" || agent === "all";
      }
      if (!inScope) continue;
      if (line.startsWith("allow:")) {
        rules.push({ type: "allow", path: line.split(":")[1].trim() });
      } else if (line.startsWith("disallow:")) {
        rules.push({ type: "disallow", path: line.split(":")[1].trim() });
      }
    }

    const allowed = isPathAllowed(rules, TARGET_PATH);

    if (allowed) {
      console.log(`\n✅ 対象パス「${TARGET_PATH}」はスクレイピング許可されています。`);
    } else {
      console.log(`\n❌ 対象パス「${TARGET_PATH}」はスクレイピング禁止されています。中止します。`);
      process.exit(1);
    }
  } catch (err) {
    console.error("robots.txt の取得に失敗しました:", err);
  }
}

checkRobots();
