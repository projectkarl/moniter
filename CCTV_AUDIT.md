# CCTV Source Audit — Initial 1.0

查核日期：2026-09-30

## 初版規則

1. 使用者選到哪支攝影機，就只顯示那支攝影機；禁止靜默替換成附近其他 CCTV。
2. 有公開媒體網址的來源採原始來源直連優先；瀏覽器無法直接播放時才使用同一支鏡頭的 Cloudflare proxy。
3. 媒體回應 `no-store`；registry 僅快取點位/媒體索引，live source 5 分鐘、position-only 1 小時。
4. 上游失敗但仍有上一份官方 registry 時標記 `stale=true`，部署後 audit 會顯示來源是否退化。
5. 第三方 resolver bridge 預設關閉 (`bridge=0`)。

## 已核對的主要官方來源

| Source | Initial 1.0 handling | 2026-09-30 verification |
| --- | --- | --- |
| 交通部公路局省道 | LIVE | 官方規格包含 `VideoStreamURL`、`UpdateTime`、`UpdateInterval`，並明載串流網址可直接顯示影像。 |
| 交通部高速公路局國道 | LIVE | 專案保留官方 CCTV XML；高速公路局仍列有 CCTV 靜態/動態資料。 |
| 臺南市交通局 | LIVE | 官方開放資料目前直接提供 `Location / wgsx / wgsy / url`，可見多個 `trafficvideo*.tainan.gov.tw` 影像網址。 |
| 臺中市交通局 | LIVE | 政府資料開放平臺目前仍列 `cctvid / roadsection / px / py / url / status`；JSON 資源網址與專案目前使用的 rid 一致。 |
| 臺北市交工處 | POSITION / AUTH REQUIRED | 開放資料主要是 CCTV 點位；官方備註即時交通影像加值利用需依申請/授權流程，所以初版不把點位假裝成公開 LIVE。 |
| 新北市交通局 | POSITION + official viewer metadata | 官方資料集欄位為 CCTV ID、設備編號、地址與座標；只有實際解析到同鏡頭公開媒體時才標示 LIVE。 |
| 桃園市警察局 | POSITION ONLY | 2026 年資料欄位為監控點、攝影機支數、經緯度等，沒有公開串流欄位，因此只顯示點位。 |
| 嘉義市 / 嘉義縣 / 基隆 | Registry source retained | 來源若部署時無法取得會回報 failed/stale，不會產生假 LIVE。請用 `npm run audit:cctv` 於 Cloudflare edge 做當下連線驗證。 |

## 部署後即時驗證

```bash
BASE_URL=https://你的網址.workers.dev npm run audit:cctv
```

報告會列出：來源筆數、media/point-only 數、cache age、上游 UpdateTime（來源提供時）、stale 狀態，並 probe 前幾支可播放媒體。
