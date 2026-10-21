# Architecture Decision Record: Rebuild as a Human-Controlled Assistant

- Status: Implemented for review; browser verification remains outstanding
- Version: 2.0.0
- Date: 2026-10-21

## Context

The uploaded source archive contains `lib/ort-wasm-simd.wasm`, `lib/ort-wasm.wasm`, `lib/ort.min.js`, and `model/crnn.onnx`. The original `content.js` loads the ONNX model, preprocesses the challenge image, decodes its output, writes the decoded answer into an input, and retries after image refresh. That behavior is incompatible with this project's non-negotiable safety requirement.

## Decision

Rebuild the extension as a narrowly scoped Manifest V3 popup and content script that only helps a person inspect the CAPTCHA visually and navigate the ordinary form. Do not include OCR, ML inference, answer prediction, input population, or form submission.

## Key choices

1. **Vanilla JavaScript; no runtime package dependencies.** The implemented requirements do not justify a framework or third-party runtime library.
2. **No background service worker.** A popup-to-content-script message is sufficient; persistent background work is unnecessary.
3. **Exact verified HTTPS origin.** The original manifest identifies `https://newerp.kluniversity.in/*`. The rebuilt manifest scopes itself to that host and fails closed in the content-side origin check.
4. **In-memory image data URL.** The extension may rasterize the already displayed image for magnification. Canvas failures are handled without relaxing browser security restrictions or making a network request.
5. **Strict message types and sender verification.** The content script rejects unrecognized types, extra properties, and messages from any sender whose extension ID is not the current extension ID.
6. **Synthetic tests plus honest browser limitations.** Node unit/integration tests and package verification are executable offline; they do not prove compatibility with a live ERP account.

## Consequences

- Automatic CAPTCHA solving has been intentionally removed and will not be reintroduced.
- The extension does not work on arbitrary hosts. A different portal requires a deliberate origin configuration and rebuild.
- Site-specific selectors can drift. In that case, the helper should report a missing element instead of inspecting unrelated inputs or guessing.
- The canvas magnifier can fail for protected cross-origin images; direct on-page inspection remains available.
