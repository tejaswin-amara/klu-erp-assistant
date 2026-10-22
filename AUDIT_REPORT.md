# Repository Audit Report

**Repository:** [tejaswin-amara/klu-erp-autofill](https://github.com/tejaswin-amara/klu-erp-autofill)  
**Baseline commit reviewed:** `f12d0c71345ea82ffe9176cc6b945bba87adb2e9`  
**Original audit baseline:** `8b76aaf300d9a0dfb8dea2822e5dc2a1083d47dd`  
**Review date:** 2026-10-22

## Executive summary

The original audit described an older revision. The quality-gates and packaging work was subsequently merged in commit `f12d0c71345ea82ffe9176cc6b945bba87adb2e9`. The current repository contains Node.js structural tests, Python packaging tests, a CI workflow, and an allowlisted ZIP packager. The baseline workflow run [39735774987](https://github.com/tejaswin-amara/klu-erp-autofill/actions/runs/39735774987) completed successfully.

A passing repository-quality workflow does **not** prove runtime recognition correctness, model compatibility, browser compatibility, or legal provenance. The core `content.js` behavior has not been fully remediated by the quality-gates commit.

## Scope and evidence

The review inspected the current manifest, content script, model metadata, repository tests, packaging utility, CI workflow, documentation, and third-party notices. Findings below are classified according to direct source evidence; questions requiring the original training specification or real Chromium behavior remain explicitly unresolved.

## Finding disposition

| ID | Status | Evidence / disposition |
| --- | --- | --- |
| AUDIT-001 — asynchronous lifecycle and stale results | **Open; source issue confirmed** | Current `content.js` exits when `isSolving` is true and does not fully associate the inference result with a still-current image source before writing the field. No runtime fix is included in the quality-gates commit. |
| AUDIT-002 — selector priority | **Open; source issue confirmed** | The combined comma-separated selector is passed to `querySelector`; selector-list ordering does not guarantee priority over document order. |
| AUDIT-003 — metadata and output contract | **Open; partially confirmed** | Metadata response status and runtime schema are not comprehensively validated, `blank_idx` is not used by the current decoder, and output dimensions are assumed. The existing structural test validates metadata shape but does not prove the runtime honors it. |
| AUDIT-004 — no tests or CI | **Fixed at baseline** | `tests/repository.test.mjs`, `tests/test_package_extension.py`, `package.json`, and `.github/workflows/ci.yml` are present. The baseline CI run passed the Node test, Python package test, ZIP build, and artifact upload steps. |
| AUDIT-005 — release archive contents | **Fixed at baseline** | `scripts/package_extension.py` uses an explicit 20-file allowlist. It includes project and third-party notices, embeds `CHECKSUMS.sha256`, and writes a SHA-256 sidecar for the ZIP. The package tests verify required files, manifest references, embedded checksums, and the sidecar. |
| AUDIT-006 — documentation drift and broken links | **Partially fixed; follow-up validation added** | README privacy statements and third-party notices were updated in the quality-gates commit. Changelog version drift and stable fragment targets needed additional attention; repository tests now check relative Markdown links. |
| AUDIT-007 — alpha-channel preprocessing | **Unresolved; defect classification requires model evidence** | The current script reads the alpha component. Whether this contradicts the trained model's preprocessing contract cannot be established without the actual training/inference specification. Do not infer a correct replacement channel or reject valid images based on an unverified heuristic. |
| AUDIT-008 — SIMD browser compatibility | **Unverified** | The manifest has no explicit minimum Chrome version. The bundled runtime version and minimum supported browser have not been independently established through a compatibility test. Do not add runtime flags without verifying the bundled API. |
| AUDIT-009 — third-party licenses and provenance | **Partially fixed** | The third-party notice contains the ONNX Runtime MIT license text and explicitly marks the exact bundled version and model provenance as unverified. Icon/font attribution and model training-data provenance still require source evidence. |
| AUDIT-010 — listeners and observer timer cleanup | **Open; source lifecycle concern** | The current observer/listener lifecycle does not comprehensively remove old image listeners or clear the body-observer timeout on every early disconnect path. |
| AUDIT-011 — dynamic web-accessible URLs | **Optional; unverified** | `use_dynamic_url` is not configured. It should not be introduced without a Chromium test proving the ONNX model and WASM resource paths still resolve. |
| HIST-001 — historical paths and CRX ID | **Informational** | Historical repository data may contain local build paths and an extension identifier. No active credential exposure was established by this source review; an extension ID is not itself an authentication secret. |

## Release packaging

The current allowlist comprises the manifest, content script, model metadata and binary, ONNX Runtime JavaScript and SIMD WASM assets, three icons, README, Apache-2.0 license, NOTICE, third-party notices, security/support/contribution/community documents, changelog, privacy notes, and README banner. The archive also contains the generated checksum manifest.

The post-merge CI artifact is named `klu-erp-autofill-extension`; its GitHub artifact ID is `12426453480` and it was created on 2026-10-22. [Download/open the artifact through its workflow run](https://github.com/tejaswin-amara/klu-erp-autofill/actions/runs/39781458278). GitHub Actions artifacts expire, so publish a formal GitHub Release if a stable distribution link is required.

## Test limits

The baseline suite contained eight Node.js structural tests and four Python packaging tests. The follow-up added checks for relative Markdown links, unsuppressed CI failures, exact release archive contents, and byte-for-byte deterministic ZIP output. The post-merge CI run [39781458278](https://github.com/tejaswin-amara/klu-erp-autofill/actions/runs/39781458278) passed all 10 Node.js tests and all 5 Python packaging tests, built the release ZIP, and uploaded the artifact. The build log reported the inner release ZIP SHA-256 as `613ce03f907c6c0e5db64c31baff1db3a423f2d39eaa476718bbce5470653996`.

No accuracy or model-quality claim is made by this audit.

## Responsible-use boundary

This repository targets a production university ERP and automates a CAPTCHA field. This follow-up improves repository quality, documentation, test integrity, and artifact reproducibility; it does not tune or harden production CAPTCHA solving. Any future behavioral evaluation must use synthetic fixtures or an expressly authorized non-production test harness, preserve human verification, and retain manual form submission.

## Remaining review requirements

1. Establish the model's original source, training dataset, license, and preprocessing contract from reliable provenance records.
2. Determine the bundled ONNX Runtime version from upstream release metadata.
3. Verify the icon/font source and applicable notice requirements.
4. Perform browser compatibility checks in a controlled environment before changing SIMD or dynamic-resource settings.
5. Review and prioritize open core-script findings using an authorized, non-production test setup.
