# Privacy Notes

## Purpose

KLU ERP Auto-Fill is a browser extension intended to recognize CAPTCHA text on the KL University ERP login page at `https://newerp.kluniversity.in/`.

## Processing and data handling

The repository bundles a CRNN ONNX model and ONNX Runtime Web assets for browser-side inference. The extension's intended recognition path processes the CAPTCHA in the browser rather than uploading it to a project-operated recognition server.

The content script includes debug logging. Depending on the code path, console messages may include model-loading information and the recognized alphabet or CAPTCHA text. Browser console output is local to the browser unless the user or another installed tool exports or transmits it. Avoid sharing unredacted logs.

This document describes the repository implementation, not the university portal's own data practices or the behavior of other extensions, browser software, or third-party components.

## Credentials and form submission

- Do not enter credentials anywhere other than the official ERP site.
- The extension is not intended to collect or transmit usernames, passwords, session cookies, or student records.
- Recognition may be wrong; verify the result.
- The extension does not guarantee successful authentication or portal access.
- Review the current source and permissions before installing an updated build.

## Network and permissions

The extension is configured for the ERP host and loads its model/runtime assets from the packaged extension. The browser necessarily communicates with the ERP site as part of normal portal use. Do not interpret this as a claim that the portal itself makes no network requests or collects no data.

Any future change that introduces telemetry, remote processing, new host permissions, or transmission of CAPTCHA content or recognized text should include a privacy review and clear documentation before release.

## How to inspect

Review `manifest.json` for host matches and exposed resources, and `content.js` for the recognition flow and console logging. Browser developer tools can help inspect extension errors and network behavior.

## Scope and limitations

This is a project privacy note, not a formal privacy guarantee or legal advice. It does not replace the privacy policies of KL University, Chrome, or third-party dependencies.
