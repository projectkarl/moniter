# Test report — EYE // TAIWAN v0.32.0

## Result

**PASS — syntax + smoke + API contract + original parity + navigation + CCTV + flow + v0.29/v0.30/v0.31 regression suites**

## v0.32 checks

- Local CCTV retains official position-only records.
- Embeddable nearby CCTV fallback is present for direct-feed failures.
- CCTV load/wall selection does not auto-fly the map.
- Search request sequence guard prevents stale target rendering.
- Mobile map-first declutter and 3-action dock are present.
- Service worker cache bumped to v320.


### v0.32 execution result

- Full script suite: PASS.
- Taipei 101 CCTV fallback request: 5 verified nearby camera records returned without waiting for slow upstream feeds.
- Verified fallback cameras: Taipei 101, 信義松智東南角, 市府東南（松壽松智）, 信義路－莊敬路口, 信義松仁.
- `app.js`, `server/cctv.js`, and `server/cctv-registry.js`: syntax PASS.

## v0.31 / v0.31.1 checks

- Mobile map-first layout and coordinated intelligence drawer: PASS
- Extra mobile provenance / duplicate flow HUD declutter: PASS
- Narrow-phone national summary compression: PASS
- Taipei 101 fallback origin / reference center: PASS
- Dedicated CCTV popup DOM: PASS
- CCTV popup drag logic and close control: PASS
- Popup above other mobile overlays: PASS
- Live person/vehicle analysis boxes drawn over the active CCTV: PASS
- 4–5 second live-analysis refresh loop: PASS
- Old separate still-analysis canvas hidden: PASS
- Privacy guardrail: no face, plate, identity, cross-camera tracking or precise vehicle-model recognition: PASS
- Search normalization for 臺/台, MRT/station and intersection forms: PASS
- Nominatim primary + Photon zero-key fallback: PASS
- Strong local partial-POI resolution path: PASS
- Service worker cache bumped: PASS

## Preserved baseline

- Original click-to-track, cockpit, Sensor Looks, source matrix, annotations and Advanced Ops handlers: PASS
- A→B navigation, GPS follow, turn guidance, reroute and speed-alert path: PASS
- National CCTV registry / in-app CCTV feed proxy / wrapper media discovery: PASS
- Public traffic, flow, weather, AQI, flood, parking, construction, news, flights and earthquake API contracts: PASS
- Vercel footprint remains two API functions (`api/data.js`, `api/cctv-feed.js`): PASS

## Runtime note

Public camera and government/third-party feeds can still be temporarily offline, rate-limited or change upstream formats. LIVE ANALYSIS also depends on the selected stream being sampleable by the browser and on the on-demand TensorFlow.js / COCO-SSD CDN load. Normal CCTV viewing and official VD/flow fusion remain separate from that optional analysis path.
