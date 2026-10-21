import test from 'node:test';
import assert from 'node:assert/strict';
import { isTrustedExtensionSender, validateMessage } from '../../src/shared/messages.js';
import { MESSAGE_TYPES } from '../../src/shared/constants.js';

test('validates known message schemas and visual preferences', () => {
  assert.equal(validateMessage({ type: MESSAGE_TYPES.GET_PAGE_STATUS }).valid, true);
  assert.equal(validateMessage({ type: MESSAGE_TYPES.FOCUS_CAPTCHA_INPUT }).valid, true);
});

test('rejects unknown types, arrays, and unexpected/sensitive fields', () => {
  assert.equal(validateMessage(null).valid, false);
  assert.equal(validateMessage([]).valid, false);
  assert.equal(validateMessage({ type: 'AUTO_SOLVE_CAPTCHA' }).valid, false);
  assert.equal(validateMessage({ type: MESSAGE_TYPES.GET_PAGE_STATUS, extra: 1 }).valid, false);
  assert.equal(validateMessage({ type: MESSAGE_TYPES.GET_PAGE_STATUS, password: 'secret' }).valid, false);
  assert.equal(validateMessage(Object.assign(Object.create(null), { type: MESSAGE_TYPES.GET_PAGE_STATUS })).valid, false);
});

test('extension sender must have the exact extension ID', () => {
  assert.equal(isTrustedExtensionSender({ id: 'abc' }, 'abc'), true);
  assert.equal(isTrustedExtensionSender({ id: 'other' }, 'abc'), false);
  assert.equal(isTrustedExtensionSender({}, 'abc'), false);
  assert.equal(isTrustedExtensionSender({ id: 'abc' }, ''), false);
});
