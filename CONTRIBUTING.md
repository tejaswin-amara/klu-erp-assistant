# Contributing

## Scope and safety

This project is a human-controlled accessibility assistant for the KLU ERP verification page. Contributions must preserve the safety boundary: do not add CAPTCHA OCR, model inference, answer extraction, answer auto-population, automated form submission, hidden ERP endpoints, or any other verification bypass.

## Development environment

- Node.js 20 or newer
- Google Chrome for manual extension smoke tests

The project has no runtime npm dependencies. Install the locked project metadata and run the quality gates:

```sh
npm ci
npm test
npm run verify:security
npm run benchmark
npm run release
npm run validate:package
```

## Change requirements

- Keep permissions and host access as narrow as possible.
- Do not add remote executable code or outbound networking without an explicit security review and documented requirement.
- Add tests for every material behavior change and a regression test for each fixed P0/P1 defect where practical.
- Update README, changelog, security documentation, testing documentation, and the engineering report when behavior or verification claims change.
- Never report tests or browser checks as passing unless they were actually run.
- Do not commit credentials, personal data, local caches, or unreviewed build output.

## Pull requests

Include the reason for the change, a brief summary, exact test commands and results, permission changes (if any), security and privacy impact, and any manual Chrome verification that remains outstanding.
