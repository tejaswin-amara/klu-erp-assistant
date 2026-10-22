# Improvement Backlog

This backlog reflects the verified repository state after the repository-quality-gates commit `f12d0c71345ea82ffe9176cc6b945bba87adb2e9`. It separates completed repository engineering from runtime and provenance work that remains unverified.

## Completed at the baseline

| Item | Status | Evidence |
| --- | --- | --- |
| Dependency-free structural test suite | Done | `tests/repository.test.mjs` |
| Python packaging tests | Done | `tests/test_package_extension.py` |
| CI on pushes and pull requests | Done | `.github/workflows/ci.yml` |
| Explicit release-file allowlist | Done | `scripts/package_extension.py` |
| Embedded per-file checksums and ZIP sidecar | Done | Packager and package tests |
| Inclusion of legal notices in release ZIP | Done | Exact archive-content tests |
| Privacy and third-party-notice clarification | Done, with provenance open | `docs/PRIVACY.md`, `THIRD_PARTY_NOTICES.md` |

## Prioritized remaining work

| ID | Priority | Work item | Acceptance criteria | Dependencies / caveats |
| --- | --- | --- | --- | --- |
| REM-001 | P1 | Add behavior-level regression coverage for lifecycle and DOM-selection concerns | Tests use isolated synthetic DOM and controllable promises; failures reproduce deterministically; no live ERP calls | Keep testing offline or in an explicitly authorized non-production environment; preserve human verification and manual submission |
| REM-002 | P1 | Validate model metadata, ONNX input/output shape, and decoder assumptions against an authoritative model contract | A recorded model contract identifies input/output names, ranks, dimensions, alphabet mapping, blank-index convention, normalization, and tensor layout; mismatches fail closed | Requires trustworthy model/training provenance or reproducible ONNX inspection; do not guess at preprocessing changes |
| REM-003 | P2 | Verify ONNX Runtime Web version and bundled artifact provenance | Runtime version and applicable license notices are traceable to a release/source; bundled hashes are recorded | Requires upstream release/build evidence; a file hash alone does not identify a release |
| REM-004 | P2 | Resolve icon/font provenance | Identify the icon source and any font used to rasterize it, document source and applicable license, and include required attribution | Current repository does not by itself prove the full source/attribution chain |
| REM-005 | P2 | Validate browser compatibility of the SIMD WASM asset | Document the minimum supported Chrome version and verify asset loading in a supported Chromium build | Do not add speculative runtime flags or browser manifest constraints before testing |
| REM-006 | P3 | Evaluate dynamic web-accessible URLs | A Chromium test confirms all model/runtime resources still resolve with dynamic URLs and no regression is introduced | Optional hardening, not a prerequisite for the current package |
| REM-007 | P2 | Continue documentation and release-quality checks | CI verifies Markdown relative links, changelog alignment, exact archive allowlist, checksums, and deterministic ZIP output | Follow-up CI must pass on the PR before the backlog item is marked complete |

## Change-control requirements

- Do not mark a finding fixed based solely on an implementation outline or a test that only searches source strings.
- Record exact commands, CI links, and artifact checksums for each verified change.
- Do not claim model accuracy, compatibility, license ownership, or training-data provenance without evidence.
- Make future changes in a focused pull request and review the diff before merging.
