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

## Public CCTV discovery links (v0.28)
- `twipcam.com/nearby` is used as a coordinate-based **external discovery link** for public nearby cameras. EYE does not scrape, copy, cache, proxy, or relicense twipcam-owned pages/media through this integration.
- `tw.live/nearby/` is exposed as an external all-Taiwan nearby-camera discovery entry. EYE does not ingest its private site data or rehost its media.
- Location-only local-government CCTV datasets remain useful for source auditing but are no longer returned to the visible map when no reusable public stream is available.
