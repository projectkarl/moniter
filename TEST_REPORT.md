# Test report — EYE // TAIWAN v0.38.0

**PASS — full regression + original-source CCTV + scenic fusion checks**

## v0.38 Original Source + Scenic Fusion
- Taipei CCTV official BOTE source mapping: PASS
- New Taipei CCTV official ATIS source mapping: PASS
- Runtime has no twipcam playback/index fallback: PASS
- `monitor1.wfuapp.com` is reference-only and never a playback source: PASS
- Relative reference article links normalize to the reference origin: PASS
- Official wrapper pages can be re-parsed for direct media: PASS
- API reports `referencePlaybackCount: 0`: PASS
- Verified Taoyuan official scenic live sources included: PASS
- Place name is forwarded to scenic/CCTV source resolution: PASS
- Scenic cameras are prioritized at the searched target while road CCTV remains fused around it: PASS
- Scenic map cards retain click-to-large playback: PASS
- Service worker shell: `eye-taiwan-shell-v380`: PASS

## Full regression
All existing API, CCTV/HLS, national flow, search fusion, navigation, live-location, map-point, region correction, playback, v0.37 side-intelligence and original-parity suites pass.

---

# Test report — EYE // TAIWAN v0.37.0

**PASS — full regression + v0.37 map/side-intelligence interaction checks**

## v0.37 Map Ops + Side Intelligence
- Place-search CCTV previews remain directly on the Leaflet map: PASS
- CCTV quick action refreshes on-map previews instead of forcing intel open: PASS
- Clicking map CCTV still opens the large draggable CCTV popup: PASS
- Large popup centers/clamps inside the map workspace when the desktop side panel is open: PASS
- Desktop intelligence occupies a dedicated right-side column outside the map: PASS
- Map invalidates/re-lays out CCTV preview cards after side panel transitions: PASS
- Mobile intelligence uses a separate right-side drawer and new 戰情 dock action: PASS
- Mobile place search remains map-first; intelligence stays closed until explicitly opened: PASS
- Original CONTACT TRACK / 3D cockpit / source-status / sensor / annotation parity: PASS
- Service worker shell: `eye-taiwan-shell-v370`: PASS

## Full regression
All existing API, CCTV proxy/HLS, national flow, search fusion, navigation, live-location, map-point, region correction, playback, original parity and UI suites pass.

---

# Test report — EYE // TAIWAN v0.36.0

**PASS — syntax + smoke + API contract + original parity + navigation + CCTV + flow + v0.29–v0.36 regression suites**

## v0.36 navigation / live location / map interaction checks
- Search bar exposes a current-location action and continuous `watchPosition()` tracking.
- Dragging/zooming the map pauses automatic follow so GPS updates do not fight manual map use.
- Clicking a blank map point calls reverse geocoding and then the normal target-intel/CCTV pipeline.
- Nearby CCTV preview cap increased to 5 / 6 / 8 for narrow mobile / mobile / desktop, while collision-aware layout and staggered playback remain enabled.
- Mobile intel panel keeps its header outside the independently scrolling intel body so the collapse button remains reachable after long scrolling.
- Long-trip route API blends OSRM with a highway-biased Valhalla candidate when available.
- Long-trip client scoring favors meaningful highway corridors while keeping alternate-route time/distance bounds.
- Runtime fallback test confirms a valid Valhalla highway route is returned when OSRM is mocked offline.
- Traffic runtime fallback test confirms PBS outage returns HTTP 200 degraded state instead of a fatal 502.
- Freeway-flow runtime fallback test confirms LiveTraffic outage returns HTTP 200 degraded/unavailable state instead of a fatal 502.
- Service worker shell bumped to `eye-taiwan-shell-v360`.

## Regression coverage
All existing repository tests completed successfully after updating current-build assertions, including Search Fusion / Huanan HQ, Taipei 101 CCTV fallback, A11/MRT search normalization, national traffic flow, dual-route navigation, CCTV proxy/HLS playlist rewrite, mobile floating CCTV, live analysis, CCTV region correction, playback acceleration, and original feature parity.

## Important runtime limitation
Commercial navigation products have proprietary traffic models and larger private POI/road telemetry datasets. This zero-key build uses public/open routing and traffic sources and therefore cannot guarantee identical route choices or traffic freshness. v0.36 is designed to degrade gracefully instead of fabricating data or blocking the rest of the map when an upstream service is unavailable.
