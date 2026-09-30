# SENTINEL // TAIWAN v2.6.0 Cloudflare — Test Report

## 結果

PASS — 2026-09-30

## 已測試

- Cloudflare Worker / Static Assets 專案結構
- `/api/health`
- `/api/data?action=health`
- 19 個前端 API action routing
- CCTV source resolver
- 原始媒體 URL 回傳（direct-first）
- 同源 proxy fallback URL
- HTML wrapper -> HLS master
- HLS master -> cross-CDN child playlist
- child playlist -> cross-CDN segment
- Range / Cookie / Referer forwarding
- signed cross-CDN URL 防止 open proxy
- 前端 source-direct-first routing
- HLS low-latency 設定
- 舊 aggressive pause/restart watchdog 已移除
- latest-frame analysis / requestVideoFrameCallback wiring
- snapshot analysis fallback wiring
- official-source priority / resolver bridge fallback
- ANPR allowlist
- ANPR locked UI visible
- CCTV 區塊已移除 LIVE SENSOR / ANPR MODE / PLATE SHIELD 等裝飾文字
- plate candidate ROI visible
- Tesseract.js OCR wiring
- night enhancement / skew / keystone / multi-frame voting

## 本地測試命令

```bash
node scripts/check.mjs
node scripts/playback-unit.mjs
node scripts/anpr-unit.mjs
node scripts/cctv-unit.mjs
```

全部通過。

## 限制

目前執行環境無法直接對所有台灣 CCTV 上游主機進行完整實網影音播放測試，因此真實部署後仍應執行 `npm run smoke`，並以實際瀏覽器檢查來源直連 / 備援播放狀態。程式已改為不讓 Cloudflare proxy 成為健康官方串流的必經路徑。
