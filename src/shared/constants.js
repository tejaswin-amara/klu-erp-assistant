export const EXTENSION_VERSION = '2.0.0';
export const STORAGE_KEY = 'klu_erp_assistant_preferences_v2';
export const STORAGE_SCHEMA_VERSION = 1;

export const MESSAGE_TYPES = Object.freeze({
  GET_PAGE_STATUS: 'GET_PAGE_STATUS',
  FOCUS_CAPTCHA_INPUT: 'FOCUS_CAPTCHA_INPUT',
  TRIGGER_CAPTCHA_REFRESH: 'TRIGGER_CAPTCHA_REFRESH'
});

export const UI_STATES = Object.freeze({
  INITIALIZING: 'INITIALIZING',
  ASSISTANCE_AVAILABLE: 'ASSISTANCE_AVAILABLE',
  CAPTCHA_IMAGE_UNAVAILABLE: 'CAPTCHA_IMAGE_UNAVAILABLE',
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  UNSUPPORTED_PAGE: 'UNSUPPORTED_PAGE',
  USER_ACTION_COMPLETED: 'USER_ACTION_COMPLETED',
  RECOVERABLE_ERROR: 'RECOVERABLE_ERROR'
});

export const ZOOM_LEVELS = Object.freeze([1, 1.5, 2, 2.5, 3]);
export const VISUAL_FILTERS = Object.freeze(['none', 'high-contrast', 'grayscale']);
export const DEFAULT_PREFERENCES = Object.freeze({
  schemaVersion: STORAGE_SCHEMA_VERSION,
  zoom: 2,
  filter: 'none',
  highContrastUi: false
});
