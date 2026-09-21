# Test report — EYE // TAIWAN v0.40.0

**PASS — complete regression suite**

## v0.40 checks
- Empty freeway endpoint coordinates cannot become `[0,0]`: PASS
- Fast section geometry / conditional shape fallback: PASS
- National flow capacity increased beyond old 220-segment truncation: PASS
- National road-camera scope uses Freeway Bureau + Highway Bureau original registries: PASS
- Nearby road CCTV uses fast path: PASS
- Scenic official CCTV enrichment is asynchronous: PASS
- National board progressive flow / event / CCTV paint: PASS
- HWY tactical map mode + network summary: PASS
- Narrow mobile no longer hides map CCTV cards 3+: PASS
- Search/locate/query controls keep dark readable styling: PASS
- Service worker cache `eye-taiwan-shell-v400`: PASS

## Regression coverage
All repository scripts pass, including API contracts, CCTV registry and feed proxy, flow fallback, v0.29–v0.39 regressions, navigation, live location, search fusion, original-source scenic CCTV, mobile UI, HWY mode and original-project parity.

## Runtime note
Public government feeds can still be temporarily offline, rate-limited or changed upstream. v0.40 is designed to show independent sources progressively and preserve the last usable flow display rather than blanking the whole experience when one source degrades.
