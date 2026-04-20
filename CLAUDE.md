# マチコエ (MachiKoe)

「街の声を、議会へ。」住民と議会をつなぐWebアプリケーション。

## セットアップ

```bash
npm install
npx prisma generate
```

## 環境変数（.env）

```
DATABASE_URL="postgresql://..."  # Neon接続文字列
GEMINI_API_KEY="..."             # Gemini APIキー
```

Neon DB: `npx neonctl connection-string --project-id little-wildflower-11062248 --database-name machikoe`

## DB操作

```bash
npm run db:push   # スキーマをDBに反映
npm run db:studio # DBブラウザを開く
```

## 議事録データ取得

```bash
npm run check-robots  # robots.txt確認（必須）
npm run scrape        # スクレイピング実行
npm run summarize     # 取得データの確認
```

## 開発

```bash
npm run dev   # 開発サーバー起動
npm run build # 本番ビルド確認
```

## 技術スタック

- Next.js 16 (App Router) / TypeScript / Tailwind CSS
- Prisma v7 + @prisma/adapter-pg + Neon PostgreSQL
- LangChain (`@langchain/google-genai`) + Gemini 2.0 Flash
- Playwright（議事録スクレイピング）

## Neon CLI操作

```bash
npx neonctl projects list
npx neonctl databases list --project-id little-wildflower-11062248
npx neonctl connection-string --project-id little-wildflower-11062248 --database-name machikoe
```

## Prisma v7 注意事項

- スキーマの `datasource` に `url` プロパティは不要（prisma.config.ts で管理）
- クライアントは `@prisma/adapter-pg` を使ったアダプター方式
- インポートは `@prisma/client/index` から行う
