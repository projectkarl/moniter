# Test report — EYE // TAIWAN v0.30.0 Clean Navigation + CCTV Vision Lab

## Result

**PASS — original parity + UI handler parity + navigation + CCTV + flow + API-contract + v0.30 UX regression + smoke suite**

The release keeps the original project operations layer while cleaning navigation state and extending the in-app CCTV experience. Vercel Function count remains unchanged.

## v0.30 UX regression — PASS

- Switching NAV → 地點監控 clears active navigation and route presentation: PASS
- Ending navigation clears route geometry / alternate choices / navigation-only fields: PASS
- Speed-enforcement map labels are navigation-only: PASS
- CCTV in-page enlarge control: PASS
- Main inline CCTV receives the existing Sensor Fusion analysis: PASS
- Optional free browser VISION LAB path exists: PASS
- VISION LAB class scope limited to person / car / bus / truck / motorcycle / bicycle: PASS
- Explicit no face / plate / identity / precise vehicle-model claim: PASS
- News `看更多` in-place expansion: PASS
- Desktop top-layout consolidation and mid-width fallback: PASS
- Duplicate Weather DOM removed: PASS
- Duplicate Ops header DOM removed: PASS
- Service Worker cache v30: PASS

## Original-project parity — PASS

Verified present and wired:

- Click-to-track: aircraft, CCTV, traffic event, speed camera, seismic event, freeway-flow segment.
- 3D cockpit / Cesium lazy path.
- Sensor Looks: NORMAL / NVG / FLIR / NOIR / CRT / SNOW.
- Voice markup / local command parser.
- Source catalog, provenance ribbon and source matrix.
- Annotation and detection-overlay logic.
- Advanced Ops: SWEEP / WATCH / MISSION / SENTINEL / THEATER.
- Weather, traffic, freeway flow, news, speed camera, flights, earthquakes, AQI, parking, construction, flood, city-flow and lane-flow API actions.
- Privacy behavior: no plate OCR, no face recognition, no cross-camera tracking.
- FREE 3D navigation, GPS follow, turn guidance, automatic reroute and speed-alert path.

## v0.29 national/CCTV baseline regression — PASS

- A11 direct alias and full-name alias: PASS
- Full-island startup / national geocoder behavior: PASS
- NAV A/B chrome and searched-target seeding: PASS
- Position-only CCTV suppression: PASS
- twipcam nearby public index → in-app camera records: PASS
- Dynamic CCTV feed proxy/media discovery: PASS
- No external-window CCTV fallback: PASS
- National CCTV no client sampling + Canvas renderer: PASS
- National HOTSPOT CCTV preview and nearby-camera fallback: PASS
- Slow-corridor ranking and freeway geometry fallback: PASS
- High-contrast freeway live-flow casing: PASS

## API / deployment — PASS

- `/api/data` contracts: weather, route, CCTV, traffic, flow, news, speed, lane-flow, flights, earthquakes, AQI, parking, construction, flood and city-flow: PASS
- `/api/cctv-feed` inline/probe contract: PASS
- CCTV registry adapters: PASS
- Vercel Serverless Functions: **2** (`api/data.js`, `api/cctv-feed.js`): PASS
- Frontend zero-key scan: PASS
- JS syntax / required static files / JSON manifests: PASS
- `index.html` ID uniqueness: **230 / 230 unique**: PASS

## Vision Lab runtime note

VISION LAB intentionally loads TensorFlow.js + COCO-SSD only after the user asks for frame analysis. It analyzes one currently visible CCTV frame and returns broad object classes plus derived visual density indices. It does not claim real headcount, official venue occupancy, identity recognition, vehicle brand/model recognition, plate OCR or cross-camera tracking. Camera perspective, night conditions, occlusion and source resolution can materially affect the estimate.

If a public CCTV stream cannot be sampled by the browser, VISION LAB reports analysis unavailable while the normal live camera and official VD/flow Sensor Fusion remain usable.

## External-source limitation

Static/regression/API-contract tests pass, but public government/third-party camera and traffic endpoints can be offline, rate-limited or change format independently. A deployed Vercel live smoke test is still required for current upstream availability.
