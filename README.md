# SENTINEL // TAIWAN — Cloudflare v2.5.0

這一版專門修正 CCTV 播放會反覆暫停、卡住或載一段就停止的問題。

## v2.5.0 修正

- CCTV 播放優先，任何分析流程都不會呼叫 `video.pause()`。
- 新增播放守護：遇到 `pause`、`waiting`、`stalled`、`suspend` 時自動續播。
- 偵測播放時間長時間不前進時，自動要求 HLS 重新載入。
- HLS.js 增加 buffer stall recovery、nudge 與 fragment retry。
- fatal network / media error 會自動恢復；其他 fatal error 最多重建播放器 3 次。
- 放大 CCTV 時只保留一條串流，關閉放大視窗後再恢復內嵌播放器，避免同一鏡頭同時拉兩份 HLS。
- HLS master / child playlist / segment 可安全跨 CDN 播放。playlist 內的跨網域資源會被 Worker 簽章，避免被濫用成任意公開 proxy。
- 公開道路 CCTV 的即時分析與授權 ANPR 功能保留。
- Service Worker cache 已換版，部署後會更新前端播放器程式。

## 部署

```bash
npm install
npm run check
npm run test:cctv
npm run test:playback
npm run test:anpr
npx wrangler login
npm run deploy
```

正式環境建議另外設定一組自己的 HLS proxy 簽章密鑰：

```bash
npx wrangler secret put CCTV_PROXY_SECRET
```

沒有設定時仍可運作，專案內含此版本專用 fallback key；設定 Cloudflare Secret 則更適合長期部署。

部署後可執行：

```bash
BASE_URL=https://你的網址.workers.dev npm run smoke
```

## 如果仍有特定 CCTV 無法播放

這通常代表來源本身已停止串流、需要來源端 session/token、編碼格式瀏覽器不支援，或官方只提供週期性 JPEG 而不是影片。v2.5.0 不會為這些情況偽造直播，會改由既有的附近可播放公開鏡頭備援流程處理。
