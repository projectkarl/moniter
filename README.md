# EYE // TAIWAN — Clear Map CCTV v0.23.0

Zero-Key Taiwan situational-intelligence dashboard for Vercel. The interface keeps the MI6/007-inspired intelligence-console language, while the **map itself is now natural, bright and readable**. Search or speak a place once and EYE assembles the relevant public intelligence in one result view. A → B routing and NAV OPS remain secondary tools.


## v0.23 Clear Map CCTV

### Map clarity first

- Normal mode no longer applies the black-gold/inverted filter to map tiles. The spy aesthetic stays in HUD, panels, target locks and alerts rather than obscuring geography.
- The default basemap now follows the upstream God's Eye View Zero-Key idea more closely: **Esri World Imagery** plus public place-reference labels for readable roads and labels. A clear OpenStreetMap street map remains one tap away.
- A compact horizontal map dock replaces map-blocking layer windows: `SAT / MAP / FLOW / CAM / EVT / SPD`.
- Leaflet popups, map markers, freeway `km/h` badges, hotspot labels and target information are enlarged.
- User-facing typography across search, POI suggestions, intelligence cards, route ETA, CCTV metadata and national-watch cards is substantially larger.

### CCTV direct in-page playback

- Public CCTV is now routed through the same-origin `/api/cctv-feed` path whenever a camera ID is available instead of sending normal HTTPS feeds directly to the browser. This avoids many source-side CORS/hotlink failures.
- The proxy now probes the upstream media type and distinguishes HLS, MJPEG, still-image snapshots and normal video.
- HLS uses native playback when available, otherwise hls.js is loaded on demand with a secondary CDN fallback.
- JPEG/snapshot cameras refresh in-place; MP4/WebM Range requests preserve upstream `206`, `Content-Range` and `Accept-Ranges` semantics.
- Basic CCTV wrapper pages can be inspected server-side for a directly referenced public media URL.
- CCTV privacy blur remains available but is **off by default** so public traffic imagery is visible immediately. No plate OCR, face recognition or cross-camera vehicle/person tracking is added.
- If an upstream public camera is genuinely offline or exposes an unsupported/non-browser media protocol, EYE stays on the same page and shows a signal-state card; it never redirects the operator away.


## v0.22 Map-First Command

### v0.22 UX declutter

- The map is now the protected primary canvas. Desktop uses an icon-first rail, a smaller national summary, and one result board instead of several persistent windows.
- Temporary Route / CCTV / Ops / Source / Settings panels are mutually exclusive: opening one closes the others.
- Mobile keeps the result board as a bottom drawer capped at roughly 38% of viewport height, preserving the map above it.
- `MAP FOCUS` temporarily hides all nonessential chrome for a clean tactical map view.
- The Taiwan national monitor can be collapsed to a slim header without losing the live map.
- The boot sequence has a much larger Taiwan silhouette, title, status line and progress treatment for a more cinematic first impression.


- Desktop UI rebuilt around the approved black-gold intelligence-control-room concept: left operations rail, full-Taiwan tactical map, source-state strip, quick Sensor Look rack, and a denser right-side intelligence board.
- Mobile remains map-first: larger 16px search type, larger intelligence typography, clear A → B row, bottom intelligence drawer, and reduced overlays so the map remains visible.
- Operations rail buttons are wired to real functions (overview, traffic, CCTV, weather, environment, news, Global Context, settings).
- Right-panel tabs jump to live overview / CCTV / traffic / weather / situation cards rather than acting as decorative UI.
- Existing v0.20 parity features remain: cockpit/follow, click-to-track, voice markup, detection overlay, sensor looks, Global Context, source provenance, Zero-Key data gateway, and 2/12 Vercel Hobby functions.

## v0.20 Original Parity

This release restores the key interaction grammar that made the upstream God's Eye View distinctive while keeping the Taiwan build Zero-Key and Vercel Hobby friendly.

### Original-interaction parity

- **Click-to-track:** aircraft, CCTV, traffic events, speed-enforcement points, seismic contacts and freeway-flow segments enter one unified TARGET LOCK HUD with metadata.
- **Aircraft follow:** tracked ADS-B contacts refresh roughly every 8 seconds and leave a fading tactical trail.
- **3D Cockpit:** selecting an aircraft can lazy-load CesiumJS and follow the live public ADS-B contact on an OSM/WGS84 ellipsoid globe. This is intentionally labeled as a derived visualization, not Google Photorealistic 3D Tiles.
- **Voice markup:** Zero-Key browser speech commands support local annotations and sensor/track commands such as `標記這裡集合點`, `畫路線到台北101`, `圈出這裡3公里`, `清除標註`, `切換夜視`, `追蹤最近航班`, `進入座艙追蹤`.
- **Sensor looks:** NORMAL / NVG / FLIR / NOIR / CRT / SNOW affect the tactical map, in-page CCTV media and 3D cockpit canvas. They are visual filters only and do not change the underlying data.
- **Detection overlay:** optional screen-space ID framing for map contacts only. It does not perform computer vision on CCTV, plate OCR, face ID or person tracking.
- **Source transparency:** a persistent provenance ribbon shows `FLOW LIVE · CCTV LIVE · ETA MODEL · ALERT DERIVED`. The SOURCE STATUS drawer lists each layer source and whether it is LIVE, OBSERVED, MODEL, DERIVED, ESTIMATED, STATIC, VISUAL, SIMULATED or UNAVAILABLE.
- **Global Context / Share:** Taiwan Theater and shareable view state remain available.

### Data truthfulness

The upstream project distinguishes live, delayed, simulated and estimated layers. This build follows the same rule. Official freeway flow is labeled LIVE; official AQI is OBSERVED; OSRM ETA and Open-Meteo context are MODEL; lane-flow probabilities and traffic threat fusion are DERIVED; 3D cockpit camera framing is ESTIMATED; speed-camera locations are STATIC public records; NVG/FLIR/CRT/NOIR/SNOW are VISUAL only. Unsupported or unavailable sources are shown as unavailable rather than replaced with fake data. The Taiwan build currently does not ship a rocket-trajectory layer, so it does not fabricate a reconstructed launch estimate.

## v0.19 National Watch

This release makes Taiwan-wide monitoring the default command-room state while preserving the search-once local intelligence workflow.

### TAIWAN NATIONAL GRID

The default landing state is now the whole Taiwan command view rather than Taipei city center. EYE loads Taiwan-wide freeway flow, nationwide traffic events and the available public CCTV registry, then keeps the flow/event picture refreshed every 60 seconds while this view is active.

Only the most severe freeway corridors are promoted to tactical `CRITICAL` callouts, so the national map remains readable. The hotspot panel shows:

- current corridor speed
- road / section
- the nearest matching public traffic event when one is available
- otherwise a transparent `reason unconfirmed` / continuous-low-speed explanation
- the nearest embeddable public CCTV within the hotspot area when available

The worst hotspot is automatically handed to the small in-page CCTV preview. Camera registry data remains cache-friendly and is not re-fetched every minute. Clicking the EYE logo or the `TAIWAN` control returns to the national view.


### AREA THREAT RADAR
After a target is acquired, EYE automatically fuses currently available public signals into an area status:

- official Taiwan AQI observations
- flood-warning signals
- traffic incidents / closures
- construction affecting traffic
- rain / arrival weather

The result is presented as `NOMINAL`, `WATCH`, or `CRITICAL`, with the contributing reasons shown. This is an information-fusion display, not an emergency authority warning system.

### PARKING INTEL
For Taipei coverage, EYE automatically finds nearby public parking facilities and current available-space data when the source provides it. The closest useful options are shown directly in the target-intelligence result.

Outside supported detailed-availability coverage, the parking card degrades gracefully instead of inventing capacity.

### CONSTRUCTION INTEL
Taipei's current-roadwork open data is shown automatically near the searched target, including whether the source marks the work as affecting traffic. Elsewhere, construction-like road events can still appear through the existing nationwide traffic-event feed when available.

### OFFICIAL AQI
The previous model-only air-quality context is supplemented by Taiwan environmental open-data observations. The target result shows the nearby observation, AQI/status, and data age when available.

### DATA AGE / INTEL CONFIDENCE
Important cards expose source age and classify it visually as `LIVE`, `AGING`, or `STALE` using source-appropriate freshness windows rather than presenting all data as equally current.

### FLOW TIME MACHINE
A → B / NAV OPS can keep rolling freeway-flow snapshots locally in the browser for roughly the latest hour. Once enough samples exist, EYE classifies the observed corridor as:

- `EXPANDING` — congestion / slowdown appears to be worsening
- `RECOVERING` — speeds are improving
- `STABLE` — no strong directional change
- `COLLECTING` — not enough local history yet

A scrubber lets the user inspect the locally accumulated snapshots (time, corridor average, minimum speed and low-speed segment count). This history is collected on the user's device from repeated lookups / navigation refreshes. It does **not** pretend to have historical telemetry on the first launch.

### WATCH ZONES
The user can bookmark up to six target areas locally. This is a quick-access status list, not background monitoring or push notifications.

## Main workflow

1. Open: map starts with the full Taiwan national grid and live freeway-flow corridors.
2. Severe nationwide congestion is automatically promoted into small tactical hotspot notes, with a nearby public CCTV preview when available.
3. Search or speak one destination; local aliases cover common Taiwan malls, campuses, stations, hotels and landmarks.
4. EYE automatically reveals target weather, area status, AQI, flood/roadwork signals, parking where supported, traffic events, freeway flow, inline CCTV, speed-enforcement points, related news, airspace and seismic signals.
5. Use A → B only when route comparison is needed.
6. Start NAV OPS only when continuous position tracking / route-flow anomaly monitoring is wanted.

Point-to-point can also be entered directly, for example `北車 → 101` or spoken naturally.

## Freeway live-speed map

Freeway Bureau live-traffic + section-geometry data is rendered directly on the map with de-cluttered `km/h` labels:

- light green: 70+ km/h — clear
- yellow-green: 50–69 km/h — moderate
- orange: 30–49 km/h — slow
- red: under 30 km/h — congested

These are EYE visualization bands for rapid situational awareness, not legal speed limits or official congestion definitions.

## CCTV

CCTV remains in-page. `/api/cctv-feed` provides same-origin handling for compatible public HTTP/HLS media. Unsupported or unavailable signals stay inside the result card and show signal unavailable.

No plate OCR, face recognition or cross-camera person/vehicle tracking is implemented.

## Mobile visibility

- search and A → B controls are compressed into two compact rows
- the intelligence sheet is capped so the map remains the primary mobile visual surface
- key text, ETA, traffic/news rows, CCTV metadata and freeway speed labels are enlarged
- tactical-map brightness/contrast is increased and heavy vignette/scanline effects are reduced

## Zero-Key / Hobby architecture

No environment variables are required for the base experience.

This build uses only **2 Vercel Serverless Functions**:

- `/api/data` — one gateway for geocode, weather, route, CCTV registry, traffic, freeway flow, lane flow, news, speed enforcement, aircraft, earthquakes, official AQI, parking, construction, flood-warning data and health checks.
- `/api/cctv-feed` — dedicated same-origin CCTV/HLS media proxy.

Actual source adapters live under `/server/`, keeping the project below the Vercel Hobby Serverless Function limit.

## Coverage notes

- Official AQI and flood-warning layers are designed for Taiwan-wide public datasets.
- Detailed real-time parking availability in this build currently uses Taipei open data; do not interpret the absence of results elsewhere as “no parking”.
- Detailed current roadwork in this build currently uses Taipei open data; nationwide traffic/incident feeds can still surface construction-like events elsewhere.
- Public endpoints and CCTV streams are best-effort and can change independently of this codebase.

## Deploy to Vercel

Deploy this folder as a Vercel project. No environment variables are required for the base experience.

## Driving / safety note

Traffic colors, route scores, lane-flow estimates, congestion-trend labels and ETA are informational. Driving decisions must follow actual signs, lane-control signals, police/road-authority instructions and current road conditions.
