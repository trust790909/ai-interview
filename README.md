# AI 面試模擬器

以職缺描述設定面試，練習 3～10 道主要題目，再查看五大能力評分與逐題改善建議。

## 本機啟動

需要 Node.js 24 與 npm。在專案目錄執行：

```powershell
npm ci
npm run dev
```

在專案根目錄的 `.env.local` 設定 `OPENAI_API_KEY`。可用 `OPENAI_MODEL` 覆寫預設模型 `gpt-4.1-mini`。金鑰只在 Route Handler 的伺服器環境使用。開啟 http://localhost:3000 。

設定、面試進度、回答及報告保留在 `.interview-data/interviews.sqlite`，最長七天。在同一瀏覽器可回到最近一次練習或從原連結恢復。刪除功能位於面試頁。SQLite 方案適合有持久磁碟的單機使用。面試資料會送往 OpenAI，請用假資料做測試。

## 驗證

```powershell
npm run lint
npx tsc --noEmit
npm run build
node --test tests/state.test.mjs
```

以下瀏覽器測試需先啟動應用程式、安裝 Microsoft Edge 且配置可用的 OpenAI API 金鑰。測試會產生 API 用量。

```powershell
$env:INTERVIEW_TEST_URL = "http://localhost:3000"
node tests/browser.mjs
```

API 使用 Responses API 與 Zod 結構化輸出，SQLite 保存會話與速率限制，伺服器依權重計算總分，並檢查證據引用是否出現在使用者回答中。首頁以固定示範資料展示報告。


另可用 `node --test tests/api.mjs` 驗證 5 題保險理賠與 10 題科技產品的 OpenAI 整合流程。

## Vercel 正式部署

在 Vercel 專案的 Storage 頁面連結 Upstash Redis，並選擇 Production 環境。應用程式支援 UPSTASH_REDIS_REST_URL 與 UPSTASH_REDIS_REST_TOKEN，也支援整合提供的 KV_REST_API_URL 與 KV_REST_API_TOKEN。請在專案的 Production 環境設定 OPENAI_API_KEY，再重新部署。預覽部署可單獨連結資料庫與設定金鑰。

Vercel 使用 Redis 保存會話、請求限額及操作鎖，會話自建立起七天後自動過期。本機未設定 Redis 時使用 SQLite。部署後可設定 INTERVIEW_TEST_URL 為正式網址，再執行 node tests/browser.mjs，以合成資料測試完整流程。
