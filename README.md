# SENTINEL // TAIWAN — Cloudflare v2.3.0

全新 Cloudflare Workers + Static Assets 版本。保留原本 SENTINEL / 007 戰情介面與使用流程，但後端入口、CCTV 代理、快取與部署方式已改成 Cloudflare 原生架構，不再依賴 Vercel Serverless Functions。

## 這版解決什麼

- **單一 Cloudflare Worker**：所有 `/api/*` 由 `src/worker.js` 統一派送，靜態頁面由 Static Assets 直接提供。
- **CCTV 直接內嵌**：`/api/cctv-feed` 使用 Web Streams，不用 `node:stream`；支援 HLS、MJPEG、圖片快照、MP4/WebM、HTML wrapper 探測。
- **HLS 完整代理**：master playlist、子 playlist、segment 與 `URI="..."` 都重新指回本站代理，避免瀏覽器直接跨站而被 CORS / Referer 擋下。
- **來源狀態傳遞**：wrapper 解析時保存 Cookie / Referer，播放時傳遞 Range。
- **SSRFi 防護**：CCTV resource 僅允許公開 HTTP/HTTPS 位址，拒絕 localhost / 私有網段；HLS 子資源限制同 host / subdomain。
- **Cloudflare Workers Caching**：資料 API 依性質配置 2 秒～1 天 TTL，減少免費方案 Worker CPU 與上游請求。
- **零付費金鑰**：目前功能仍以公開、可免 key 的資料源為主。
- **SPA / PWA 保留**：原介面、manifest、Service Worker 與資產保留，cache namespace 已升級避免舊版殘留。

## 主要功能

地點搜尋／簡稱搜尋、定位、A/B 導航、天氣、空氣品質、全台／周邊 CCTV、高速公路車流、道路事件、VD 車道資料、測速照相、停車、施工、淹水、航班、地震、新聞、周邊戰情與濾鏡等皆沿用既有前端操作方式。

## 專案結構

```text
public/                 靜態前端與 PWA
src/worker.js           Cloudflare Worker API router
src/cctv-feed.js        Cloudflare 原生 CCTV / HLS proxy
src/lib/                Worker adapter / security / HTTP helpers
src/services/           各公開資料來源 service
scripts/check.mjs       不連網結構與路由自檢
scripts/smoke.mjs       部署後即時串接 smoke test
wrangler.jsonc           Workers + Static Assets + Workers Caching
```

## 第一次部署

需求：Node.js 20～24、Cloudflare 帳號。

```bash
npm install
npx wrangler login
npm run check
npm run deploy
```

Wrangler 會輸出 `https://<worker>.<subdomain>.workers.dev`。部署完成後執行：

```bash
BASE_URL=https://你的網址.workers.dev npm run smoke
```

Smoke test 會驗證 Cloudflare health、地點搜尋、天氣、路線、CCTV registry、CCTV inline probe，以及交通／空品／地震／航班等公開來源。外部來源暫時維護或限流的項目會標為 optional warning；核心 health / search / weather / route / CCTV registry 失敗會直接 exit 1。

## Cloudflare Dashboard 部署

也可以把本專案推到 GitHub 後，在 Cloudflare Workers & Pages 建立 Worker，Build command 使用 `npm install`（或平台預設），Deploy command 使用 `npx wrangler deploy`。`wrangler.jsonc` 已包含 Static Assets 與 API routing，不要另外建立 Vercel rewrite。

## 免費方案與效能策略

- 靜態 CSS / JS / 圖片不需要每次執行 API Worker。
- `/api/data` 依資料新鮮度使用 edge TTL；車流短、地理編碼長。
- CCTV media 為即時串流，刻意 `no-store`，避免把影像當成一般 API 長期快取。
- 地圖前端不應高頻輪詢所有全台資料；只有目前視窗／目的地需要的資料才載入。
- `nodejs_compat` 只保留給 ODS ZIP / Buffer / crypto 類既有資料解析；CCTV 串流本身已完全改成 Web Streams。

## 驗證指令

```bash
npm run check
BASE_URL=https://你的網址 npm run smoke
```

`npm run check` 不需網路，可先抓出檔案缺漏、Worker routing、frontend action mapping、Static Assets 綁定設定等問題。

## 注意

公開 CCTV 與第三方公開資料仍可能因來源站臨時維護、改版、封鎖機房 IP 或串流 token 過期而個別失效。此版的設計是讓單一來源失效時不拖垮整個 Worker，並讓前端能使用其他候選攝影機；無法合法取得的封閉串流不會繞過授權限制。


## v2.2.0 — Privacy-first CCTV live analysis

- Browser-side object detection remains the default so continuous analysis does not consume Workers AI quota.
- Adds anonymous short-lived per-camera track IDs, dominant movement direction, stopped-vehicle count, and queue index.
- Public CCTV license plates are **not OCRed**. The UI estimates a plate candidate region inside detected vehicles and places a local blur shield over that region.
- Tracks exist only in browser memory, expire after a few seconds, reset when the camera changes, and are never persisted or correlated across cameras.
- No face recognition, identity matching, vehicle-owner identification, or cross-camera person/vehicle tracking.
- This is traffic situational analysis only; direction/queue/stopped metrics are estimates and are affected by camera angle, occlusion, night conditions and resolution.

Cloudflare Workers AI remains optional. Cloudflare currently exposes serverless object detection such as `@cf/facebook/detr-resnet-50`, but the continuous default stays on-device to preserve the free quota and reduce edge requests.


## AUTHORIZED ANPR (v2.2)

This build adds on-device license-plate OCR for cameras you own or have explicit permission to process. Public CCTV remains plate-shielded by default.

1. Find the `id` of your authorized camera object.
2. Edit `public/anpr-config.js`.
3. Add only the authorized ID, for example: `window.SENTINEL_ANPR_AUTHORIZED_IDS = ['private-gate-01'];`
4. Deploy again. The camera card will reveal **AUTHORIZED ANPR** only for allowlisted IDs.

The OCR pipeline runs in the browser with Tesseract.js 7, analyzes only estimated plate ROIs, keeps results in memory for seconds, and does not send OCR text/images to the Worker or store plate history. Camera switching and stopping analysis clear transient reads. Accuracy depends strongly on source resolution, shutter speed, viewing angle, plate size, night lighting, and compression.

## AUTHORIZED ANPR+ (v2.3.0)

v2.3 keeps ANPR locked to exact camera IDs in `public/anpr-config.js`, and strengthens recognition for owned / explicitly authorized cameras without adding server-side plate history.

- **Night enhancement**: estimates plate-region luminance, stretches contrast, applies low-light gamma lift, and records DAY/NIGHT mode in the live panel.
- **Skew compensation**: successive frames rotate the candidate plate crop through configurable angles (`0, -4, 4, -7, 7` by default) instead of trusting a single horizontal crop.
- **Motorcycle ROI**: motorcycle detections use taller/lower candidate regions and cycle through multiple plate-area hypotheses.
- **Multi-frame voting**: OCR text must normally agree across at least two reads before it is shown as a stable plate. A single exceptionally high-confidence result can be accepted, configurable with `stableVotes` and `minConfidence`.
- **OCR-confusion repair**: common OCR substitutions such as `O/0`, `I/1`, `Z/2`, `S/5`, `B/8`, and `G/6` are corrected only when they make sense for an alphanumeric plate pattern.
- **Per-camera tuning**: `intervalMs`, `minConfidence`, `stableVotes`, `maxVehicles`, `targetWidth`, `skewAngles`, and `keystoneStrengths` can be overridden under `SENTINEL_ANPR_CONFIG.cameras`.
- **Local-only results**: reads, votes, previews, and temporary tracking remain in browser memory and are cleared on camera change or ANPR stop. No plate-search endpoint or cross-camera correlation is added.

Example:

```js
window.SENTINEL_ANPR_AUTHORIZED_IDS = ['private-gate-01'];
window.SENTINEL_ANPR_CONFIG = {
  default: { intervalMs: 2200, minConfidence: 28, stableVotes: 2, maxVehicles: 2, targetWidth: 320, skewAngles: [0,-4,4,-7,7], keystoneStrengths: [0,-0.10,0.10,-0.16,0.16] },
  cameras: {
    'private-gate-01': { targetWidth: 380, intervalMs: 1800, skewAngles: [0,-3,3,-6,6], keystoneStrengths: [0,-0.08,0.08] }
  }
};
```

For best results, use a camera where a plate is at least roughly 80–120 pixels wide in the source frame and avoid heavy motion blur or blown-out IR reflections. The browser UI shows current enhancement mode, skew angle and OCR attempt count so each authorized camera can be tuned empirically.
