# KLU ERP Manual CAPTCHA Assistant

**Version:** 2.0.0 · **Manifest:** Chrome Manifest V3 · **Runtime dependencies:** none

This extension provides user-controlled visual magnification and navigation assistance for the CAPTCHA shown on the configured KLU ERP page. It does **not** recognize, infer, solve, populate, or submit CAPTCHA answers. The user must interpret the image and complete the site’s verification flow manually.

## Verified target origin

The supplied original archive's `manifest.json` specifies `https://newerp.kluniversity.in/*`. The rebuilt extension is configured to that exact HTTPS origin. It does not run on arbitrary websites and does not request `<all_urls>` access.

## Features

- Magnifies the visible CAPTCHA image at 1×, 1.5×, 2×, 2.5×, or 3×.
- Offers standard, high-contrast, and grayscale visual filters.
- Uses a visible status message if the image is missing, unreadable by the browser, or the page is unsupported.
- Can move focus to the human-entry field without reading or modifying its value.
- Can click a recognized visible CAPTCHA refresh control only after the user presses the corresponding extension button; a cooldown prevents rapid repeated clicks.
- Stores only display preferences in `chrome.storage.local`.
- Makes no extension-initiated network requests, and includes no OCR/ML model or WASM runtime.

## Safety and privacy

The extension removes the original package’s ONNX Runtime Web files and the `model/crnn.onnx` model. It does not make network requests, inspect passwords, access cookies or session tokens, retain CAPTCHA answers, populate the answer field, or submit the login form. For magnification, the content script attempts to rasterize the already displayed image into an in-memory data URL. If browser origin protections prevent that operation, it fails safely and instructs the user to inspect the image directly on the ERP page; it does not circumvent those protections.

Permissions are limited to `storage` and `activeTab`. The content script match is an exact configured HTTPS host. The service worker is intentionally omitted. The popup’s content security policy disables connections and remote executable code.

## Install the extension

1. Install Node.js 20 or newer only if you need to run the project's tests or package scripts. A built extension can be loaded directly.
2. Extract `klu-erp-assistant-v2.0.0.zip` into a local folder.
3. Open `chrome://extensions` in Chrome and enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted folder containing `manifest.json`.
5. Open `https://newerp.kluniversity.in/`, then open the extension popup.
6. Inspect the magnified image and enter the answer yourself on the ERP page. The extension does not submit the form.

If the extension was installed before a package update, press **Reload** on its card in `chrome://extensions`, and reload the ERP tab.

## Build and verify from source

From the project root, with Node.js 20+:

```sh
npm test
npm run verify:security
npm run benchmark
npm run release
```

`npm run release` runs the unit/integration suite, source-level safety checks, a synthetic in-process microbenchmark, and deterministic ZIP/checksum packaging followed by a fresh-extraction validation. These checks do not replace an interactive test in Chrome.

### Configure a different ERP origin

Only do this if the ERP portal hostname has been independently verified and you are authorized to use the extension there. Supply an exact HTTPS origin, with no path or wildcard:

```sh
npm run set-domain -- https://erp.example.edu
npm run release
```

The script updates both the manifest match and runtime origin configuration. Chrome must be reloaded after rebuilding. Do not broaden the match pattern to all websites.

## Troubleshooting

- **Unsupported page:** Check that the address bar uses the configured HTTPS origin. Hostnames and subdomains must match exactly.
- **No CAPTCHA detected:** The page’s element identifiers may differ from the selectors supported by this version. The extension does not inspect unrelated form fields; use the ERP page normally and update the selector list only after review.
- **Image cannot be magnified:** The browser may block canvas export for a cross-origin image. Inspect the existing image directly on the page. The extension intentionally does not bypass browser origin protections.
- **Extension cannot message the page:** Reload the extension and the ERP tab. Chrome must inject the content script on the configured host.
- **Refresh button unavailable:** Use the ERP page’s visible refresh control. The extension only recognizes a limited, explicit selector allowlist.

## Development quality gates

See `docs/testing.md`, `docs/security-and-privacy.md`, and `docs/architecture/decision-record.md`. The GitHub Actions workflow in `.github/workflows/ci.yml` runs the test suite, safety scan, synthetic benchmark, deterministic packaging, and archive validation on pushes to `main`, pull requests, and manual dispatch. It uploads the generated runtime ZIP and checksum as a workflow artifact; browser acceptance still requires a real Chrome session.

`CONTRIBUTING.md` documents the security boundary and contribution checks. The source repository also includes the v2.0.0 runtime ZIP and checksum under `release/v2.0.0/`. No license grant is asserted; `LICENSE-NOTICE.txt` records that licensing remains for the project owner to decide.
