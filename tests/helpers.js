export function makeElement({ type = 'text', width = 120, height = 50, loaded = true } = {}) {
  const attributes = new Map();
  const element = {
    complete: loaded,
    naturalWidth: width,
    naturalHeight: height,
    focused: false,
    clickCount: 0,
    scrolled: false,
    ownerDocument: null,
    hasAttribute(name) { return attributes.has(name); },
    getAttribute(name) {
      if (name === 'type') return type;
      return attributes.has(name) ? attributes.get(name) : null;
    },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    scrollIntoView() { this.scrolled = true; },
    focus() { this.focused = true; },
    click() { this.clickCount += 1; }
  };
  return element;
}

export function makeDocument({ url = 'https://newerp.kluniversity.in/login', image = makeElement(), input = makeElement(), refresh = makeElement() } = {}) {
  image.complete ??= true;
  image.naturalWidth ??= 120;
  image.naturalHeight ??= 50;
  const map = new Map([
    ['img#loginFormCaptcha-image', image],
    ['input#loginFormCaptcha:not([type="password"]):not([type="hidden"])', input],
    ['[data-erp-captcha-refresh]', refresh]
  ]);
  const doc = {
    location: { href: url },
    defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' }) },
    querySelector(selector) { return map.get(selector) ?? null; },
    createElement(name) {
      if (name !== 'canvas') throw new Error(`Unexpected element creation: ${name}`);
      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage() {} }),
        toDataURL: () => 'data:image/png;base64,dGVzdA=='
      };
    }
  };
  for (const item of [image, input, refresh]) item.ownerDocument = doc;
  return { document: doc, image, input, refresh };
}
