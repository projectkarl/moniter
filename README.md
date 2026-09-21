# EYE // TAIWAN — Original Source CCTV + Scenic Fusion v0.38.0

Zero-key Taiwan traffic / CCTV / navigation experimental web app.

## v0.38.0
- 所有新增 CCTV 整合以「原始公開來源」為正式播放來源：政府 HLS/MJPEG/影像、政府官方播放器或官方 YouTube。
- `monitor1.wfuapp.com` 僅作為來源目錄／辨識參考，不作播放器、iframe 或最後 fallback。
- 臺北可解析攝影機編號時直接連臺北市交通管制工程處 `hls.bote.gov.taipei`；新北可解析設備編號時直接連新北市 ATIS。
- 高速公路局、公路局與既有地方政府 CCTV 繼續使用原始公開端點。
- 搜尋景點時，景點官方直播會優先出現在搜尋原點；同時保留搜尋點周圍道路 CCTV，小窗直接在地圖展開。
- 景點來源支援動態解析：若參考目錄只提供官方播放頁，系統會再往官方頁解析一次，能找到 YouTube/HLS/JPEG/MP4 時直接使用媒體來源。
- 找不到可驗證原始公開來源時不嵌第三方參考站，寧可標示無可播放來源。
- 地圖仍維持 v0.37 的 Map Ops：CCTV 即時小窗留在地圖；區域戰情、Sentinel、Flow、Source Status 等資訊留在桌機右側／手機戰情抽屜。

## Map / CCTV behavior
- 搜尋地點：目標原點 + 景點直播（若有）+ 周邊道路 CCTV。
- 窄手機最多 5、一般手機 6、桌機 8 個地圖 CCTV 預覽，沿用避碰與錯峰載入。
- 點任一 CCTV 小窗可開啟地圖區中央可拖曳大畫面。
- CCTV 影像分析維持匿名車流／物件密度用途，不做人臉或車牌辨識。

## Navigation / traffic retained
- 跨縣市／中長途會融合 OSRM 一般候選與高速公路偏好候選，保留兩條合理替代路線。
- 即時路況與 freeway flow 來源暫時失敗時採快取／降級，不讓整個地圖功能失效。
- 搜尋框支援目前位置，使用 `watchPosition()` 持續定位；手動拖曳會暫停自動跟隨。
- 點地圖空白位置可反查該點並載入附近情報與 CCTV。

## Runtime limits
- 定位需 HTTPS（或 localhost）與使用者授權。
- 公開路由、路況與 CCTV 均為 best-effort；上游可能離線、改網址、限流或不允許嵌入。
- EYE 不宣稱等同商業導航的私有交通/POI 資料完整度。

Service-worker shell cache: `eye-taiwan-shell-v380`.
