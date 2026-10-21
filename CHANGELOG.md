# Changelog

## 2.0.0 — 2026-10-21

### Safety-related breaking changes
- Removed the bundled ONNX Runtime Web runtime, both WASM binaries, and the CRNN ONNX model from the reconstructed extension.
- Removed automated CAPTCHA inference, answer injection, and answer-submission behavior; these features are intentionally unsupported.

### Added
- Minimal Manifest V3 extension for user-controlled CAPTCHA magnification.
- Exact HTTPS host matching based on the manifest found in the supplied archive.
- High-contrast and grayscale visual filters.
- Explicit, user-triggered focus and recognized refresh-control helpers.
- Preferences validation, message allowlisting, source scanning, unit/integration tests, reproducible package generation, SHA-256 checksum, and fresh-extraction verification.

### Limitations
- This build has not been interactively verified against a live ERP account. Automated checks use synthetic DOM fixtures.
- Cross-origin images that cannot be safely rasterized are not shown in the extension popup.
