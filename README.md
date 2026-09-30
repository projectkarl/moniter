# SENTINEL // TAIWAN — Initial 1.0 Cloudflare

這是收斂後的穩定初版。目標是「先正確、再即時、再分析」：公開 CCTV 不冒用其他位置影像，能直接播放官方來源就直連，只有同一支鏡頭因瀏覽器限制無法直連時才走 Cloudflare proxy 備援。

## 初版重點

- Cloudflare Worker + Static Assets；只有 `/api/*` 進 Worker。
- CCTV 官方來源優先，`bridge=0` 為預設，不自動導入第三方替代鏡頭。
- 點選某一支 CCTV 後，只顯示該支鏡頭；無可播放媒體時明確顯示「沒有可播放影像」。
- HLS / MJPEG / image / video 支援直連優先、同鏡頭 proxy fallback。
- CCTV 媒體與 resolver 回應使用 `no-store`；公開 CCTV 清單的 live source cache 為 5 分鐘，position-only source 為 1 小時。
- 上游暫時失效而使用既有清單時，`sourceStatus[].stale=true`，不再假裝是正常即時來源。
- 即時分析以最新影片 frame 為準；分析不控制播放器暫停/播放。
- 公開 CCTV 的車牌只顯示候選區；只有 `public/anpr-config.js` 明確授權的自有/授權鏡頭可啟用本機 OCR。
- 導航語音改成低干擾：每個轉彎接近時一次、每個測速點接近時一次；重新規劃與壅塞分析只顯示畫面，不反覆播報；抵達保留一次提示。
- 手機版修復舊 CSS 格式錯誤，補齊 920px / 520px 與橫向短螢幕版型，主要抽屜、搜尋、導航、CCTV popup 都限制在 viewport 內。

## 部署

```bash
npm install
npm test
npx wrangler login
npm run deploy
```

部署後請執行真正的 Cloudflare edge 檢查：

```bash
BASE_URL=https://你的網址.workers.dev npm run smoke
BASE_URL=https://你的網址.workers.dev npm run audit:cctv
```

`audit:cctv` 會檢查代表性區域的官方 CCTV registry、來源更新狀態以及可播放鏡頭 probe。這一步需要實際部署網址，因為本地測試環境無法代表各官方 CDN、CORS、Cookie、Referer 與即時串流當下狀態。

## 車牌辨識

公開道路 CCTV 預設不開放 OCR。自有或已授權鏡頭才加入：

```js
// public/anpr-config.js
window.SENTINEL_ANPR_AUTHORIZED_IDS = [
  'private-gate-01'
];
```

OCR 在瀏覽器端處理，不建立跨鏡頭查號資料庫。

## 驗證指令

```bash
npm run check
npm run test:cctv
npm run test:cctv-registry
npm run test:playback
npm run test:navigation
npm run test:anpr
npm run test:page
npm run test:mobile
```

完整結果見 `TEST_REPORT.md`，資料源查核見 `CCTV_AUDIT.md`。
