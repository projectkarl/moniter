# SENTINEL // TAIWAN

**Version 1.0.5 · Public Signal Command Grid**

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
- 高速公路局、公路局等官方開放資料若直接提供 `VideoStreamURL`，SENTINEL 會以原始公開串流播放。
- 官方只提供點位或官方檢視頁時，不把整個網頁偽裝成原始串流。
- 臺北市交工處目前明確要求第三方網站介接 CCTV 即時影像需依官方程序申請；未取得授權前，SENTINEL 只顯示官方點位與介接說明。

## 版本
**SENTINEL // TAIWAN v1.0.5** 將 CCTV「點位顯示」與「影像播放」完全拆開：附近官方攝影機點位永遠先顯示，只有已取得 HLS／MJPEG／JPEG／MP4／官方景點直播的鏡頭才升級為 LIVE。POINT / AUTH / VIEW 不再因無法直接播放而從地圖與周圍卡片消失。


## CCTV playback resilience

公開交通 CCTV 若同時提供 `VideoStreamURL` 與 `VideoImageURL`，SENTINEL 會優先播放動態串流；若瀏覽器無法解碼、HLS 發生 fatal error、或指定時間內沒有產生影格，會自動切換到官方 `VideoImageURL`，並依 `ImageRefreshRate` 更新。


## CCTV direct-play policy
- `LIVE` 僅代表已提供或已解析到可在站內播放的 HLS / MJPEG / JPEG / MP4 / WebM / 官方景點直播。
- 官方 viewer 頁與 quick-index 點位不再直接 iframe 成 LIVE，避免黑畫面。
- 公開 wrapper（例如部分地方政府檢視頁）由伺服器端辨識其公開媒體端點；辨識失敗時保留為官方點位，不跳轉、不黑屏。
- 需要提供機關授權的原始影像介接不嘗試繞過限制。
