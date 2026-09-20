# Test report — v0.12.0 Pre-Mission Command Zero-Key

## Static / package checks
- `app.js` syntax: PASS
- all `/api/*.js` syntax: PASS
- `manifest.webmanifest`: valid JSON
- `vercel.json`: valid JSON
- runtime frontend contains no required `process.env`: PASS
- referenced frontend DOM IDs all exist in `index.html`: PASS (102/102)
- multi-route UI (`routeOptions`) present: PASS
- CONDITION RED alert UI (`threatAlert`) present: PASS
- THEATER mission UI present: PASS
- local POI suggestions UI present: PASS
- map source selector present: PASS

## Logic smoke tests
A Node VM smoke harness was used to exercise pure frontend logic without calling external services.

- `遠百` produces multiple local branch suggestions: PASS
- `北科大` resolves to National Taipei University of Technology suggestion: PASS
- compound voice phrase `我等下要去LaLaport南港，現在會塞車嗎需要帶傘嗎`: PASS
- severe route scenario produces `red` threat state: PASS
- severe route reasons include multiple verifiable signal types: PASS
- generic non-Snow-Mountain tunnel name (`蘭潭隧道`) enters tunnel context: PASS
- N5 mountain corridor fallback enters tunnel context: PASS
- operational route score penalizes heavy events / severe flow anomalies: PASS

## Route behavior
- OSRM call requests up to 3 alternatives.
- UI can render 2–3 distinct route choices when returned.
- Each route shows baseline ETA, distance, risk state, event count and available flow speed.
- RECOMMENDED route uses deterministic operational score.
- If only one distinct route is returned, UI explicitly says so and does not generate a fake alternate.

## CONDITION RED behavior
- road closure can trigger red alert: PASS by logic inspection / smoke scenario
- multiple severe low-speed segments can trigger red alert: PASS
- corridor average <= 32 km/h can trigger red alert: PASS
- 3+ low-speed flow segments can trigger red alert: PASS
- alert reason classification includes closure / collision / road work / disabled vehicle / congestion / flow drop / weather: PASS
- optional WebAudio alert tone is failure-tolerant if browser autoplay policy blocks audio: PASS by implementation review

## Search behavior
Local suggestion matching is performed entirely in the browser and does not query Nominatim while typing. The upstream geocoder is only called after a target is submitted/selected, preserving the existing request throttle/cache design.

## Tunnel / lane analysis behavior
The lane-flow endpoint remains generic freeway VD analysis. v0.12 removes the Snow-Mountain-only tunnel presentation assumption: named tunnel metadata and N5 mountain corridor context can activate tunnel safety presentation. Lane FLOW EDGE still appears on any roadway with sufficient lane-level VD data, whether or not it is a tunnel.

The system intentionally does not claim every tunnel has lane-level public sensor coverage. Missing lane data must render as insufficient signal.

## Browser rendering limitation in this build container
Chromium headless rendering could not be completed reliably because the page waits on external CDN/tile resources and the build container's external network/DNS path is restricted. Previous layout code remains responsive, and this release did not replace the core desktop/mobile geometry. Final live-source and visual QA should still be run once deployed on Vercel.

## Final API contract mock suite
Mocked provider responses were run through the actual Vercel function handlers:
- weather: PASS
- route: PASS
- CCTV: PASS
- traffic events: PASS
- freeway flow: PASS
- local news: PASS
- public speed-enforcement points: PASS
- lane-level VD / FLOW EDGE: PASS
- ADS-B flights: PASS
- earthquakes: PASS

## Final packaging checks
- all frontend/backend JavaScript syntax: PASS
- all 102 `$()` frontend DOM references resolve to IDs in `index.html`: PASS
- stale prior-version screenshots removed from package: PASS
