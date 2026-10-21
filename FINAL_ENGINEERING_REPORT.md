# Final Engineering Report — KLU ERP Manual CAPTCHA Assistant v2.0.0

**Report date:** 2026-10-21  
**Verdict:** **READY WITH DOCUMENTED LIMITATIONS — for local evaluation; not yet production-validated in Chrome**

## A. Executive verdict

The safe rebuild is implemented in the source tree and a real runtime ZIP has been created. All 13 Node unit/integration tests passed, the project's source-level safety scan passed, the synthetic local microbenchmark passed its 500 ms p95 gate, the release ZIP's SHA-256 matched, and a fresh extraction validated every packaged file's CRC/size and manifest references.

**Important limitation:** An installed Chromium 144 executable was present, but a headless smoke attempt timed out while launching even `about:blank`, accompanied by D-Bus connection errors. Therefore the extension has **not** been proven in an interactive Chrome session or against a live ERP page. Perform the manual Chrome acceptance checklist in `docs/testing.md` before production use.

## B. Source and architecture

- **Original archive:** `nlehogaopgpmhideimmccgohnjaepnom.zip`
- **Original archive SHA-256:** `25ebecb31109a8c70c733b8eaa5c4deaf3a55234db1109f938e034095e510dfa`
- **Archive entries:** 14
- **Archive compressed size:** 18,483,410 bytes
- **Archive total uncompressed size:** 34,972,950 bytes
- **Rebuild decision:** Approach B — ground-up rebuild.
- **Observed legacy files:** `lib/ort-wasm-simd.wasm` (10,912,730 bytes), `lib/ort-wasm.wasm` (9,931,804 bytes), `lib/ort.min.js` (570,149 bytes), and `model/crnn.onnx` (13,532,033 bytes), plus `model/crnn.json`.
- **Verified ERP origin:** `https://newerp.kluniversity.in`, read from the original `manifest.json`.
- **Root-cause evidence:** The original `content.js` loads `model/crnn.onnx` through ONNX Runtime Web, converts the displayed CAPTCHA to a tensor, decodes predicted characters, writes them into the CAPTCHA input, and retries after image refresh. This behavior has been removed in the rebuild.
- **Final stack:** Chrome Manifest V3, vanilla JavaScript, no runtime package dependencies, no background service worker.

## C. Requirements and changes

| Requirement | Result | Evidence |
|---|---|---|
| Remove ONNX/WASM/model assets and automated CAPTCHA inference | Implemented in rebuild | Release source/file tree contains no legacy runtime/model files; static scan checks prohibited references |
| Remove answer auto-fill and form auto-submit | Implemented in content logic | Content actions only inspect the rendered image, focus the visible input, or click an explicitly user-triggered refresh control; source scan checks submission patterns |
| Restrict to exact origin | Implemented | Manifest matches only `https://newerp.kluniversity.in/*`; runtime origin validation is exact |
| Minimal permissions | Implemented | `storage`, `activeTab`; no `host_permissions`, no `<all_urls>`, no service worker |
| No extension-initiated network calls | Implemented in runtime source | Static source scan; popup CSP includes `connect-src 'none'` |
| Validate content-script messages and senders | Implemented | Exact message type/property allowlist and strict extension ID check; integration test |
| Defensive DOM/image handling | Implemented | Synthetic image-present/image-missing/unsupported-origin test cases |
| User-controlled magnification and manual page assistance | Implemented in source | Popup controls plus synthetic integration tests; live page visual check remains unverified |
| Release integrity | Passed | ZIP written, checksum verified, archive CRC/size verified after fresh extraction |

## D. Defects remediated

1. **P0 — CAPTCHA bypass inference:** Removed ONNX Runtime Web binaries, its JavaScript loader, the CRNN model/metadata, answer decoding, and field population behavior.
2. **P0 — Unverified host scope:** The original manifest did provide a hostname; the report's earlier claim that it was unavailable due truncation was incorrect. The rebuild uses the observed exact HTTPS origin rather than inventing one.
3. **P1 — Excessive runtime complexity:** Replaced model-serving code and retry loops with a small, locally executed assistance surface.
4. **P1 — Message trust:** Added allowlisted message types, exact schemas, and sender ID verification in the content script.
5. **P1 — Robust image access:** Image rasterization fails closed when the image is unavailable, too large, or blocked by cross-origin canvas protection.

## E. Functional verification

Executed from `/mnt/data/klu-erp-assistant`:

| Command/check | Result |
|---|---|
| `npm ci` | **PASS** — lockfile-only project installed offline; no runtime dependencies required |
| `npm test` | **PASS** — 13 tests, 13 passed, 0 failed, 0 skipped, exit code 0 |
| `npm run verify:security` | **PASS** — manifest/reference checks and the project's static prohibited-pattern/secret checks passed |
| `npm run benchmark` | **PASS** — 500 samples per synthetic operation; p95 gate below 500 ms |
| `npm run release` | **PASS** — tests, static scan, benchmark, packaging, and fresh-extraction validation all completed with exit code 0 |
| `unzip -t dist/klu-erp-assistant-v2.0.0.zip` | **PASS** — no archive compression errors |
| Headless Chromium smoke test | **NOT RUN TO COMPLETION** — Chromium 144 process timed out at startup even for `about:blank`, with D-Bus connection errors; no extension browser pass is claimed |

### Benchmark results

Environment: Node.js `v22.16.0`, Linux x64. Each metric used 500 in-process samples; these are **synthetic microbenchmark results, not Chrome end-to-end measurements**.

| Operation | Median | p95 | Maximum |
|---|---:|---:|---:|
| URL validation | 0.0016 ms | 0.0033 ms | 0.0714 ms |
| Message validation | 0.0003 ms | 0.0015 ms | 0.0542 ms |
| Preference sanitization | 0.0003 ms | 0.0014 ms | 0.0426 ms |
| Synthetic DOM inspection | 0.0026 ms | 0.0038 ms | 0.5055 ms |

## F. Security and privacy

- Manifest version: 3.
- Permissions: `storage`, `activeTab`.
- Host match: `https://newerp.kluniversity.in/*` only.
- No cookies, broad host permissions, background worker, OCR/ML runtime, model, external solver, or remote executable code is packaged.
- Display preferences are limited to zoom, visual filter, and high-contrast UI.
- CAPTCHA answers and password values are not read or stored by the extension logic.
- Static scanning is a project-level guardrail and is not a formal proof or third-party SAST certification.

## G. Accessibility and performance

The popup includes semantic sections, labels, keyboard-operable controls, visible focus rings, a live status region, a high-contrast theme, reduced-motion CSS, and readable manual-entry instructions. The build is accessibility-oriented; **a full WCAG audit, measured contrast audit in rendered Chrome, and screen-reader session were not completed**.

Synthetic operation p95 values are far below the 500 ms target, but they should not be presented as real browser interaction latency. Headless Chrome could not be run successfully in this environment.

## H. Release artifact

- **ZIP:** `dist/klu-erp-assistant-v2.0.0.zip`
- **Bytes:** 20,536
- **SHA-256:** `40bb8e31d2f4cfd775ba145df263f3b7732f7e47e8e319f7d2eb5441a4f59623`
- **Packaged files:** 21
- **Checksum and fresh-extraction validation:** Passed.
- **Fresh extraction path:** `dist/unpacked-verify`
- **Manifest file references:** validated against the fresh extraction.

The release artifact does not contain tests, the project verification scripts, the original ONNX Runtime files, or the original model.

## I. Installation

1. Extract `klu-erp-assistant-v2.0.0.zip` to a folder.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the extracted directory containing `manifest.json`.
5. Open `https://newerp.kluniversity.in/`, then open the extension popup.
6. Use magnification/filter controls and manually type the CAPTCHA answer on the ERP page.

## J. Remaining limitations

1. Interactive Chrome extension loading and popup/content integration have not been successfully browser-tested in this environment; perform the manual checklist in `docs/testing.md` before production use.
2. Canvas export may be blocked for a cross-origin CAPTCHA image; the extension deliberately fails safe and directs the user to inspect the original image on the ERP page.
3. Selector compatibility beyond the attributes inferred from the original `content.js` has not been verified against a live page.
4. Full WCAG/screen-reader verification has not been performed.
5. `LICENSE-NOTICE.txt` is a notice, not a license. The project owner must decide the applicable licensing terms.


## K. Repository quality automation

The source tree includes `.github/workflows/ci.yml`, `CONTRIBUTING.md`, `package-lock.json`, and the release ZIP plus checksum under `release/v2.0.0/`. The CI workflow is configured to run the automated checks and upload the release artifact, but no GitHub Actions result is claimed until the workflow runs in a published repository.
