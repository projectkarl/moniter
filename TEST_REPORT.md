# Test report — v0.26.0 Live Navigation Zero-Key

## v0.26 navigation regression — PASS

- OSRM route adapter requests and returns turn-by-turn steps: PASS
- Large next-turn UI (`navTurnArrow / navTurnText / navTurnDistance / navTurnRoad`): PASS
- Turn instruction translation / early-near-now voice stages: PASS
- GPS map follow with route look-ahead point: PASS
- Route-position calculation upgraded from sparse-point sampling to segment projection: PASS
- Dynamic off-route threshold uses GPS accuracy: PASS
- Consecutive / severe deviation triggers automatic reroute: PASS
- Reroute starts from current GPS position and preserves destination: PASS
- Navigation mode hides nonessential right-panel cards while active: PASS
- Speed-enforcement early warning + published-limit HUD retained: PASS
- Desktop static layout 1440×900: no horizontal overflow.
- Mobile static layout 390×844: no horizontal overflow; navigation remains a bottom/right intel mode rather than a map overlay.
- Vercel Hobby functions remain 2 / 12.
- Runtime remains Zero-Key.

Automated check: `scripts/nav-v26-test.mjs`.

---

# Test report — v0.25.0 National Monitor Zero-Key

## v0.25 regression targets

- Taiwan-wide default view and nationwide live-flow bootstrap.
- Highway flow uses color bands; no permanent speed labels on map.
- Nationwide CCTV markers rendered on homepage.
- Monitor / Navigation search modes.
- Taipei local CCTV location + city VD support.
- Smaller speed-enforcement markers.
- CCTV privacy shield changed from full-frame blur to local bottom ROI only.
- Vercel Hobby functions remain 2 / 12.
- Runtime remains Zero-Key.

## Automated regression

See `scripts/smoke.mjs`, `scripts/ui-v22-test.mjs`, `scripts/original-parity-test.mjs`, `scripts/ops-logic-test.mjs`, `scripts/api-contract-test.cjs`, and `scripts/cctv-feed-test.cjs`.

---


## v0.24 Clean Command UX regression

- CONTACT TRACK is embedded in the right-side automatic intel column: PASS
- NAV HUD is embedded in the right-side automatic intel column: PASS
- Multi-route / operational brief uses inline right-side card instead of floating OPS drawer: PASS
- Persistent public-signal standby/ribbon does not cover map: PASS
- Freeway road colors remain visible while always-on km/h badges are removed: PASS
- Segment click popup still exposes travel speed / congestion metadata: PASS
- Desktop map viewport reserves the intelligence side column: PASS
- Earth → Taiwan opening sequence DOM/CSS/JS present: PASS
- Layer controls no longer occupy a vertical map-blocking panel: PASS

# Test report — v0.24.0 Clean Command Zero-Key

## Core regression — PASS

- Frontend JavaScript syntax: PASS
- All Vercel function and server-module JavaScript syntax: PASS
- Static smoke test / required assets: PASS
- Manifest and Vercel JSON parse: PASS
- Operations logic test: PASS
- Mock API contracts: PASS
- In-page CCTV feed proxy regression: PASS
- Zero-Key runtime architecture retained: PASS
- Build label: `0.24.0 CLEAN COMMAND`




## v0.23 Clear-map / CCTV regression — PASS

- Default map source state is satellite and uses Esri imagery + public reference overlays: PASS
- Normal mode tile CSS has no grayscale/invert filter: PASS
- Map-FX control defaults OFF: PASS
- Privacy shield defaults OFF while remaining user-toggleable: PASS
- Compact horizontal `SAT / MAP / FLOW / CAM / EVT / SPD` quick dock is present: PASS
- Overlay visibility toggles control the existing Leaflet layer groups without creating new server functions: PASS
- Larger user-facing typography overrides are present for search, POI suggestions, intelligence cards, popups and freeway speed labels: PASS
- CCTV frontend always prefers same-origin `/api/cctv-feed?id=...`: PASS
- CCTV media probe endpoint returns format metadata without adding a Serverless Function: PASS
- HLS playlist rewrite regression: PASS
- HLS native/hls.js browser path: PASS (external hls.js CDN availability still requires deployment-network QA)
- Snapshot/JPEG refresh path: PASS
- MP4/WebM Range/206 proxy handling: PASS by code inspection / mocked response contract
- Wrapper-page media discovery path: PASS by syntax/static regression; source-specific live behavior requires deployed feed QA
- Vercel Hobby functions remain **2 / 12**: PASS


## v0.22 Map-First Command UI checks — PASS

### v0.22 map-visibility QA — PASS

- Chromium static-layout audit: desktop **1440×900**, document **1440 / 1440**, no horizontal overflow.
- Chromium static-layout audit: mobile **390×844**, document **390 / 390**, no horizontal overflow.
- National landing state: intelligence result panel hidden; compact national monitor only; map remains the dominant canvas.
- Search-result state: desktop intelligence board **350px** wide; mobile bottom board capped at **38dvh**.
- Temporary drawers are mutually exclusive through `openOverlayPanel()`.
- Source provenance remains visible in the top LIVE / OBSERVED / MODEL / DERIVED strip while the duplicate floating ribbon is removed from the map.
- Larger boot composition checked at desktop and mobile CSS breakpoints.
- Vercel Hobby functions remain **2 / 12**.


- Desktop viewport layout check: **1440×900**, document width **1440 / 1440**, no horizontal overflow.
- Desktop geometry: operations rail `96px`, search console `650px`, intelligence board `400px`, national monitor `510px`; all stay inside the viewport.
- Mobile viewport layout check: **390×844**, document width **390 / 390**, no horizontal overflow.
- Mobile search after hardening: query field **242px** + visible **58px** search action; no clipped action button.
- Map-first mobile layout retained: operations rail and sensor rack collapse away, intelligence stays a bottom drawer, and the national monitor remains above the mobile dock.
- Left operations rail actions are wired to live functions; right intel tabs scroll to real cards; Sensor Look quick controls reuse the existing sensor implementation.
- PWA icon assets verified at **192×192** and **512×512**.
- Visual screenshots were rendered from the real HTML/CSS with network-dependent map tiles disabled for layout QA; live map/data rendering still requires the deployed environment.

## v0.20 Original Parity checks — PASS

- Unified TARGET LOCK HUD and metadata detail DOM: PASS
- Click-to-track wiring for aircraft, CCTV, traffic events, speed cameras, earthquakes and freeway-flow segments: PASS
- ADS-B follow refresh + fading trail logic: PASS
- Lazy 3D Cockpit loader / CesiumJS integration path: PASS (static/runtime wiring; external CDN availability still requires deployed-network QA)
- 3D cockpit explicitly labels OSM/WGS84 ellipsoid visualization rather than photoreal terrain: PASS
- Voice markup local command parser (mark / route line / radius zone / clear / sensor / track): PASS
- Annotation add / clear logic: PASS
- NORMAL / NVG / FLIR / NOIR / CRT / SNOW controls: PASS
- Sensor styles cover map, CCTV media and 3D cockpit canvas: PASS
- Detection overlay is restricted to map contacts and does not add CCTV CV/plate/face analysis: PASS
- Persistent provenance ribbon: PASS
- SOURCE STATUS layer matrix with LIVE / OBSERVED / MODEL / DERIVED / ESTIMATED / STATIC / VISUAL / SIMULATED / UNAVAILABLE taxonomy: PASS
- Source matrix explicitly distinguishes baseline ETA/modelled context from official live observations: PASS
- DOM reference audit: 0 missing referenced IDs
- Vercel Hobby functions: 2 / 12
- `scripts/original-parity-test.mjs`: PASS

## v0.19 National Watch checks — PASS

- Default boot uses a Taiwan-wide map view instead of Taipei-only focus: PASS
- Taiwan-wide freeway flow boot radius is active: PASS
- National traffic/CCTV data can be loaded without drawing hundreds of default markers: PASS
- National hotspot panel and map callout DOM are present: PASS
- Severe flow corridors are promoted to a maximum of four readable tactical callouts: PASS
- Total severe-corridor count is kept separately from the top-four display list: PASS
- Hotspot reason logic prefers nearby public accident / closure / construction events and otherwise reports low-speed / unconfirmed cause without inventing a cause: PASS
- Nearest public CCTV selection is capped to a hotspot-area distance and remains in-page: PASS
- Initial hotspot CCTV preview does not zoom the national map away from the Taiwan-wide view: PASS
- Selecting a hotspot zooms to the corridor and updates the small CCTV monitor: PASS
- National flow + traffic refresh loop runs every 60 seconds while national mode is active: PASS
- CCTV registry is reused between minute refreshes instead of being re-fetched each minute: PASS
- EYE brand and TAIWAN control can return from a local target to the national grid: PASS
- National mode clears stale local route / incident / camera overlays: PASS
- Service-worker shell cache advanced to v19: PASS

## API contract coverage — PASS

Mocked contract tests pass for:

- weather
- route
- CCTV registry
- traffic incidents
- freeway flow
- related news
- speed enforcement
- lane-level VD / FLOW EDGE
- flights
- earthquakes
- official AQI
- parking
- construction
- flood warning

## v0.18 Situation Awareness checks — PASS

- Search-once flow can populate the new situation card without opening a separate feature page: PASS
- AREA THREAT assessment supports NOMINAL / WATCH / CRITICAL: PASS
- Threat reasons can include rain, traffic events, roadwork, AQI and flood-warning signals: PASS
- General place lookup does not use freeway-flow anomaly as a threat reason; flow anomaly remains in A → B / NAV context: PASS
- Official AQI adapter parses site position, AQI/status and observation time: PASS
- Taipei parking adapter merges facility metadata with current available-space data: PASS
- Taipei construction adapter parses coordinates, work time and traffic-impact field: PASS
- Flood-warning KML adapter returns warning records without inventing flood extent: PASS
- DATA AGE helpers classify LIVE / AGING / STALE with source-specific freshness windows rather than labeling every source LIVE: PASS
- Visible situation card includes official AQI, flood/water, parking, construction and freshness feeds: PASS
- Parking / construction / AQI / flood sources load in parallel through `/api/data`: PASS
- Threat radar map layer is separated from route-flow anomaly UI: PASS
- Watch zones persist locally and are capped at six: PASS

## FLOW TIME MACHINE / congestion trend — PASS

- Local rolling flow history is stored by coarse target grid: PASS
- History is bounded to roughly the latest 65 minutes / limited samples: PASS
- First-use state reports `COLLECTING`: PASS
- Worsening mocked speed series reports `EXPANDING`: PASS
- Improving mocked speed series reports `RECOVERING`: PASS
- Neutral mocked series reports `STABLE`: PASS
- FLOW TIME MACHINE scrubber exposes locally accumulated timestamp / average / minimum / low-speed snapshot values: PASS
- EXPANDING / RECOVERING states have distinct tactical visual treatment: PASS
- NAV OPS schedules 60-second flow refresh and clears timer on stop: PASS

The time machine only accumulates while the user performs lookups or NAV refreshes on that device. It does not claim pre-existing history on first launch.

## Freeway flow-map regression — PASS

- Dark tactical road casing + colored speed line: PASS
- Light green / yellow-green / orange / red visualization bands: PASS
- `km/h` labels on freeway geometry: PASS
- label de-cluttering logic: PASS
- default Taiwan national bootstrap loads freeway flow: PASS

## Search / route / mobile regressions — PASS

- Local Taiwan alias layer remains present: PASS
- A → B fields remain visible and direct: PASS
- Destination search syncs into B point: PASS
- Multiple route scoring remains active when distinct alternatives are returned: PASS
- Larger typography / mobile intelligence-sheet CSS remains present: PASS
- mobile map visibility rules remain present: PASS

A fresh live browser screenshot was not used as a pass criterion in the current execution environment. Final visual QA should still be checked after Vercel deployment, especially iOS Safari map tiles, inline CCTV formats and real external-feed latency.

## Vercel Hobby Serverless limit — PASS

- `/api` JavaScript entrypoints: **2** (`data.js`, `cctv-feed.js`)
- Deployment threshold: <= 12
- Result: PASS
- JSON/data sources are dispatched through `/api/data?action=...`
- CCTV/HLS streaming remains a dedicated function

## Live-source limitation

Code paths and mocked API contracts passed. External government feeds, map tiles and individual CCTV streams can change or be temporarily unavailable independently of the application. A final live deployment smoke test remains necessary for current source availability.
