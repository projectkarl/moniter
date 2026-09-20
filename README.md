# EYE // TAIWAN — Pre-Mission Command v0.12.0

A lightweight, mobile-first Taiwan public-signal intelligence console inspired by the open-source God's Eye View interaction language. The product is deliberately centered on **pre-trip monitoring / situational awareness first**, with navigation as a secondary field mode.

## v0.12 highlights

### 1. PRE-MISSION COMMAND CENTER
Searching a destination does not immediately force turn-by-turn navigation. The system first locks the target and assembles a compact pre-mission brief from available public signals:

- weather / rain probability
- public traffic events
- freeway live speed / congestion
- nearby public CCTV
- public speed-enforcement points
- nearby public ADS-B aircraft
- regional earthquakes
- local news where available

`THEATER` mode expands the target area into a wider public-signal picture.

### 2. CRITICAL TRAFFIC ALERT / CONDITION RED
Route candidates are scored with verifiable signals. A full-screen cinematic alert is triggered for conditions such as:

- road closure / access conflict
- multiple severe low-speed segments
- very low minimum live speed
- corridor-wide low average speed
- several simultaneous low-speed segments
- severe flow anomaly combined with multiple public traffic events

The alert shows the actual known reasons (collision, construction, closure, congestion event, live speed collapse, high rain probability). When there is no known event, the UI explicitly says the cause is unconfirmed rather than inventing one.

### 3. MULTI-PATH ROUTE INTELLIGENCE
The OSRM request asks for up to 3 alternative driving routes. When 2–3 genuinely distinct routes are returned, the UI shows every option with:

- baseline ETA
- distance
- risk state: NOMINAL / WATCH / CRITICAL
- public traffic event count
- available live flow speed
- FASTEST / SHORTEST / RECOMMENDED badges

The recommendation is selected using a deterministic operational score that combines baseline duration, public events and severe live-flow anomalies. If the router only returns one distinct drivable path, the app says so and does not fabricate an alternative.

### 4. TAIWAN SHORTHAND / POI SEARCH
A local, zero-network suggestion layer handles common Taiwan shorthand before calling geocoding. Examples include:

- malls / landmarks: `101`, `A11`, `A8`, `A9`, `A13`, `遠百`, `板橋大遠百`, `台中大遠百`, `LaLaport南港`
- universities: `台大`, `宜大`, `北科大`, `台科大`, `政大`, `師大`, `清大`, `成大`
- public places / districts: `北車`, `南科`, `竹科`, `中科`, `南港展覽館`, `北流`
- hotels: `晶華`, `台北老爺`, `礁溪老爺`, `新竹老爺`, `知本老爺`

Ambiguous terms such as `遠百` and `老爺` open a local branch selector rather than silently choosing a random branch. No Nominatim request is sent on each keystroke.

### 5. LIVE VISION ANALYTICS + TUNNEL FLOW EDGE
Public CCTV is enhanced with nearby official Freeway Bureau VD sensor data where available:

- lane speed
- occupancy
- volume
- average speed
- short-horizon FLOW EDGE probability

The lane analysis is generic: it is not hard-coded only for Snow Mountain Tunnel. Any tunnel / tunnel approach with sufficiently nearby lane-level public VD can receive the same analysis. If the required lane-level signal is missing, the UI shows insufficient signal instead of making up a prediction.

Tunnel FLOW EDGE is informational only. It is not a promise that a lane will remain faster and must never be used to justify unsafe or prohibited lane changes. The Snow Mountain Tunnel safety note remains stricter because lane changing inside the tunnel is prohibited.

### 6. GOD'S EYE VIEW-STYLE KEYLESS FEATURES
v0.12 exposes more of the source project's high-value interaction ideas while keeping the Taiwan product lightweight:

- GLOBAL CONTEXT / THEATER mode
- CCTV wall and camera handoff
- click-to-focus public aircraft and earthquake contacts
- map share links that preserve target and sensor style
- NORMAL / NVG / FLIR / NOIR / CRT visual sensor looks
- TACTICAL OSM and keyless Esri SATELLITE map source modes
- radar sweep, target acquisition, satellite-handoff and signal-acquisition transitions
- continuous NAV OPS as an auxiliary field mode

This is not a claim of full feature parity with every upstream layer. Layers that conflict with the project's zero-key/lightweight requirement are intentionally omitted or kept optional.

## Natural voice mission example

> 我等下要去 LaLaport 南港，現在會塞車嗎？需要帶傘嗎？

The app separates destination, traffic, weather and umbrella intent; uses browser GPS as origin when allowed; obtains route alternatives; builds route intelligence; checks arrival-time weather; and can speak a concise mission brief.

## NAV OPS

Navigation remains secondary to pre-trip monitoring but includes:

- browser GPS tracking
- speed / heading / remaining distance
- baseline remaining ETA
- route deviation warning
- early public speed-enforcement warning
- published enforcement-point speed-limit display when supplied by the source
- route-adjacent public CCTV handoff
- public traffic-event alerting

## Zero-key architecture

Normal operation does not require API keys or environment variables. Public/community endpoints are cached or throttled where appropriate. Public services do not provide a commercial SLA, so every layer is designed to degrade independently.

## Deploy to Vercel

1. Unzip the project.
2. Import the folder or repository into Vercel.
3. Framework preset: **Other**.
4. No build command.
5. No environment variables required.

## Privacy and safety

- Browser location is requested only after a user action and is kept in the current session.
- No user-location database is included.
- No face recognition, plate OCR, license-plate search, or cross-camera vehicle tracking.
- CCTV lane analysis uses aggregate traffic sensor data rather than identifying individual vehicles.
- Public speed-enforcement data is informational; road signs and official traffic controls always take precedence.
