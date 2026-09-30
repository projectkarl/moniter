# SENTINEL // TAIWAN — Initial 1.0 Test Report

日期：2026-09-30

## 結果

`npm test`：PASS（本地結構、模擬串流與靜態/RWD 檢查）

- Cloudflare project / routes：PASS
- 前端 19 個 API action routing：PASS
- CCTV wrapper → original media discovery：PASS
- Direct-source-first / same-camera proxy fallback：PASS
- HLS master / child playlist / cross-CDN segment：PASS
- Cookie / Referer / signed proxy / open-proxy guard：PASS
- CCTV registry parsers / official source definitions：PASS
- 禁止 silent nearby-camera substitution：PASS
- CCTV stale source status：已加入
- Latest-frame analysis / `requestVideoFrameCallback` wiring：PASS
- ANPR allowlist / night enhancement / multi-frame voting：PASS
- Navigation one-shot turn cue：PASS
- Navigation one-shot speed-camera cue：PASS
- Navigation start / reroute / traffic-risk repetitive speech：REMOVED
- HTML duplicate IDs：0
- Local HTML asset refs：PASS
- CSS parser：0 top-level parse errors
- 舊版 literal `\\n` CSS regression：REMOVED
- Mobile 920px / 520px / landscape viewport guards：PASS

## 手機瀏覽器限制

容器內 Chromium 本身無法完成 headless 啟動（D-Bus/Mojo runtime timeout），所以無法在這個執行環境宣稱做過真正的 Chrome/iPhone 像素級渲染。測試改為：CSS parser、viewport、固定寬度/overflow guard、portrait/landscape RWD 規則與頁面結構檢查。部署後仍建議用實機 iPhone Safari 與 Android Chrome 各做一次最終 UI smoke test。

## 即時 CCTV 限制

本地環境無法直接對所有官方即時 CDN 做真實網路播放驗證，因此不把 mock HLS 測試寫成「官方串流全部在線」。專案新增 `npm run audit:cctv`；部署後由 Cloudflare edge 實際檢查 registry 與 probe，才能確認當下官方來源可用性。
