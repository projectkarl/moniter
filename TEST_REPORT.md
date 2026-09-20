# Test report — v0.15.0 Auto Intel Zero-Key

## Passed

- Frontend JavaScript syntax: PASS
- All Vercel function JavaScript syntax: PASS
- Static smoke test / required assets: PASS
- Manifest and Vercel JSON parse: PASS
- Operations logic test: PASS
- Mock API contracts: PASS for weather, route, CCTV, traffic, freeway flow, news, speed enforcement, lane-level VD, flights and earthquakes
- In-page CCTV feed proxy test: PASS
- Zero-key runtime architecture retained: PASS
- Build label: `0.15.0 AUTO INTEL`

## v0.14 flow-layer checks

- Freeway segments are rendered with a dark tactical road casing plus a colored speed line: PASS
- Light green clear-flow class: PASS
- Yellow-green moderate-flow class: PASS
- Orange slow-flow class: PASS
- Red congested-flow class: PASS
- `km/h` badges are rendered directly on freeway geometry: PASS
- Badge de-cluttering / spacing logic is present: PASS
- High-priority slow/congested segments are favored for labels: PASS
- Default Taipei bootstrap already loads freeway flow automatically: PASS
- Flow legend is present on desktop and responsive on mobile: PASS

## Visualization bands

The UI visualization currently uses 70+, 50–69, 30–49 and under-30 km/h bands, while also respecting the upstream slow/congested status. These are display bands for rapid situational awareness and should not be interpreted as legal speed limits or official congestion definitions.

## Live-source limitation

The code and mocked API contracts were tested in the development runtime. A final deployment check on Vercel is still necessary for current external government feeds, map tiles and individual CCTV stream formats because availability can change independently of this codebase.


## v0.15 checks

- One-query AUTO INTEL card renders traffic/news/signal summaries without opening drawers: PASS
- A → B fields are visible and route action works directly: PASS
- Search result syncs into B point: PASS
- General target brief does not classify flow anomalies; anomaly logic remains in route/NAV processing: PASS
- Default Taipei center loads weather, traffic, flow, CCTV, speed cameras, news, airspace and seismic signals: PASS
- Larger typography and brighter tactical map do not cause horizontal overflow on 390 px mobile: PASS (Playwright layout width 390/390)

- Desktop layout check at 1440×900: PASS (no horizontal overflow; command 650 px, intel 390 px).
- Mobile layout check at 390×844: PASS (no horizontal overflow; command and intel leave a visible map corridor).
