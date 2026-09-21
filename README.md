# EYE // TAIWAN — Highway Live + Direct CCTV + Nav Vision v0.39.0

Zero-key Taiwan traffic / CCTV / navigation experimental web app.

## v0.39.0
- 新增 `HWY` 全台國道即時壅塞模式：回到台灣全圖，強制開啟 FLOW / EVT / CAM，將高速公路局 LiveTraffic 路段以綠 / 黃綠 / 橘 / 紅直接畫在道路上，並在此模式加粗線條與提高對比，讓壅塞色帶成為主畫面。
- 道路 CCTV 與高速公路 CCTV 繼續直接使用原始官方公開資料來源。區域查詢也會保留高速公路局 / 公路局來源，不因位於都會區就排除國道與省道攝影機。
- CCTV 紀錄增加 `originalSource` / `sourceDatasetUrl`；same-origin `/api/cctv-feed` 僅處理 HTTPS、HLS playlist、Range 與官方播放頁媒體解析，不改變上游資料來源。
- 景點來源搜尋改成嚴格名稱吻合；留言板、討論、站務、搜尋結果等頁面不接受為 CCTV；若最終不能解析到 YouTube / HLS / JPEG / MJPEG / MP4 / WebM，就不播放整頁 iframe。
- 定位按鈕持續跟隨時改為深色青藍 tactical 狀態，不再顯示近白色實心按鈕。
- 路線候選新增「主要經由道路」摘要與推薦理由；長途仍融合 OSRM 與高速公路偏好 Valhalla 候選。
- 修正 Valhalla maneuver 缺少座標：每個轉向點從 decoded route shape 對應 `begin_shape_index`，恢復完整下一轉向 / 語音 / 距離提示。
- 導航 HUD 新增 FLOW AHEAD / CCTV / EVENT 三格前方情報。
- 距下一轉彎約 1.25 km 內，嘗試以 KartaView 公開歷史街景顯示轉彎處環境參考；清楚標示為歷史影像、非即時，缺圖時不影響導航。

## CCTV source policy
- 高速公路：交通部高速公路局官方 CCTV registry / stream metadata。
- 省道：交通部公路局官方 CCTV open data。
- 地方道路：已整合地方政府公開 CCTV；臺北 / 新北官方播放頁由伺服器端再解析真正媒體端點，解析失敗就標示不可播放，不嵌整頁。
- 景點：只使用可驗證的政府 / 官方 YouTube / 原始公開媒體。`monitor1.wfuapp.com` 僅作來源辨識目錄，不作正式播放器或 fallback。

## Highway Live mode
- `HWY` 按鈕進入全台國道路況視角。
- 綠：順暢（70 km/h+）
- 黃綠：稍慢（50–69 km/h）
- 橘：緩慢（30–49 km/h）
- 紅：壅塞（<30 km/h 或官方壅塞狀態）
- 路段點擊可查看速度與起訖資訊；事件與公開 CCTV 圖層可同時顯示。

## Navigation design
- 規劃階段：最多兩條可比較路線，顯示一高 / 二高 / 高速公路 / 一般道路屬性、ETA、距離、主要經由道路與推薦理由。
- 行駛階段：下一轉向、剩餘距離、前方 FLOW / CCTV / EVENT、公開測速提醒、偏航自動重算。
- 轉彎影像：KartaView 歷史街景僅作環境辨識輔助，不是 Junction View、不代表當下路況，也不取代道路標誌與現場號誌。

## Runtime limits
- 定位需 HTTPS（或 localhost）與使用者授權。
- 公開路由、路況與 CCTV 均為 best-effort；上游可能離線、改網址、限流或不允許播放。
- 這是 Zero-Key 公開資料實驗版，不宣稱具備 Google Maps / Apple Maps / 1968 等服務的完整私有資料、即時 ETA 或專有 Junction View 覆蓋率。

Service-worker shell cache: `eye-taiwan-shell-v390`.
