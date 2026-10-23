# Improvement Backlog — KLU ERP AutoFill

**Repository:** [tejaswin-amara/klu-erp-autofill](https://github.com/tejaswin-amara/klu-erp-autofill)  
**Reviewed HEAD:** `682d1b7f53294a81e57b721eafe5d6259ef787e5`  
**Observed CI:** [39808685305 — success](https://github.com/tejaswin-amara/klu-erp-autofill/actions/runs/39808685305)

This backlog reflects current repository state and separates established protections from remaining work. Each open task has an acceptance criterion and an explicit evidence requirement.

## Priority definitions

- **P0:** Confirmed critical security/integrity blocker.
- **P1:** Important correctness, reliability, or test-coverage risk.
- **P2:** Material QA, documentation, compatibility, packaging, or provenance improvement.
- **P3:** Optional hardening or lower-impact cleanup.

A high-impact but unverified hypothesis is not automatically a confirmed P0.

## Completed or substantially implemented

| Work | Status | Evidence |
|---|---|---|
| Current HEAD and CI baseline recorded | Complete, with local-environment limitation | HEAD `682d1b7f53294a81e57b721eafe5d6259ef787e5`; [CI run 39808685305](https://github.com/tejaswin-amara/klu-erp-autofill/actions/runs/39808685305) passed |
| Node.js structural checks | Complete baseline | 10 tests passed in latest observed CI |
| Python package checks | Complete baseline | 5 tests passed in latest observed CI |
| Allowlisted release ZIP and checksum generation | Implemented | `scripts/package_extension.py` |
| Archive allowlist, manifest resource, checksum, determinism tests | Implemented | `tests/test_package_extension.py` |
| CI least-privilege token permissions and non-suppressed test steps | Implemented | `.github/workflows/ci.yml` |
| Audit companion documentation | Added on this branch | Links below; pending PR/CI review |

## Deduplicated open backlog

| Task ID | Finding | Task | Priority | Target files | Effort | Acceptance criteria | Status |
|---|---|---|---|---|---|---|---|
| TASK-002 | AUDIT-003, AUDIT-007 | Verify ONNX graph signature, metadata, decoder mapping, and preprocessing contract | P1 | `model/crnn.json`, `model/crnn.onnx`, `content.js`, tests | M | Input/output names, ranks, dimensions, class mapping, and blank-index semantics recorded from evidence; preprocessing change evidence-backed | **Blocked**: model binary/provenance not inspected locally |
| TASK-003 | AUDIT-001, AUDIT-002, AUDIT-010 | Add offline tests and review lifecycle state, selector order, and listener/timer cleanup | P1 | `content.js`, `tests/repository.test.mjs` | M | Reverse-order async completions cannot affect obsolete fixture targets; selector priority explicit; cleanup idempotent; failed init retry tested | Open |
| TASK-005 | AUDIT-004 | Add behavior-level tests for actual logic rather than only static source patterns | P1 | `content.js`, `tests/repository.test.mjs` | M | High-risk control flow is exercised using injectable dependencies and synthetic fixtures; no live ERP requests | Open |
| TASK-004b | AUDIT-005 | Add package negative-path and archive integrity tests | P2 | `scripts/package_extension.py`, `tests/test_package_extension.py`, CI | S | Missing file and symlink inputs fail clearly; ZIP integrity check is explicit; exact allowlist and checksum tests remain green | Partial |
| TASK-006 | AUDIT-006 | Extend Markdown tests to all audit documents and heading fragments | P2 | `tests/repository.test.mjs`, Markdown docs | S | All companion docs included; relative paths and supported local fragments resolve; factual claims are reviewed separately | Open |
| TASK-007 | AUDIT-008, AUDIT-011 | Verify SIMD WASM loading/browser compatibility in Chromium | P2 | `manifest.json`, `content.js`, bundled runtime, README | S | Tested browser version and resource-loading outcomes recorded; no speculative settings | **Blocked**: Chromium not available in audit session |
| TASK-008 | AUDIT-009 | Verify ONNX Runtime version, model provenance, and asset attribution | P2 | `THIRD_PARTY_NOTICES.md`, `NOTICE`, runtime/model/icon assets | M | Each version/license/source statement supported by evidence; unknown facts remain marked unknown | **Blocked**: source/training records required |
| TASK-009 | AUDIT-005, AUDIT-009 | Maintain robust release verification and artifact traceability | P2 | Packaging script, tests, CI | S | CI fails on errors, archive integrity checked, artifact tied to the intended commit, and checksum recorded | Partial |
| TASK-011 | ENV-001 | Repeat direct local verification when network-enabled checkout is available | P2 | Repository | S | Local command output recorded separately from CI evidence; ONNX and browser checks completed if tooling is available | Environment-limited |
| TASK-010 | HIST-001 | Review history for actual sensitive-data exposure | P3 | Git history | S | Real credentials distinguished from public IDs/paths; no unnecessary secret rotation or destructive history rewrite | Open |
| TASK-012 | AUDIT-011 | Consider dynamic resource URL hardening only if a concrete benefit is proven | P3 | `manifest.json`, runtime configuration | S | Controlled browser test demonstrates benefit and confirms resources still resolve | Optional |

## Blocked changes — do not implement speculatively

1. Do not change alpha-channel extraction to RGB/luminance, change normalization, or add image rejection heuristics until the actual model contract is supported by evidence.
2. Do not add `minimum_chrome_version`, `use_dynamic_url`, or additional runtime flags until the bundled version and a controlled Chromium test justify them.
3. Do not claim improved recognition accuracy without a legitimate, authorized, reproducible evaluation.
4. Do not claim training-data license, copyright ownership, or redistribution rights without reliable provenance.

## Recommended work order

1. Add synthetic tests for asynchronous lifecycle, selectors, and resource cleanup.
2. Inspect the ONNX graph offline and obtain a trustworthy preprocessing/model contract.
3. Add package negative-path and ZIP integrity tests.
4. Extend Markdown path and fragment tests to the audit companion documents.
5. Perform Chromium resource loading tests with a local synthetic fixture.
6. Resolve runtime/model/icon/font provenance.

Detailed instructions: [FIX_IMPLEMENTATION_GUIDE.md](FIX_IMPLEMENTATION_GUIDE.md).  
Verification matrix: [TEST_AND_VERIFICATION_PLAN.md](TEST_AND_VERIFICATION_PLAN.md).  
Machine-readable backlog: [audit/improvement-backlog.json](audit/improvement-backlog.json).
