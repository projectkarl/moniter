# SENTINEL // TAIWAN v2.3.0 Cloudflare — Test Report

Date: 2026-09-29

## Result

PASS — Cloudflare project structure, 19 frontend API routes, static assets, CCTV proxy, traffic live-analysis wiring, and the v2.3 Authorized ANPR+ pipeline all pass local checks.

## Checks performed

- `npm run check` — PASS
  - required Cloudflare files present
  - Worker main/static-assets routing configuration valid
  - `/api/health` and legacy `/api/data?action=health` return 200
  - all 19 frontend API actions have Worker routes
  - live-vision tracking / queue / direction / plate-shield code present
  - Authorized ANPR / Tesseract.js integration present
- `npm run test:cctv` — PASS
  - wrapper discovery -> HLS
  - master/child playlists rewritten through same-origin proxy
  - segment streaming
  - Cookie / Referer forwarding
  - cross-host HLS resource rejected
- `npm run test:anpr` — PASS
  - standard plate normalization samples
  - common OCR confusion repair (`O/0`, `I/1`, `Z/2`, `S/5`, `B/8`, `G/6`)
  - default ANPR allowlist empty
  - authorization requires an exact allowlisted camera ID
  - night enhancement / luminance processing present
  - Otsu thresholding present
  - skew-angle compensation present
  - lightweight keystone compensation present
  - motorcycle ROI variants present
  - multi-frame vote state and stable-read threshold present
  - per-camera ANPR tuning present

## ANPR scope

`AUTHORIZED ANPR` is off and hidden by default. It appears only for exact camera IDs listed in `public/anpr-config.js`. Merely receiving a public camera object is not enough to unlock OCR. OCR runs in the browser, remains transient, and is cleared on camera changes/stops. The application does not add a plate database, plate-history API, owner lookup, cross-camera plate search, or cross-camera identity correlation.

## v2.3 recognition behavior

Each tracked authorized vehicle is sampled over successive frames rather than trusted from one OCR pass. Candidate plate regions cycle through ROI hypotheses; preprocessing cycles between contrast-enhanced / binary / inverted variants; skew and keystone compensation cycle through configured values. A read normally needs at least two agreeing votes before it is shown as stable, unless it reaches the high-confidence single-read fallback. Night/day mode, current skew, keystone setting and OCR-attempt count are visible in the live analysis panel.

## Deployment verification still required

After Cloudflare deployment, run:

```bash
BASE_URL=https://<your-worker>.workers.dev npm run smoke
```

OCR accuracy must also be calibrated using an owned or explicitly authorized real feed because local tests cannot reproduce the deployed camera's plate pixel size, shutter speed, night illumination, IR glare, viewing angle, compression, focus, or browser media behavior.
