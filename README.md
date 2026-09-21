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

## v0.40.1 CCTV Visible First

This patch keeps the working national FLOW layer unchanged and focuses only on CCTV visibility. A nearby-place lookup now paints official CCTV points as soon as coordinates are available, then upgrades playable cameras and adds slower freeway/highway sources in a background enrichment pass. `POINT` means an official published camera location whose original public stream is not currently available or not yet resolved; it is not a fabricated live feed.
