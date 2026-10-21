<div align="center">KLU ERP Auto-Fill

A local-first Chrome extension for the KL University ERP login page.

Automatically recognize and fill the CAPTCHA verification field using a bundled CRNN model powered by ONNX Runtime Web and WebAssembly.

""Chrome Extension" (https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)" (https://developer.chrome.com/docs/extensions/)
""Manifest V3" (https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge&logo=googlechrome&logoColor=white)" (https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
""JavaScript" (https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111111)" (https://developer.mozilla.org/en-US/docs/Web/JavaScript)
""ONNX Runtime" (https://img.shields.io/badge/Inference-ONNX_Runtime-7B61FF?style=for-the-badge)" (https://onnxruntime.ai/docs/tutorials/web/)

"View Repository" (https://github.com/tejaswin-amara/klu-erp-autofill) · "Open KLU ERP" (https://newerp.kluniversity.in/)

</div>---

Overview

KLU ERP Auto-Fill is a lightweight Chrome extension designed to reduce repetitive manual CAPTCHA entry on the KL University ERP login page.

It uses a locally bundled CRNN (Convolutional Recurrent Neural Network) text-recognition model to process the CAPTCHA image in the browser, infer the character sequence, and populate the matching verification field.

Unlike implementations that depend on a separate cloud OCR service, this extension uses ONNX Runtime Web with WebAssembly (WASM) for model inference directly in the browser.

The extension targets the KLU ERP website specifically and uses Chrome's Manifest V3 architecture.

Features

Feature| Description
Automatic field filling| Detects the CAPTCHA image and corresponding input field and fills the recognized text.
Local model inference| Runs the bundled ONNX model through ONNX Runtime Web and WebAssembly.
CAPTCHA refresh detection| Observes changes to the CAPTCHA image's "src" attribute and attempts recognition again.
No extension popup required| Runs through a content script on the configured ERP website.
Focused website scope| The manifest restricts content-script injection to the specified KLU ERP domain.
Native input events| Dispatches "input" and "change" events after setting the verification field.
Bundled runtime assets| Includes the model and inference runtime files needed for local execution.

«Note: The extension fills the verification field. It does not automatically submit the login form, authenticate an account, or guarantee successful CAPTCHA recognition.»

How It Works

flowchart TD
    A["KLU ERP Login Page"] --> B["Detect CAPTCHA Image and Input"]
    B --> C["Load Bundled CRNN Model"]
    C --> D["Convert Image to Input Tensor"]
    D --> E["ONNX Runtime Web"]
    E --> F["WebAssembly Inference"]
    F --> G["CTC Greedy Decoding"]
    G --> H["Populate Verification Field"]
    H --> I["Dispatch Input and Change Events"]
    J["CAPTCHA Image Refresh"] --> K["MutationObserver"]
    K --> B

Processing Pipeline

1. Page detection: The content script looks for supported CAPTCHA image and verification-input selectors.
2. Model initialization: The extension loads the model metadata and initializes an ONNX Runtime inference session.
3. Image preprocessing: The CAPTCHA image is drawn onto a canvas and converted into the tensor format expected by the model.
4. Inference: The CRNN model processes the tensor using the WebAssembly execution provider.
5. Text decoding: The output logits are decoded into a character sequence using greedy CTC-style decoding.
6. Field population: The recognized text is assigned to the verification input, followed by native "input" and "change" events.
7. Refresh handling: A "MutationObserver" watches for changes to the CAPTCHA image's source and triggers another recognition attempt.

The implementation also limits its initial search attempts to avoid retrying indefinitely when the expected page elements cannot be found.

Technology Stack

Component| Technology| Purpose
Extension platform| Chrome Manifest V3| Defines the extension and its execution scope.
Core implementation| JavaScript| Handles page detection, inference orchestration, and input updates.
Machine learning model| CRNN, ONNX format| Recognizes CAPTCHA character sequences.
Inference runtime| ONNX Runtime Web| Executes the model within the browser.
Compute backend| WebAssembly (WASM)| Provides local inference execution.
Output decoding| CTC greedy decoding| Converts model logits into a character sequence.
Page observation| MutationObserver| Detects CAPTCHA image-source changes.

Project Structure

klu-erp-autofill/
├── manifest.json
├── content.js
├── model/
│   ├── crnn.onnx
│   └── crnn.json
├── lib/
│   ├── ort.min.js
│   ├── ort-wasm-simd.wasm
│   └── ort-wasm.wasm
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

Path| Description
"manifest.json"| Extension metadata, content-script configuration, and resource declarations.
"content.js"| CAPTCHA detection, model inference, decoding, and input filling.
"model/crnn.onnx"| Bundled CRNN recognition model.
"model/crnn.json"| Model metadata, including input dimensions and recognition alphabet.
"lib/ort.min.js"| ONNX Runtime Web JavaScript runtime.
"lib/ort-wasm-simd.wasm"| SIMD-enabled WebAssembly runtime asset.
"lib/ort-wasm.wasm"| Standard WebAssembly runtime asset.
"icons/"| Chrome extension icons in supported sizes.

Installation

Load the extension locally using Chrome's Developer Mode.

1. Download the Repository

Clone the repository:

git clone https://github.com/tejaswin-amara/klu-erp-autofill.git
cd klu-erp-autofill

Alternatively, select Code → Download ZIP on GitHub and extract the archive.

2. Open Chrome Extensions

Navigate to:

chrome://extensions

Enable Developer mode using the toggle in the upper-right corner.

3. Load the Extension

1. Click Load unpacked.
2. Select the "klu-erp-autofill" directory containing "manifest.json".
3. Verify that the extension appears in the extensions list without an error.

Keep the project directory intact. The model, runtime, WebAssembly files, and icons are referenced using paths within the extension.

4. Test on the ERP Page

Open the official "KL University ERP login page" (https://newerp.kluniversity.in/).

With the extension enabled, reload the page and check whether the verification field is populated.

Use the login system only in accordance with your institution's rules and authorization requirements.

Configuration and Compatibility

The extension is designed specifically for the configured ERP website rather than as a general-purpose CAPTCHA reader.

Configuration| Current implementation
Target website| "https://newerp.kluniversity.in/*"
Extension format| Chrome Manifest V3
Model file| "model/crnn.onnx"
Model metadata| "model/crnn.json"
Input dimensions| "120 × 50", as specified in the metadata
Runtime| ONNX Runtime Web
Execution provider| WebAssembly
CAPTCHA refresh handling| Watches the image's "src" attribute

The model metadata defines the recognition alphabet and CTC blank index. Changes to the ERP page's DOM, CAPTCHA format, or model assets may require corresponding changes to the extension.

Privacy and Security

The extension uses bundled model and runtime assets for its recognition pipeline. Its declared content-script scope is limited to the configured KLU ERP hostname and does not require a separate remote OCR backend.

Important considerations:

- Local inference: CAPTCHA recognition runs in the browser using the bundled ONNX model and WebAssembly runtime.
- Website communication: Loading and using the ERP website still involves the website's own network communication. Local model inference does not make the entire login process offline.
- Console output: The current content script writes debug messages to the browser console, including the recognized CAPTCHA text. Avoid sharing unredacted console logs or screenshots containing verification codes.
- Credentials: The extension's purpose is verification-field filling, not password collection or credential management. Review the source code before installing or distributing a modified build.
- Permissions and scope: Review "manifest.json" before changing the URLs on which the content script can execute.

For production distribution, consider removing sensitive recognition output from debug logs and reviewing the extension's behavior and permissions before publishing a release.

Troubleshooting

<details>
<summary><strong>The verification field is not populated</strong></summary>- Confirm that you are on "https://newerp.kluniversity.in/".
- Make sure the extension is enabled.
- Reload the ERP tab after enabling or reloading the extension.
- Check that the model and runtime assets exist in their expected directories.
- Open Chrome DevTools and inspect the Console for messages beginning with "[KLU-Captcha]".
- Confirm that the ERP page's CAPTCHA image and input selectors still match those used in "content.js".

</details><details>
<summary><strong>The extension reports a model or WASM loading error</strong></summary>- Verify that "model/crnn.onnx" and "model/crnn.json" exist.
- Verify that the files under "lib/" have not been renamed or removed.
- Recheck the resource paths declared in "manifest.json".
- Use an up-to-date Chrome or Chromium-based browser and inspect the reported console error.

</details><details>
<summary><strong>The field is filled with incorrect text</strong></summary>Recognition accuracy is not guaranteed. The result depends on the CAPTCHA image, the model's capabilities, and compatibility between the page image and model preprocessing.

Verify the text before submitting the form. If recognition fails, use the site's normal verification process.

</details><details>
<summary><strong>Changes to the source are not taking effect</strong></summary>1. Save your changes.
2. Open "chrome://extensions".
3. Reload the extension.
4. Reload the ERP tab.

Chrome may continue using the previously loaded version until both the extension and the affected page are refreshed.

</details>Development

To make changes locally:

1. Clone the repository.
2. Inspect "manifest.json" for extension configuration and target URL scope.
3. Inspect "content.js" for CAPTCHA detection, preprocessing, inference, decoding, and field updates.
4. Keep the model metadata consistent with the model's expected input and output.
5. Reload the extension and ERP tab after source changes.
6. Test model loading, missing-element behavior, recognition failures, and CAPTCHA refresh handling.

This repository is a browser extension rather than a conventional Node.js application. A package manager or build command should not be assumed unless one is added to the project.

Responsible Use

This project is intended for authorized, policy-compliant use on the configured university ERP website.

CAPTCHA challenges are security and anti-automation controls. Use automation only when permitted by the institution and the website's applicable policies. Do not use this project to evade access restrictions, automate unauthorized account access, or interfere with university systems.

Contributing

Contributions are welcome when they improve reliability, maintainability, and transparency.

Potential areas for improvement include:

- More robust detection of supported page elements.
- Clearer error handling and diagnostics.
- Removal of sensitive information from debug output.
- Better compatibility checks for the inference model and input format.
- Documentation improvements and reproducible testing instructions.

Keep changes focused, test them against the intended environment, and document any new dependencies or permissions.

Author

Tejaswin Amara

- GitHub: "@tejaswin-amara" (https://github.com/tejaswin-amara)
- Repository: "klu-erp-autofill" (https://github.com/tejaswin-amara/klu-erp-autofill)

License

No "LICENSE" file was found in the repository when this README was prepared. Unless a license is added, do not assume that the code or bundled model can be redistributed under an open-source license.

---

<div align="center">Built with JavaScript, ONNX Runtime Web, and WebAssembly.

"Back to Top" (#klu-erp-auto-fill)

</div>