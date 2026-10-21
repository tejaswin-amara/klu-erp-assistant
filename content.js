/* KLU ERP Captcha Auto-Fill — content script
 * 100% on-device CRNN ONNX inference via onnxruntime-web.
 */
(async () => {
  if (window.__kluCaptchaSolverLoaded) return;
  window.__kluCaptchaSolverLoaded = true;

  const log = (...a) => console.debug("[KLU-Captcha]", ...a);

  ort.env.wasm.wasmPaths = chrome.runtime.getURL("lib/");
  ort.env.wasm.numThreads = 1;

  const META_URL = chrome.runtime.getURL("model/crnn.json");
  const MODEL_URL = chrome.runtime.getURL("model/crnn.onnx");

  let session = null;
  let meta = null;
  let loadingPromise = null;
  let observedImg = null;

  async function loadModel() {
    if (session) return session;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      meta = await (await fetch(META_URL)).json();
      log("loading model", MODEL_URL);
      session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ["wasm"],
      });
      log("model loaded; alphabet =", meta.alphabet);
      return session;
    })();

    try {
      return await loadingPromise;
    } catch (err) {
      loadingPromise = null;
      throw err;
    }
  }

  function findCaptchaImg() {
    return (
      document.querySelector("img#loginFormCaptcha-image") ||
      document.querySelector("img#loginform-verifycode-image") ||
      document.querySelector('img[src*="r=site/captcha"]') ||
      document.querySelector('img[src*="captcha"]')
    );
  }

  function findCaptchaInput() {
    return (
      document.querySelector("input#loginFormCaptcha") ||
      document.querySelector('input[name="LoginForm[captcha]"]') ||
      document.querySelector("input#loginform-verifycode") ||
      document.querySelector('input[name*="captcha" i]') ||
      document.querySelector('input[placeholder*="verification" i]')
    );
  }

  function imageToTensor(img) {
    const W = meta.img_w, H = meta.img_h;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    const arr = new Float32Array(W * H);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      arr[j] = data[i + 3] / 255.0;
    }
    return new ort.Tensor("float32", arr, [1, 1, H, W]);
  }

  function ctcGreedyDecode(logits, T, C) {
    const out = [];
    let last = -1;
    for (let t = 0; t < T; t++) {
      let best = 0, bestVal = -Infinity;
      for (let c = 0; c < C; c++) {
        const v = logits[t * C + c];
        if (v > bestVal) { bestVal = v; best = c; }
      }
      if (best !== last && best !== 0) {
        out.push(meta.alphabet[best - 1]);
      }
      last = best;
    }
    return out.join("");
  }

  async function solveOnce(img) {
    if (!img.complete || img.naturalWidth === 0) {
      await new Promise((r) => img.addEventListener("load", r, { once: true }));
    }
    const sess = await loadModel();
    const input = imageToTensor(img);
    const t0 = performance.now();
    const out = await sess.run({ input });
    const dt = (performance.now() - t0).toFixed(1);
    const logits = out.logits.data;
    const [, T, C] = out.logits.dims;
    const code = ctcGreedyDecode(logits, T, C);
    log("solved in " + dt + "ms -> " + code);
    return code;
  }

  function setNativeValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "attributes" && m.attributeName === "src") {
        log("captcha src changed — re-solving");
        setTimeout(trySolve, 250);
      }
    }
  });

  function ensureObserver(img) {
    if (img && img !== observedImg) {
      observedImg = img;
      observer.observe(img, { attributes: true });
    }
  }

  async function trySolve() {
    const img = findCaptchaImg();
    const input = findCaptchaInput();
    if (!img || !input) return false;
    ensureObserver(img);
    try {
      const code = await solveOnce(img);
      if (code && code.length >= 4) {
        setNativeValue(input, code);
        return true;
      }
    } catch (e) {
      console.error("[KLU-Captcha] solve failed:", e);
    }
    return false;
  }

  async function main() {
    let attempts = 0;
    while (attempts++ < 40) {
      if (await trySolve()) return;
      await new Promise((r) => setTimeout(r, 200));
    }
    log("gave up — could not find captcha");
  }

  main();
})();