# SENTINEL // TAIWAN Initial 1.0.1 — Playback Stabilization Report

Date: 2026-09-30

## Issue addressed
CCTV streams could appear normal at first and then suddenly pause together. The root cause was primarily front-end lifecycle churn rather than one upstream CCTV source: nearby CCTV, road CCTV, and scenic CCTV datasets arrive asynchronously, and older code rebuilt the preview/player DOM each time a later dataset arrived. That removed active `<video>` / HLS instances and restarted them. Multiple simultaneous map HLS previews also increased browser decoder/network pressure, especially on mobile.

## Fixes
- Active inline CCTV is preserved while background CCTV registry enrichment updates the list.
- Selecting the same camera no longer recreates its video/HLS instance unless the user explicitly requests a camera change.
- Map CCTV previews now update incrementally instead of clearing/rebuilding every preview on each data refresh.
- Simultaneous map live-preview budget is limited to 2 on desktop and 1 on mobile; other cards remain clickable and open the full live stream.
- Old HLS instances are explicitly destroyed when a real context change occurs (new target, route mode, national mode), preventing hidden background streams from consuming bandwidth.
- HLS preview buffering is more conservative than the main player; the main player keeps lower-latency settings while previews favor stability.
- Service Worker shell cache advanced to `sentinel-taiwan-shell-initial101` so the fixed `app.js` is not masked by the previous cached build.

## Regression tests
All local test suites passed:
- Cloudflare project and 19 API route coverage: PASS
- CCTV wrapper/direct/proxy/HLS/segment/Cookie/Referer/signature tests: PASS
- Official CCTV registry parser tests: PASS
- Playback lifecycle regression tests: PASS
- Navigation one-shot speech tests: PASS
- Authorized ANPR tests: PASS
- HTML/CSS page audit: PASS
- Mobile viewport/RWD baseline tests: PASS

Note: headless Chromium runtime rendering is unavailable in this container, so the mobile runtime audit falls back to CSS/parser/viewport checks. Final live-stream availability still depends on the deployed Cloudflare edge and each upstream CCTV at that moment.
