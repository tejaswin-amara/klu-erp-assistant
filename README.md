<div align="center">

# 🚀 KLU ERP Captcha Auto-Fill

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chrome.google.com/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success?style=for-the-badge&logo=codeforces&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![100% On-Device](https://img.shields.io/badge/Privacy-100%25%20On%20Device-orange?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/tejaswin-amara/klu-erp-assistant)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)]()

*A lightning-fast, zero-click, on-device CAPTCHA recognition assistant built exclusively for the KL University ERP portal.*

</div>

---

## ✨ Overview

**KLU ERP Captcha Auto-Fill** is a lightweight, high-performance Google Chrome extension designed to streamline the sign-in process for KL University students. It automatically detects, processes, and fills out the verification code challenge on the [KL University ERP login page](https://newerp.kluniversity.in/) the exact millisecond the page loads.

Unlike traditional cloud-based bypass tools, this extension operates **entirely offline and locally inside your browser** using an optimized CRNN ONNX neural network model running via WebAssembly (`onnxruntime-web`).

---

## 🌟 Key Features

- **⚡ Zero-Click Automation:** No popups to open, no buttons to click—the verification box populates automatically upon page load.
- **🔄 Dynamic Refresh Handling:** Automatically re-solves and updates the code if the CAPTCHA image is refreshed or reloaded.
- **🔒 100% On-Device Processing:** Runs completely local. No external servers, no cloud OCR APIs, and no telemetry.
- **🛡️ Extreme Privacy:** Zero tracking, zero logging, and zero credential exposure. Your session tokens and data never leave your browser.
- **📦 Clean Manifest V3 Architecture:** Built to modern Chrome extension security and performance standards.

---

## 🛠️ Tech Stack

- **Core:** Vanilla JavaScript (ES Modules)
- **Engine:** ONNX Runtime Web (`onnxruntime-web` + WASM)
- **Model:** CRNN Neural Network Model (`.onnx`) tailored for text recognition
- **Extension Standard:** Google Chrome Manifest V3

---

## 📥 Installation & Setup (Developer Mode)

To run or test this extension locally in Google Chrome:

1. **Clone or Download** this repository to your local machine:
   ```bash
   git clone [https://github.com/tejaswin-amara/klu-erp-assistant.git](https://github.com/tejaswin-amara/klu-erp-assistant.git)