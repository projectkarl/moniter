# EYE // TAIWAN — Auto Intel v0.15.0

Zero-Key Taiwan situational-intelligence dashboard for Vercel. The primary experience is a MI6/007-inspired black-gold command room: search or speak a destination, then EYE automatically reveals live public CCTV, traffic incidents, freeway flow, weather, speed-enforcement points, related news and public signals. A → B routing and NAV OPS remain secondary tools.

## v0.14 highlights

### Freeway live-speed map
Freeway Bureau `LiveTraffic.xml + SectionShape.xml` data is rendered directly on the map as colored freeway segments. The map also places decluttered `km/h` badges along the visible corridor.

Visualization guide used by the UI:
- light green: 70+ km/h — clear
- yellow-green: 50–69 km/h — moderate
- orange: 30–49 km/h — slow
- red: under 30 km/h — congested

Official congestion status is still respected: a segment reported as slow/congested by the source remains elevated even when a raw speed threshold alone would place it in a lighter band. These colors are an EYE visualization aid, not a replacement for official road signs or control-center messages.

The flow layer loads automatically for the default Taipei command-center view and refreshes whenever a destination is acquired. Dark road casing is drawn underneath the colored line so the status remains legible on both Tactical and Satellite basemaps.

## Main workflow

1. Open: map starts at Taipei city center.
2. Search or speak a destination; local aliases cover common Taiwan malls, campuses, stations, hotels and landmarks.
3. EYE automatically assembles target-area intelligence, weather, incidents, freeway speeds, CCTV, speed-enforcement information, related news, airspace and seismic signals.
4. Choose a route only when alternatives actually exist.
5. Start NAV OPS only when the user wants continuous position tracking.

Point-to-point can also be entered in one query, for example `北車 → 101` or spoken naturally.

## CCTV

CCTV is shown inside EYE instead of opening a separate site. `/api/cctv-feed` provides same-origin handling for compatible public HTTP/HLS media. Unsupported or unavailable signals remain in-page and show signal unavailable.

No plate OCR, face recognition or cross-camera person/vehicle tracking is implemented.

## Zero-Key sources

The runtime does not require user API keys. It uses public/open sources and free public endpoints with caching and graceful degradation. Public endpoints are best-effort and can change or become temporarily unavailable.

## Deploy to Vercel

Deploy this folder as a Vercel project. No environment variables are required for the base experience.

## Important

Traffic colors, route scores, lane-flow estimates and ETA are informational. Driving decisions must follow actual signs, lane-control signals, police/road-authority instructions and conditions on the road.


## v0.15 AUTO INTEL

- 搜尋任一地點後，自動一次載入：天氣、交通事件、國道即時流速、公開 CCTV、測速點、相關新聞、周邊 ADS-B 航空訊號與 24 小時地震訊號。
- 主畫面改為直覺 A → B 點到點欄位；單純搜尋會自動把目的地同步到 B 點。
- CCTV 仍直接內嵌在結果區，不需要另開來源頁。
- 低速「異常」只用於 A → B 路線風險判斷與 NAV OPS；一般地點查詢只顯示客觀即時流速，不額外打擾。
- 地圖濾鏡減暗、字體與結果卡放大，提高桌機與手機可讀性。
