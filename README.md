# SENTINEL // TAIWAN — Cloudflare v2.6.0

本版針對 CCTV「來源本身能播，但進入 SENTINEL 後卡頓、暫停、分析落後」重新整理播放架構。

## v2.6.0 主要修正

### 1. 官方來源直連優先
- 攝影機資料回傳真正媒體網址後，瀏覽器先直接播放原始來源。
- Cloudflare `/api/cctv-feed` 不再是所有 HLS 的必經路徑。
- 只有直連因 CORS、Referer、Cookie、wrapper 或瀏覽器格式限制失敗時，才自動切換到同源 Worker 代理。
- 畫面右上角會顯示「來源直連」或「備援播放」。

### 2. HLS 改成低延遲播放
- `lowLatencyMode: true`
- live sync 由原本較深 buffer 改成 2 個 segment 左右。
- buffer 上限縮短，避免播放器長時間落後實況。
- 移除舊版會反覆 `startLoad()` / 強制續播的 aggressive watchdog；只有真的超過約 9 秒完全沒有進度才恢復。

### 3. 官方來源優先，解析橋接只當備援
- 一般 CCTV 查詢預設 `bridge=0`。
- 先使用高速公路局、公路局、地方政府等原始公開來源。
- 只有附近完全沒有可播放的原始媒體時，才進入 resolver bridge 搜尋。

### 4. 即時分析改成最新影格
- 使用 `requestVideoFrameCallback()` 對齊新影片 frame。
- 桌機基準約 420ms、手機約 620ms，再依實際 inference 時間自動調整。
- 不再固定 1.25–3 秒後才抓畫面。
- TensorFlow.js 優先使用 WebGL，模型載入後先 warm-up 一次，降低第一次分析延遲。
- 分析畫布縮到適合即時偵測的尺寸，避免 AI 與影片播放搶 GPU。

### 5. 播放與分析分離
- 畫面可以保持原始來源直連。
- 若來源提供獨立 JPEG snapshot，分析在需要時可從同源 Worker 取 snapshot，不必讓可見影片改走 proxy。
- 若直接影片可安全讀 frame，就直接分析目前正在顯示的 frame。

### 6. 車牌功能不再「看起來消失」
- 車牌辨識按鈕永遠可見。
- 公開 CCTV 顯示「車牌辨識（未授權）」並顯示車牌候選區，但不進行 OCR。
- 自有或已明確授權鏡頭加入 `public/anpr-config.js` 後，按鈕會解鎖。
- 啟用後即使 OCR 尚未完成，也會先顯示車牌 ROI 與「辨識中」。
- OCR 成功後才顯示實際字元與信心值。

## 授權鏡頭開啟車牌 OCR

編輯 `public/anpr-config.js`：

```js
window.SENTINEL_ANPR_AUTHORIZED_IDS = [
  'private-gate-01'
];
```

只有清單內的 camera ID 可以讀取車牌字元。公開政府 CCTV 不應加入此清單。

## 部署

```bash
npm install
npm run check
npm run test:playback
npm run test:cctv
npm run test:anpr
npx wrangler login
npm run deploy
```

部署後：

```bash
BASE_URL=https://你的網址.workers.dev npm run smoke
```

## CCTV_PROXY_SECRET

若使用 HLS proxy fallback，建議設定：

```bash
npx wrangler secret put CCTV_PROXY_SECRET
```

## 注意

道路 CCTV 的原始解析度、鏡頭角度與壓縮率會直接限制 AI 與車牌辨識效果。即使程式能正確抓取畫面，也不能從原始影像不存在的細節重建出可靠車牌字元。
