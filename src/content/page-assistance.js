(function attachPageAssistance(root) {
  'use strict';

  const STATUS = Object.freeze({
    ASSISTANCE_AVAILABLE: 'ASSISTANCE_AVAILABLE',
    CAPTCHA_IMAGE_UNAVAILABLE: 'CAPTCHA_IMAGE_UNAVAILABLE',
    ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
    UNSUPPORTED_PAGE: 'UNSUPPORTED_PAGE',
    USER_ACTION_COMPLETED: 'USER_ACTION_COMPLETED',
    RECOVERABLE_ERROR: 'RECOVERABLE_ERROR'
  });

  const IMAGE_SELECTORS = [
    'img#loginFormCaptcha-image',
    'img#loginform-verifycode-image',
    'img[data-erp-captcha]',
    'img[id*="captcha" i]',
    'img[name*="captcha" i]',
    'img[src*="captcha" i]',
    'img[alt*="captcha" i]',
    'img[class*="captcha" i]'
  ];
  const INPUT_SELECTORS = [
    'input#loginFormCaptcha:not([type="password"]):not([type="hidden"])',
    'input[name="LoginForm[captcha]"]:not([type="password"]):not([type="hidden"])',
    'input#loginform-verifycode:not([type="password"]):not([type="hidden"])',
    'input[data-erp-captcha-input]:not([type="password"]):not([type="hidden"])',
    'input[id*="captcha" i]:not([type="password"]):not([type="hidden"])',
    'input[name*="captcha" i]:not([type="password"]):not([type="hidden"])',
    'input[placeholder*="verification" i]:not([type="password"]):not([type="hidden"])'
  ];
  const REFRESH_SELECTORS = [
    '[data-erp-captcha-refresh]',
    '#reloadCaptcha',
    '#refreshCaptcha',
    '.captcha-refresh',
    'button[id*="captcha" i][id*="refresh" i]',
    'a[id*="captcha" i][id*="refresh" i]',
    'button[aria-label*="captcha" i][aria-label*="refresh" i]',
    'button[title*="captcha" i][title*="refresh" i]'
  ];

  function allowedPage(doc) {
    try {
      const expected = root.KluErpExtensionConfig?.supportedOrigin;
      const current = new URL(doc.location.href);
      return Boolean(expected && current.protocol === 'https:' && current.origin === expected && !current.username && !current.password);
    } catch { return false; }
  }

  function isVisible(element) {
    if (!element || element.hasAttribute?.('hidden') || element.getAttribute?.('aria-hidden') === 'true') return false;
    const view = element.ownerDocument?.defaultView;
    if (view && typeof view.getComputedStyle === 'function') {
      try {
        const style = view.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      } catch { /* If style inspection is unavailable, rely on the visible DOM element. */ }
    }
    return true;
  }

  function findFirstVisible(doc, selectors) {
    if (!doc || typeof doc.querySelector !== 'function') return null;
    for (const selector of selectors) {
      let candidate = null;
      try { candidate = doc.querySelector(selector); } catch { /* Invalid/missing selector in a test or unusual DOM. */ }
      if (isVisible(candidate)) return candidate;
    }
    return null;
  }

  function findCaptchaImage(doc) { return findFirstVisible(doc, IMAGE_SELECTORS); }
  function findCaptchaInput(doc) { return findFirstVisible(doc, INPUT_SELECTORS); }
  function findRefreshControl(doc) { return findFirstVisible(doc, REFRESH_SELECTORS); }

  function renderImageDataUrl(doc, image) {
    if (!image || !image.complete || !(image.naturalWidth > 0) || !(image.naturalHeight > 0)) return null;
    if (image.naturalWidth > 2000 || image.naturalHeight > 1000) return null;
    try {
      const canvas = doc.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      // Keep runtime messages bounded. If a site returns an unusually large image, fail safely.
      return typeof dataUrl === 'string' && dataUrl.length <= 2_000_000 ? dataUrl : null;
    } catch {
      // A cross-origin image may taint the canvas. Never work around browser origin protections.
      return null;
    }
  }

  function inspectPage(doc = root.document) {
    if (!allowedPage(doc)) {
      return { state: STATUS.UNSUPPORTED_PAGE, message: 'This helper is limited to the configured KLU ERP HTTPS origin.', hasCaptchaImage: false, imageDataUrl: null, hasCaptchaInput: false, hasRefreshControl: false };
    }
    const image = findCaptchaImage(doc);
    const input = findCaptchaInput(doc);
    const refresh = findRefreshControl(doc);
    if (!image && !input) {
      return { state: STATUS.ELEMENT_NOT_FOUND, message: 'No CAPTCHA challenge was detected. If this page includes one, use the ERP page’s normal controls.', hasCaptchaImage: false, imageDataUrl: null, hasCaptchaInput: false, hasRefreshControl: Boolean(refresh) };
    }
    if (!image || !image.complete || !(image.naturalWidth > 0) || !(image.naturalHeight > 0)) {
      return { state: STATUS.CAPTCHA_IMAGE_UNAVAILABLE, message: 'The CAPTCHA image is missing or has not finished loading. Use the ERP page’s normal refresh control.', hasCaptchaImage: Boolean(image), imageDataUrl: null, hasCaptchaInput: Boolean(input), hasRefreshControl: Boolean(refresh) };
    }
    const imageDataUrl = renderImageDataUrl(doc, image);
    if (!imageDataUrl) {
      return { state: STATUS.CAPTCHA_IMAGE_UNAVAILABLE, message: 'The image cannot be copied safely for magnification (it may be cross-origin). Inspect it directly on the ERP page.', hasCaptchaImage: true, imageDataUrl: null, hasCaptchaInput: Boolean(input), hasRefreshControl: Boolean(refresh) };
    }
    return { state: STATUS.ASSISTANCE_AVAILABLE, message: 'Magnification is ready. Read the image yourself and type the answer manually.', hasCaptchaImage: true, imageDataUrl, hasCaptchaInput: Boolean(input), hasRefreshControl: Boolean(refresh) };
  }

  function focusCaptchaInput(doc = root.document) {
    if (!allowedPage(doc)) return { ok: false, state: STATUS.UNSUPPORTED_PAGE, message: 'The active page is not supported.' };
    const input = findCaptchaInput(doc);
    if (!input) return { ok: false, state: STATUS.ELEMENT_NOT_FOUND, message: 'The CAPTCHA input field was not found.' };
    try { input.scrollIntoView?.({ block: 'center', behavior: 'auto' }); } catch { /* Focus still may work. */ }
    try { input.focus(); } catch { return { ok: false, state: STATUS.RECOVERABLE_ERROR, message: 'The CAPTCHA input could not receive focus.' }; }
    return { ok: true, state: STATUS.USER_ACTION_COMPLETED, message: 'Focus moved to the CAPTCHA input. Enter the answer manually.' };
  }

  function triggerCaptchaRefresh(doc = root.document, now = Date.now(), lastRefresh = 0) {
    if (!allowedPage(doc)) return { ok: false, state: STATUS.UNSUPPORTED_PAGE, message: 'The active page is not supported.' };
    if (now - lastRefresh < 1000) return { ok: false, state: STATUS.RECOVERABLE_ERROR, message: 'Wait a moment before requesting another refresh.' };
    const control = findRefreshControl(doc);
    if (!control || typeof control.click !== 'function') return { ok: false, state: STATUS.ELEMENT_NOT_FOUND, message: 'No recognizable CAPTCHA refresh control was found. Use the ERP page’s own controls.' };
    control.click();
    return { ok: true, state: STATUS.USER_ACTION_COMPLETED, message: 'Clicked the visible CAPTCHA refresh control at your request.', lastRefresh: now };
  }

  root.KluErpPageAssistance = Object.freeze({
    STATUS,
    IMAGE_SELECTORS,
    INPUT_SELECTORS,
    REFRESH_SELECTORS,
    allowedPage,
    isVisible,
    findCaptchaImage,
    findCaptchaInput,
    findRefreshControl,
    renderImageDataUrl,
    inspectPage,
    focusCaptchaInput,
    triggerCaptchaRefresh
  });
})(globalThis);
