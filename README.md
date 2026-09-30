# SENTINEL // TAIWAN — Cloudflare v2.4.0

v2.4.0 focuses on smooth CCTV playback while live analysis is enabled.

## Changes

- HLS playback now favors buffering stability instead of aggressively chasing the live edge.
- hls.js uses a larger forward buffer and automatic network/media recovery.
- Live analysis waits for a rendered video frame before copying pixels.
- Detection runs on a smaller 480px / 360px analysis frame and adapts its interval to device performance.
- Plate OCR runs independently from the object-detection loop so OCR no longer holds the next video-analysis cycle.
- Analysis pauses itself when the video buffer is not healthy. Video playback always has priority.
- Expensive blur and glow effects were removed from the live overlay.
- CCTV analysis labels and side descriptions were simplified to normal Chinese wording.

## Commands

```bash
npm install
npm run check
npm run test:playback
npm run test:anpr
npm run test:cctv
npm run deploy
```

After deployment:

```bash
BASE_URL=https://your-project.workers.dev npm run smoke
```

## Plate recognition

Plate recognition remains disabled by default. Add only cameras you own or are explicitly authorized to process to `public/anpr-config.js`.
