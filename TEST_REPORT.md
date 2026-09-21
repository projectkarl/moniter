# Test report — EYE // TAIWAN v0.34.0

**PASS — syntax + smoke + API contract + original parity + navigation + CCTV + flow + v0.29/v0.30/v0.31/v0.32/v0.33/v0.34 regression suites**

## v0.34 search checks
- Build label and service-worker cache v340.
- Front-end verified `華南總行` shorthand and POI suggestion.
- Server verified-landmark / fusion / ranking / deduplication pipeline.
- Corporate shorthand expansions for 總行 / 總部 / 總公司.
- Multi-provider Nominatim + Photon normalized search retained.
- Simulated wrong upstream result: a Kaohsiung Huanan branch cannot outrank the verified Taipei head office.
- Verified Huanan head-office coordinates preserved.
- Verified landmark still resolves if open-provider requests fail.

## Regression status
All repository test scripts completed successfully after the v0.34 changes, including existing search aliases, MRT normalization, A11, Taipei 101 CCTV stability, dual-route navigation, national traffic flow, mobile CCTV popup and original-parity suites.

## Important limitation
The project intentionally remains zero-key and does not use Google Places. OpenStreetMap/Photon coverage is broad but not equivalent to Google's proprietary POI index; very new or obscure businesses may still require a more complete address.
