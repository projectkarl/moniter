# SENTINEL // TAIWAN v2.5.0 Cloudflare — Test Report

## 結果

**PASS**

已執行：

- `npm run check`
- `npm run test:cctv`
- `npm run test:playback`
- `npm run test:anpr`

## CCTV playback

- PASS：持續播放守護存在。
- PASS：`pause / waiting / stalled / suspend` 自動恢復。
- PASS：HLS network error 重新 `startLoad(-1)`。
- PASS：HLS media error 使用 `recoverMediaError()`。
- PASS：buffer stall watchdog / nudge recovery。
- PASS：fragment / level / manifest retry。
- PASS：CCTV popup 與 inline view 不再同時維持兩條串流。
- PASS：關閉 popup 後恢復 inline stream。

## HLS Worker proxy

- PASS：HTML wrapper 解析到 HLS。
- PASS：Cookie 與 Referer 轉送。
- PASS：master playlist 重寫。
- PASS：child playlist 重寫。
- PASS：media segment 串流。
- PASS：跨 CDN child playlist。
- PASS：跨 CDN media segment。
- PASS：Range header。
- PASS：跨 CDN URL 使用 HMAC 簽章。
- PASS：任意未簽章跨網域 URL 仍回 403。
- PASS：竄改已簽章 resource URL 仍回 403。

## 其他功能回歸

- PASS：Cloudflare Worker / Static Assets 結構。
- PASS：19 個前端 API action 有 Worker routing。
- PASS：ANPR allowlist。
- PASS：夜間增強、傾斜補償、多幀 voting。

## 尚未宣稱的項目

本地測試不能代表每一支外部公開 CCTV 在 Cloudflare edge 上都一定在線。部署後仍應執行 `npm run smoke`，並用實際會卡住的 CCTV 做來源端驗證。
