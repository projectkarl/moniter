// SENTINEL v2.3 — AUTHORIZED ANPR allowlist + local tuning
// Add ONLY camera IDs for cameras you own or have explicit permission to process.
// Public government CCTV IDs should remain absent. ANPR is locked unless the exact ID is here.
window.SENTINEL_ANPR_AUTHORIZED_IDS = [];

// Optional per-camera tuning. All OCR remains on-device in the browser.
window.SENTINEL_ANPR_CONFIG = {
  default: {
    intervalMs: 2200,
    minConfidence: 28,
    stableVotes: 2,
    maxVehicles: 2,
    targetWidth: 320,
    skewAngles: [0, -4, 4, -7, 7],
    keystoneStrengths: [0, -0.10, 0.10, -0.16, 0.16],
  },
  cameras: {
    // Example for an owned/authorized camera:
    // 'private-gate-01': {
    //   intervalMs: 1800,
    //   stableVotes: 2,
    //   targetWidth: 380,
    //   skewAngles: [0, -3, 3, -6, 6],
    //   keystoneStrengths: [0, -0.08, 0.08],
    // },
  },
};
