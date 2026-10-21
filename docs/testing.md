# Testing and Verification

## Run locally

```sh
npm test
npm run verify:security
npm run benchmark
npm run release
```

- `npm test`: Node's built-in test runner for URL validation, message schemas, preferences, synthetic DOM behavior, and content-script messaging/lifecycle.
- `npm run verify:security`: checks the manifest, file references, permissions, remote request and dynamic execution patterns, prohibited model references, and automatic submission patterns.
- `npm run benchmark`: records median, p95, and maximum time over 500 samples for URL validation, message validation, preference sanitization, and synthetic DOM inspection. It is an in-process microbenchmark, not Chrome end-to-end latency.
- `npm run release`: executes tests and the safety scan, benchmarks, creates a deterministic extension ZIP and SHA-256 file, extracts it into a fresh directory, checks CRC/size/checksum, and validates manifest references.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes to `main`, pull requests, and manual dispatch. It uses the committed npm lockfile, then runs `npm test`, `npm run verify:security`, `npm run benchmark`, `npm run package`, and `npm run validate:package`. The workflow uploads the generated ZIP and SHA-256 file. A workflow definition is not evidence of a successful GitHub Actions run; check the repository's Actions tab for the actual result after publishing.

## Synthetic browser fixture

`tests/fixtures/synthetic-erp.html` is for local testing only. It contains no production credentials and no real CAPTCHA answer. A Chromium 144 executable and Python Playwright are present in the current environment, but the headless browser smoke attempt timed out while launching even `about:blank`, with D-Bus connection errors. Therefore no Chrome extension UI/browser E2E pass is claimed. Run the manual Chrome checks below before using the extension with the production ERP.

## Acceptance boundary

Tests must assert that extension actions do not read or write CAPTCHA input contents and do not submit a form. Tests are not to use live student accounts or attempt to solve a production CAPTCHA.


## Manual Chrome acceptance checklist

1. Load the freshly extracted ZIP using `chrome://extensions` → **Developer mode** → **Load unpacked**.
2. Open the configured ERP hostname and use the extension popup.
3. Confirm the status is supported and, where canvas export is permitted, the image preview appears.
4. Test all zoom/filter choices, keyboard navigation, and the visible focus indicator.
5. Check that the CAPTCHA field remains untouched until the user types into the ERP page.
6. Confirm the extension does not submit the login form.
7. Test missing image and unsupported host states.
8. Confirm the page's native refresh control remains usable and that the extension refresh action only runs after the user presses its button.
9. Check `chrome://extensions` for manifest, CSP, or runtime errors.
