import '../../src/content/config.js';
import '../../src/content/page-assistance.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDocument, makeElement } from '../helpers.js';

const page = globalThis.KluErpPageAssistance;

test('detects the visible CAPTCHA image without inspecting input values', () => {
  const { document, input } = makeDocument();
  Object.defineProperty(input, 'value', { get() { throw new Error('CAPTCHA input value must not be read'); }, set() { throw new Error('CAPTCHA input value must not be written'); } });
  const status = page.inspectPage(document);
  assert.equal(status.state, page.STATUS.ASSISTANCE_AVAILABLE);
  assert.equal(status.hasCaptchaImage, true);
  assert.equal(status.hasCaptchaInput, true);
  assert.match(status.imageDataUrl, /^data:image\/png;base64,/);
});

test('fails closed on unsupported origin and missing image', () => {
  const foreign = makeDocument({ url: 'https://evil.example.test/login' });
  assert.equal(page.inspectPage(foreign.document).state, page.STATUS.UNSUPPORTED_PAGE);
  const broken = makeDocument({ image: makeElement({ loaded: false }) });
  assert.equal(page.inspectPage(broken.document).state, page.STATUS.CAPTCHA_IMAGE_UNAVAILABLE);
});

test('focus helper only focuses the manual field; refresh helper is explicit and rate limited', () => {
  const { document, input, refresh } = makeDocument();
  const focus = page.focusCaptchaInput(document);
  assert.equal(focus.ok, true);
  assert.equal(input.focused, true);
  assert.equal(input.scrolled, true);
  const first = page.triggerCaptchaRefresh(document, 2000, 0);
  assert.equal(first.ok, true);
  assert.equal(refresh.clickCount, 1);
  const second = page.triggerCaptchaRefresh(document, 2500, 2000);
  assert.equal(second.ok, false);
  assert.equal(refresh.clickCount, 1);
});

test('does not invoke form submission or populate a CAPTCHA field', () => {
  const { document, input } = makeDocument();
  const submitted = { value: false };
  const form = { submit() { submitted.value = true; } };
  const focus = page.focusCaptchaInput(document);
  assert.equal(focus.ok, true);
  assert.equal(input.focused, true);
  assert.equal(submitted.value, false);
  assert.equal(typeof input.value, 'undefined');
  assert.equal(typeof form.submit, 'function');
});
