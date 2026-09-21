# EYE // TAIWAN — Search Fusion + Map CCTV v0.34.0

Zero-key Taiwan map / traffic / CCTV / navigation experiment designed for lightweight Vercel deployment.

## v0.34.0 Search Fusion

Search is no longer a single-provider "first result wins" flow. The geocoder now:

1. checks a small high-confidence Taiwan shorthand layer;
2. expands common query forms such as MRT stations, intersections, head offices / headquarters / company HQs;
3. queries OpenStreetMap Nominatim and Photon;
4. keeps results inside Taiwan;
5. scores them by name similarity, verified confidence, upstream importance and optional local distance;
6. merges near-duplicate locations and returns the best candidates.

Verified example: `華南總行` resolves to **華南商業銀行總行, 臺北市信義區松仁路123號** rather than an unrelated same-name branch.

This materially improves zero-key place search, but it is not identical to Google Maps/Google Places coverage. Businesses that are absent from the open map datasets can still be missing. Adding a city, district or full address remains the strongest fallback for obscure/new POIs.

## Existing core behavior retained
- Search a place → move map to target → show nearest CCTV live cards directly on the map.
- CCTV live cards are capped to avoid covering the map on mobile.
- National freeway traffic is color-first; large numeric speed labels are suppressed.
- Navigation presents up to two useful alternatives and classifies routes that materially favor National Freeway 1 / 3 when road-step data supports it.
- CCTV popup remains in-page, movable and closable, with optional privacy-preserving browser-side live analysis.
- Manual map movement is guarded against unrelated auto-fly operations.

## Deployment
Upload the project to Vercel as a static/serverless project. No paid API key is required for the included open-data sources.

Service-worker shell cache: `eye-taiwan-shell-v340`.
