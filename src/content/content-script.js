(function startKluErpContentScript(root) {
  'use strict';
  if (root.__KLU_ERP_MANUAL_ASSISTANT__) return;
  const api = root.KluErpPageAssistance;
  const config = root.KluErpExtensionConfig;
  if (!api || !config || !root.chrome?.runtime?.id || !root.document) return;
  if (!api.allowedPage(root.document)) return;

  const TYPES = Object.freeze({
    GET_PAGE_STATUS: 'GET_PAGE_STATUS',
    FOCUS_CAPTCHA_INPUT: 'FOCUS_CAPTCHA_INPUT',
    TRIGGER_CAPTCHA_REFRESH: 'TRIGGER_CAPTCHA_REFRESH'
  });
  let lastRefreshTimestamp = 0;
  let destroyed = false;

  function validateMessage(message) {
    if (!message || typeof message !== 'object' || Array.isArray(message) || Object.getPrototypeOf(message) !== Object.prototype) return false;
    const schema = {
      [TYPES.GET_PAGE_STATUS]: ['type'],
      [TYPES.FOCUS_CAPTCHA_INPUT]: ['type'],
      [TYPES.TRIGGER_CAPTCHA_REFRESH]: ['type']
    }[message.type];
    if (!schema || Object.keys(message).some((key) => !schema.includes(key))) return false;
    return true;
  }

  function onMessage(message, sender, sendResponse) {
    if (destroyed) return false;
    if (sender?.id !== root.chrome.runtime.id) {
      sendResponse({ ok: false, error: 'Untrusted sender rejected.' });
      return false;
    }
    if (!validateMessage(message)) {
      sendResponse({ ok: false, error: 'Invalid or unsupported message.' });
      return false;
    }
    if (!api.allowedPage(root.document)) {
      sendResponse({ ok: false, state: api.STATUS.UNSUPPORTED_PAGE, message: 'The active page is not supported.' });
      return false;
    }

    switch (message.type) {
      case TYPES.GET_PAGE_STATUS:
        sendResponse({ ok: true, ...api.inspectPage(root.document) });
        break;
      case TYPES.FOCUS_CAPTCHA_INPUT:
        sendResponse(api.focusCaptchaInput(root.document));
        break;
      case TYPES.TRIGGER_CAPTCHA_REFRESH: {
        const result = api.triggerCaptchaRefresh(root.document, Date.now(), lastRefreshTimestamp);
        if (result.ok) lastRefreshTimestamp = result.lastRefresh;
        sendResponse(result);
        break;
      }
      default:
        sendResponse({ ok: false, error: 'Unsupported message type.' });
    }
    return false;
  }

  const listener = (message, sender, sendResponse) => onMessage(message, sender, sendResponse);
  root.chrome.runtime.onMessage.addListener(listener);
  root.addEventListener?.('pagehide', () => {
    destroyed = true;
    root.chrome.runtime.onMessage.removeListener?.(listener);
    delete root.__KLU_ERP_MANUAL_ASSISTANT__;
  }, { once: true });

  root.__KLU_ERP_MANUAL_ASSISTANT__ = Object.freeze({
    destroy() {
      destroyed = true;
      root.chrome.runtime.onMessage.removeListener?.(listener);
      delete root.__KLU_ERP_MANUAL_ASSISTANT__;
    }
  });
})(globalThis);
