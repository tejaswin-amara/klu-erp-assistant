# Security and Privacy Notes

## Intended behavior

This is a human-controlled visual/accessibility helper. It does not infer CAPTCHA text, fill the verification input, submit a form, collect credentials, or transmit page data to a service.

## Permissions

- `storage`: save a small allowlist of UI preferences.
- `activeTab`: query the current tab after the user opens the extension popup.
- `content_scripts.matches`: exact HTTPS origin configured in `manifest.json`.

No `cookies`, `webRequest`, `debugger`, `scripting`, broad host permission, or background service worker is used.

## Threats and mitigations

| Risk | Mitigation | Residual limitation |
|---|---|---|
| Overbroad host access | Exact HTTPS host match; no `<all_urls>` | A different host requires a deliberate rebuild |
| Automated CAPTCHA bypass | No OCR/model runtime; no input write or form submit; source scan | Static scans are not a formal proof of absence |
| Untrusted runtime messages | Exact message type/property allowlist and sender extension ID check | Chrome/browser integration still warrants manual verification |
| Cross-origin image access | Canvas export failure is caught; no origin workaround | Some images will not be displayed in popup |
| Sensitive storage | Schema sanitizer allows only zoom, filter, and high-contrast preference | Chrome local preference storage remains user-profile data |
| Network exfiltration | No network request APIs in shipped runtime source; popup CSP `connect-src 'none'` | The ERP website itself may use its own network connections independently |
| Unsafe DOM insertion | UI text uses text nodes/textContent; no HTML string injection | Existing ERP page content is outside extension control |
| Unbounded observers/loops | No polling loop or MutationObserver | Page selector behavior is checked only when popup is opened/rechecked |

## Review requirements

Before public distribution, independently review the source and packaged ZIP, confirm permissions in Chrome, and perform a manual Chrome check. The included scanner is a guardrail, not a substitute for security review.
