/* KLU ERP Captcha Auto-Fill — content script
 *
 * Strategy:
 *   1. On page load, find the captcha <img> and the captcha <input> field.
 *   2. Wait until the captcha image has loaded.
 *   3. Convert it to a 120x50 grayscale (alpha-channel) tensor.
 *   4. Run the CRNN ONNX model in-browser via onnxruntime-web.
 *   5. CTC-decode the output to a string and write it into the input field.
 *
 * Privacy: 100% on-device. No network calls. No data collected.
 */
(async () => {
  if (window.__kluCaptchaSolverLoaded) return;
  window.__kluCaptchaSolverLoaded = true;

  const log = (...a) => console.debug("[KLU-Captcha]", ...a);

  // Configure onnxruntime-web to find its WASM files in the extension package.
  ort.env.wasm.wasmPaths = chrome.runtime.getURL("lib/");
  ort.env.wasm.numThreads = 1;

  const META_URL = chrome.runtime.getURL("model/crnn.json");
  const MODEL_URL = chrome.runtime.getURL("model/crnn.onnx");

  let session = null;
  let meta = null;

  async function loadModel() {
    if (session) return session;
    meta = await (await fetch(META_URL)).json();
    log("loading model", MODEL_URL);
    session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
    });
    log("model loaded; alphabet =", meta.alphabet);
    return session;
  }

  function findCaptchaImg() {
    // KLU's actual form uses id="loginFormCaptcha-image" (verified from HTML)
    return (
      document.querySelector("img#loginFormCaptcha-image") ||
      document.querySelector("img#loginform-verifycode-image") ||
      document.querySelector('img[src*="r=site/captcha"]') ||
      document.querySelector('img[src*="captcha"]')
    );
  }

  function findCaptchaInput() {
    // KLU's actual form uses id="loginFormCaptcha" name="LoginForm[captcha]"
    return (
      document.querySelector('input#loginFormCaptcha') ||
      document.querySelector('input[name="LoginForm[captcha]"]') ||
      document.querySelector('input#loginform-verifycode') ||
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
    // The captcha PNG has transparent background — we want the alpha channel as the input.
    // Drawing onto a canvas without filling background preserves alpha.
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data; // RGBA, length = W*H*4
    const arr = new Float32Array(W * H);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      arr[j] = data[i + 3] / 255.0; // alpha channel
    }
    return new ort.Tensor("float32", arr, [1, 1, H, W]);
  }

  function ctcGreedyDecode(logits, T, C) {
    // logits: Float32Array shape (T*C). Per-timestep argmax, then collapse repeats and drop blank=0.
    const out = [];
    let last = -1;
    for (let t = 0; t < T; t++) {
      let best = 0, bestVal = -Infinity;
      for (let c = 0; c < C; c++) {
        const v = logits[t * C + c];
        if (v > bestVal) { bestVal = v; best = c; }
      }
      if (best !== last && best !== 0) {
        // Character index in alphabet is best - 1 (because 0 is the CTC blank)
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
    const logits = out.logits.data; // Float32Array, shape [1, T, C] (CTC over time)
    const dims = out.logits.dims;
    const [, T, C] = dims;
    const code = ctcGreedyDecode(logits, T, C);
    log(`solved in ${dt}ms → ${code}`);
    return code;
  }

  function setNativeValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value); else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function trySolve() {
    const img = findCaptchaImg();
    const input = findCaptchaInput();
    if (!img || !input) return false;
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
    // Wait for elements to appear (login form may render after JS init)
    let attempts = 0;
    while (attempts++ < 30) {
      if (await trySolve()) return;
      await new Promise((r) => setTimeout(r, 200));
    }
    log("gave up — could not find captcha");
  }

  // Also re-solve when the captcha image is refreshed (clicked or reloaded by Yii)
  const observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "attributes" && m.attributeName === "src") {
        log("captcha src changed — re-solving");
        setTimeout(trySolve, 300); // small delay for image load
      }
    }
  });
  setTimeout(() => {
    const img = findCaptchaImg();
    if (img) observer.observe(img, { attributes: true });
  }, 1500);

  main();
})();
