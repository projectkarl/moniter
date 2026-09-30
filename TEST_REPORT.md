# SENTINEL // TAIWAN v2.4.0 Cloudflare — Test Report

## Result

PASS — local project checks, Cloudflare routing, CCTV proxy, ANPR wiring, and playback-first live-analysis checks all passed.

## Playback changes verified

- HLS low-latency chasing is disabled in favor of a stable live buffer.
- Forward buffer increased to 30 seconds with a 45-second maximum.
- Live edge sync uses 3 segments and allows up to 8 segments of latency before recovery.
- Fatal HLS network and media errors have automatic recovery paths.
- Live analysis waits for a rendered video frame before copying pixels.
- Analysis resolution is capped at 480px on desktop and 360px on mobile.
- Object detection uses a reduced result count and higher threshold to reduce main-thread work.
- Analysis cadence adapts to measured processing time.
- Analysis is skipped while the video does not have enough buffered data.
- Plate OCR runs asynchronously from the main object-detection loop.
- Default plate OCR load is reduced to one vehicle per OCR cycle and a 3-second interval.
- Heavy backdrop blur and decorative CCTV analysis effects were removed.
- CCTV analysis labels and side text were simplified to normal Chinese wording.

## Commands executed

- `node --check public/app.js`
- `npm run check`
- `npm run test:playback`
- `npm run test:anpr`
- `npm run test:cctv`

## Passed checks

- Cloudflare project files present.
- Static Assets configuration valid.
- `/api/health` returns 200 in local worker test.
- Legacy `/api/data?action=health` adapter returns 200.
- 19 frontend API actions are routed.
- CCTV wrapper discovery → HLS master → child playlist → media segment rewriting passes.
- Cookie and Referer propagation passes.
- Cross-host HLS resource guard passes.
- Authorized-camera ANPR allowlist remains locked by default.
- Night enhancement, skew correction, keystone adjustment, and multi-frame vote wiring remain present.
- Playback-first HLS configuration and adaptive analysis scheduling are present.

## Not covered locally

A real deployed `workers.dev` URL and real third-party CCTV feeds were not available in this local test. After deployment run:

```bash
BASE_URL=https://your-project.workers.dev npm run smoke
```
