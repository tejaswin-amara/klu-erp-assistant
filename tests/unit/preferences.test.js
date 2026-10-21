import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPreferences, resetPreferences, sanitizePreferences, savePreferences } from '../../src/shared/preferences.js';
import { STORAGE_KEY } from '../../src/shared/constants.js';

function memoryStorage() {
  const store = {};
  return { store, async get(keys) { return Object.fromEntries(keys.map((key) => [key, store[key]])); }, async set(data) { Object.assign(store, data); } };
}

test('sanitizes malformed or sensitive values to a strict preference allowlist', () => {
  const result = sanitizePreferences({ zoom: 500, filter: 'invalid', highContrastUi: 'yes', password: 'do-not-store', captchaAnswer: 'abcd' });
  assert.deepEqual(result, { schemaVersion: 1, zoom: 2, filter: 'none', highContrastUi: false });
  assert.equal('password' in result, false);
  assert.equal('captchaAnswer' in result, false);
});

test('preference storage saves, loads, and resets safe values', async () => {
  const storage = memoryStorage();
  const saved = await savePreferences({ zoom: 3, filter: 'grayscale', highContrastUi: true }, storage);
  assert.equal(saved.zoom, 3);
  assert.equal((await loadPreferences(storage)).filter, 'grayscale');
  assert.ok(storage.store[STORAGE_KEY]);
  const reset = await resetPreferences(storage);
  assert.deepEqual(reset, { schemaVersion: 1, zoom: 2, filter: 'none', highContrastUi: false });
});

test('storage failures return safe defaults', async () => {
  const result = await loadPreferences({ async get() { throw new Error('storage unavailable'); } });
  assert.equal(result.zoom, 2);
});
