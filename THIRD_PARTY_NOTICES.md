# Third-party notices

EYE // TAIWAN does not relicense third-party data, map tiles, video streams or imagery.

- OpenStreetMap contributors / Nominatim — ODbL and applicable public-service usage policies
- OSRM — open-source routing engine; public demo service is best-effort
- Open-Meteo — public API subject to its terms and fair-use limits
- 交通部高速公路局、公路局、警廣、警政署及其他政府開放資料 — subject to each dataset's license and notices
- 環境部空氣品質開放資料 — used for official AQI observation context; subject to the government dataset license and service terms
- 經濟部水利署防災／淹水警戒開放資料 — used as public warning signals; subject to dataset license and notices
- 臺北市停車管理工程處公開停車資訊 — used for supported parking facility / availability context; subject to Taipei open-data terms
- 臺北市工務局道路施工公開資料 — used for supported current-roadwork context; subject to Taipei open-data terms
- Esri World Imagery plus Esri public place/reference labels — default Zero-Key satellite basemap and labels; subject to Esri terms
- ADSB.lol / public ADS-B source, public seismic sources and public news sources — subject to each source's terms
- Leaflet — BSD-2-Clause
- hls.js — Apache-2.0; loaded on demand only when the browser needs HLS decoding support

CCTV media is shown from a public source URL or through same-origin proxying for HTTPS/stream compatibility. Proxying does not change the source's content license and does not create a video archive.

The area-status / threat display is a visualization derived from public signals. It is not an official emergency-warning service and must not replace notices from competent authorities.


## CesiumJS (lazy 3D cockpit)

The optional 3D cockpit path lazy-loads CesiumJS from a public CDN only when requested. CesiumJS is an open-source geospatial visualization library; its own license and notices apply. The Taiwan build uses OSM imagery over a WGS84 ellipsoid and does not claim Google Photorealistic 3D Tiles or Cesium World Terrain.

## CCTV registry additions (v0.27)
- 嘉義縣政府即時路況 CCTV open dataset: official location / stream metadata published as ODS; used under the source's government open-data terms.
- The app does not redistribute private CCTV, perform face/plate recognition, or infer identities.

## Public CCTV indexing / aggregation (v0.29)

- EYE prefers direct government/open CCTV feeds in its own registry. Those feeds remain subject to each original publisher's license, terms and uptime.
- `twipcam.com/nearby` and public `twipcam.com/cam/...` pages are used as a best-effort nearby public-camera **index** for local target searches. EYE does not claim ownership of those pages or underlying media. Where a browser-compatible public media URL can be resolved, it is displayed through EYE's existing camera compatibility layer; otherwise the public camera page may be shown inside the EYE camera panel.
- `tw.live` is used as a public coverage/reference cross-check, not bulk-ingested or re-licensed. Its FAQ states that embedding, redistribution or commercial reuse of camera imagery requires checking the original image source's authorization/terms.
- Location-only local-government datasets can still be useful for auditing coverage, but they are intentionally excluded from the visible CCTV map when no viewable public image is available.
- Third-party public pages and upstream camera formats may change without notice; EYE treats these integrations as best-effort and does not fabricate an image when resolution fails.

## Optional browser vision analysis (v0.30)
- TensorFlow.js — Apache-2.0 — loaded on demand from jsDelivr only after the user presses VISION LAB.
- TensorFlow Models / COCO-SSD — Apache-2.0 — loaded on demand from jsDelivr for broad object-class detection.
- These libraries are not required for normal map, routing, CCTV playback or official VD/flow sensor fusion.
