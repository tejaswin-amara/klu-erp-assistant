import { DEFAULT_PREFERENCES, STORAGE_KEY, STORAGE_SCHEMA_VERSION, VISUAL_FILTERS, ZOOM_LEVELS } from './constants.js';

export function sanitizePreferences(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_PREFERENCES };
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    zoom: ZOOM_LEVELS.includes(raw.zoom) ? raw.zoom : DEFAULT_PREFERENCES.zoom,
    filter: VISUAL_FILTERS.includes(raw.filter) ? raw.filter : DEFAULT_PREFERENCES.filter,
    highContrastUi: typeof raw.highContrastUi === 'boolean' ? raw.highContrastUi : DEFAULT_PREFERENCES.highContrastUi
  };
}

export async function loadPreferences(storageArea) {
  if (!storageArea || typeof storageArea.get !== 'function') return sanitizePreferences(null);
  try {
    const result = await storageArea.get([STORAGE_KEY]);
    return sanitizePreferences(result?.[STORAGE_KEY]);
  } catch { return sanitizePreferences(null); }
}

export async function savePreferences(partial, storageArea) {
  const current = await loadPreferences(storageArea);
  const next = sanitizePreferences({ ...current, ...(partial && typeof partial === 'object' ? partial : {}) });
  if (storageArea && typeof storageArea.set === 'function') await storageArea.set({ [STORAGE_KEY]: next });
  return next;
}

export async function resetPreferences(storageArea) {
  const next = sanitizePreferences(null);
  if (storageArea && typeof storageArea.set === 'function') await storageArea.set({ [STORAGE_KEY]: next });
  return next;
}
