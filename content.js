/* KLU ERP Captcha Auto-Fill — Surgical On-Device CRNN Solver */
(() => {
  if (window.__kluCaptchaSolverLoaded) return;
  window.__kluCaptchaSolverLoaded = true;

  ort.env.wasm.wasmPaths = chrome.runtime.getURL("lib/");
  ort.env.wasm.numThreads = 1;

  const IMG_SELECTOR = 'img#loginFormCaptcha-image, img#loginform-verifycode-image, img[src*="r=site/captcha"], img[src*="captcha"]';
  const INPUT_SELECTOR = 'input#loginFormCaptcha, input[name="LoginForm[captcha]"], input#loginform-verifycode, input[name*="captcha" i], input[placeholder*="verification" i]';

  let session = null;
  let meta = null;
  let loadingPromise = null;
  let tensorBuffer = null;
  let drawCtx = null;
  let isSolving = false;
  let lastSolvedSrc = "";
  let observedImg = null;

  async function ensureModel() {
    if (session) return;
    if (!loadingPromise) {
      loadingPromise = (async () => {
        const metaRes = await fetch(chrome.runtime.getURL("model/crnn.json"));
        meta = await metaRes.json();
        const W = meta.img_w;
        const H = meta.img_h;
        tensorBuffer = new Float32Array(W * H);

        const canvas = typeof OffscreenCanvas !== "undefined"
          ? new OffscreenCanvas(W, H)
          : Object.assign(document.createElement("canvas"), { width: W, height: H });
        drawCtx = canvas.getContext("2d", { willReadFrequently: true });

        session = await ort.InferenceSession.create(
          chrome.runtime.getURL("model/crnn.onnx"),
          { executionProviders: ["wasm"] }
        );
      })().catch((err) => {
        loadingPromise = null;
        throw err;
      });
    }
    await loadingPromise;
  }

  function imageToTensor(img) {
    const W = meta.img_w;
    const H = meta.img_h;
    drawCtx.clearRect(0, 0, W, H);
    drawCtx.drawImage(img, 0, 0, W, H);
    const rgba = drawCtx.getImageData(0, 0, W, H).data;
    for (let i = 3, j = 0; i < rgba.length; i += 4, j++) {
      tensorBuffer[j] = rgba[i] * 0.00392156862745098; // 1 / 255
    }
    return new ort.Tensor("float32", tensorBuffer, [1, 1, H, W]);
  }

  function ctcGreedyDecode(logits, T, C, alphabet) {
    let result = "";
    let prev = -1;
    for (let t = 0; t < T; t++) {
      const offset = t * C;
      let bestIdx = 0;
      let bestVal = logits[offset];
      for (let c = 1; c < C; c++) {
        const val = logits[offset + c];
        if (val > bestVal) {
          bestVal = val;
          bestIdx = c;
        }
      }
      if (bestIdx !== 0 && bestIdx !== prev) {
        result += alphabet[bestIdx - 1];
      }
      prev = bestIdx;
    }
    return result;
  }

  function fillInput(el, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function solveCaptcha() {
    if (isSolving) return;
    const img = document.querySelector(IMG_SELECTOR);
    const input = document.querySelector(INPUT_SELECTOR);
    if (!img || !input) return;

    watchImage(img);

    if (!img.complete || img.naturalWidth === 0) {
      img.addEventListener("load", solveCaptcha, { once: true });
      return;
    }

    if (img.src && img.src === lastSolvedSrc && input.value.length >= 4) return;

    isSolving = true;
    try {
      await ensureModel();
      const currentSrc = img.src;
      const tensor = imageToTensor(img);
      const output = await session.run({ input: tensor });
      const [, T, C] = output.logits.dims;
      const code = ctcGreedyDecode(output.logits.data, T, C, meta.alphabet);
      if (code.length >= 4) {
        lastSolvedSrc = currentSrc;
        fillInput(input, code);
      }
    } catch (err) {
      console.error("[KLU-Captcha]", err);
    } finally {
      isSolving = false;
    }
  }

  const imgAttrObserver = new MutationObserver(() => {
    lastSolvedSrc = "";
    solveCaptcha();
  });

  function watchImage(img) {
    if (observedImg === img) return;
    observedImg = img;
    imgAttrObserver.disconnect();
    imgAttrObserver.observe(img, { attributes: true, attributeFilter: ["src"] });
    img.addEventListener("load", solveCaptcha);
  }

  if (document.querySelector(IMG_SELECTOR) && document.querySelector(INPUT_SELECTOR)) {
    solveCaptcha();
  } else {
    const bodyObserver = new MutationObserver(() => {
      if (document.querySelector(IMG_SELECTOR) && document.querySelector(INPUT_SELECTOR)) {
        bodyObserver.disconnect();
        solveCaptcha();
      }
    });
    bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => bodyObserver.disconnect(), 15000);
  }
})();
