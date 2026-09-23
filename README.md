# SENTINEL // TAIWAN

**Version 1.0.9 · Public Signal Command Grid**

SENTINEL // TAIWAN 是一個以台灣公開資料為基礎的地圖型戰情／導航實驗專案。核心目標是把即時車流、公開 CCTV、交通事件、天氣、環境資訊與導航整合在同一張地圖，同時清楚標示資料來源與即時性。

## 核心功能
- 全台國道即時 FLOW 色帶與 HWY 戰情模式
- 搜尋地點／點選地圖後顯示周邊公開 CCTV
- 原始政府／官方 CCTV 來源優先，支援 HLS、JPEG/MJPEG、MP4/WebM 與官方公開播放器解析
- 景點官方直播與周邊道路 CCTV 融合
- 目前位置追蹤、雙路線導航、偏離路線重算、轉彎提示與前方事件／CCTV 情報
- 全台即時戰情、事件、AQI、水情、施工、停車、天氣與來源狀態
- CONTACT TRACK、航空公開訊號、3D Cockpit、Watch Zone、Flow Trend、Sensor Look
- 軍事／情報中心風格資料感知開機序列

## 資料原則
- 優先使用政府或官方公開來源，不把第三方索引頁當成正式影像播放器。
- `LIVE / OBSERVED / MODEL / DERIVED / ESTIMATED / VISUAL / UNAVAILABLE` 分級用來區分資料性質。
- CCTV 影像分析不做人臉辨識、車牌 OCR 或身分追蹤。
- 公開資料來源可能暫時離線、改版、限流或停止提供；系統會盡量降級顯示而不虛構資料。

## 部署
直接將此資料夾部署至 Vercel 即可。正式執行使用兩個 Serverless Functions：
- `/api/data`
- `/api/cctv-feed`

不需要前端付費 API Key。

## CCTV 播放政策
- CCTV 播放區不另開外站，也不再嵌入第三方 CCTV 網頁或附近影像 widget。
- 高速公路局、公路局等來源直接使用官方 `VideoStreamURL` / `VideoImageURL`。
- 地方政府只有播放器頁或公開索引時，後端只把該頁當解析入口：遞迴找出 HLS / MJPEG / JPEG / MP4 / WebM 後，統一由 `/api/cctv-feed` 代理給 SENTINEL 自己的播放器。
- 解析器會保留必要的 Referer / Cookie，並支援巢狀播放器頁與 HLS 子播放清單。
- 解析不到直接媒體時仍保留官方 CCTV 點位；不跳轉外站、不用整頁 iframe 假裝直播。
- 景點官方 YouTube 直播仍直接在 SENTINEL 內播放。

## 版本
**SENTINEL // TAIWAN v1.0.9** 將道路 CCTV 收斂為單一「站內直接播放」鏈：公開來源／解析橋接 → `/api/cctv-feed` → SENTINEL video/img/HLS player。移除外部 CCTV widget 與官方整頁 viewer fallback。


## v1.0.9 CCTV inline-only fallback
CCTV 播放區不提供外部頁面或跳轉連結。原鏡頭無法直接播放時，SENTINEL 會依 5 / 12 / 25 km 半徑自動尋找最近可播放公開 CCTV，並在原播放框直接換台。
