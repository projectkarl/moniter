# EYE // TAIWAN — Fast Flow + Progressive CCTV v0.40.0

A zero-key Taiwan map-first traffic / CCTV / navigation experiment.

## v0.40 focus
- Nearby road CCTV first: municipal / freeway / highway road cameras are requested on a fast path and render before scenic-source discovery.
- Scenic live cameras enrich a searched place afterward through the same `/api/data` function, so scenery discovery cannot hold up road CCTV.
- National HWY mode uses the original Freeway Bureau live-traffic feed and draws a nationwide congestion-colored road network using fast section geometry.
- National traffic, events and CCTV paint progressively instead of waiting for the slowest source.
- National status now includes a road-network summary rather than only a few hotspot cards.

## Congestion colors
- Green: clear / about 70 km/h or faster
- Yellow-green: moderately slow / about 50–69 km/h
- Orange: slow / about 30–49 km/h
- Red: congested / below about 30 km/h

These bands are a visualization of available public road performance data, not a guarantee of every vehicle's speed.

## CCTV policy
The application plays original government / official public feeds where available. Third-party index pages are not used as playback surfaces. Official position-only cameras remain identifiable but are not fabricated into live streams.

## Deployment
Deploy the folder directly to Vercel. The architecture keeps two `/api` serverless entrypoints (`data.js` and `cctv-feed.js`).

Service-worker shell cache: `eye-taiwan-shell-v400`.
