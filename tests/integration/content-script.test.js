import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { makeDocument } from '../helpers.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(rootDir, rel), 'utf8');

test('content listener validates sender and schema, supports manual actions, and is idempotent', () => {
  const { document, input, refresh } = makeDocument();
  const listeners = new Set();
  const root = {
    URL,
    Date,
    document,
    chrome: {
      runtime: {
        id: 'extension-123',
        onMessage: {
          addListener(fn) { listeners.add(fn); },
          removeListener(fn) { listeners.delete(fn); }
        }
      }
    },
    addEventListener() {}
  };
  const context = vm.createContext(root);
  vm.runInContext(read('src/content/config.js'), context);
  vm.runInContext(read('src/content/page-assistance.js'), context);
  vm.runInContext(read('src/content/content-script.js'), context);
  assert.equal(listeners.size, 1);
  vm.runInContext(read('src/content/content-script.js'), context);
  assert.equal(listeners.size, 1, 'second initialization must not register duplicate listeners');

  function send(messageExpression, senderExpression = '({ id: "extension-123" })') {
    let response;
    const message = vm.runInContext(messageExpression, context);
    const sender = vm.runInContext(senderExpression, context);
    [...listeners][0](message, sender, (value) => { response = value; });
    return response;
  }

  const status = send('({ type: "GET_PAGE_STATUS" })');
  assert.equal(status.ok, true);
  assert.equal(status.state, 'ASSISTANCE_AVAILABLE');
  const focus = send('({ type: "FOCUS_CAPTCHA_INPUT" })');
  assert.equal(focus.ok, true);
  assert.equal(input.focused, true);
  assert.equal(input.value, undefined);
  const refreshed = send('({ type: "TRIGGER_CAPTCHA_REFRESH" })');
  assert.equal(refreshed.ok, true);
  assert.equal(refresh.clickCount, 1);
  const secondRefresh = send('({ type: "TRIGGER_CAPTCHA_REFRESH" })');
  assert.equal(secondRefresh.ok, false);
  assert.equal(refresh.clickCount, 1);
  assert.equal(send('({ type: "GET_PAGE_STATUS", unexpected: true })').ok, false);
  assert.equal(send('({ type: "GET_PAGE_STATUS" })', '({ id: "another-extension" })').ok, false);

  root.__KLU_ERP_MANUAL_ASSISTANT__.destroy();
  assert.equal(listeners.size, 0);
});
