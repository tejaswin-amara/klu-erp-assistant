import test from 'node:test';
import assert from 'node:assert/strict';
import { isSupportedErpUrl, normalizeHttpsOrigin } from '../../src/shared/url-validator.js';
import { SUPPORTED_ERP_ORIGIN } from '../../src/shared/config.js';

test('supports only the exact verified KLU ERP HTTPS origin', () => {
  const host = new URL(SUPPORTED_ERP_ORIGIN).hostname;
  assert.equal(isSupportedErpUrl(`${SUPPORTED_ERP_ORIGIN}/login`).supported, true);
  assert.equal(isSupportedErpUrl(`https://${host}.evil.test/login`).supported, false);
  assert.equal(isSupportedErpUrl(`http://${host}/login`).supported, false);
  assert.equal(isSupportedErpUrl('https://other.invalid/login').supported, false);
  assert.equal(isSupportedErpUrl('not a URL').supported, false);
  assert.equal(isSupportedErpUrl(`https://user:pass@${host}/login`).supported, false);
  assert.equal(SUPPORTED_ERP_ORIGIN, new URL(SUPPORTED_ERP_ORIGIN).origin);
});

test('domain configurator origin validation rejects paths and wildcards', () => {
  assert.deepEqual(normalizeHttpsOrigin('https://erp.example.edu'), { valid: true, origin: 'https://erp.example.edu', reason: 'Valid HTTPS origin.' });
  assert.equal(normalizeHttpsOrigin('https://erp.example.edu/login').valid, false);
  assert.equal(normalizeHttpsOrigin('https://*.example.edu').valid, false);
  assert.equal(normalizeHttpsOrigin('http://erp.example.edu').valid, false);
  assert.equal(normalizeHttpsOrigin('https://user:pass@erp.example.edu').valid, false);
});
