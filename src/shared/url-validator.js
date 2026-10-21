import { SUPPORTED_ERP_ORIGIN } from './config.js';

export function normalizeHttpsOrigin(value) {
  if (typeof value !== 'string' || !value.trim() || value.includes('*')) {
    return { valid: false, origin: null, reason: 'Enter one exact HTTPS origin without wildcards or a path.' };
  }
  let url;
  try { url = new URL(value.trim()); }
  catch { return { valid: false, origin: null, reason: 'Invalid URL.' }; }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    return { valid: false, origin: null, reason: 'Use an HTTPS origin only: scheme and hostname, with no credentials, path, query, or fragment.' };
  }
  return { valid: true, origin: url.origin, reason: 'Valid HTTPS origin.' };
}

export function isSupportedErpUrl(value, expectedOrigin = SUPPORTED_ERP_ORIGIN) {
  if (typeof value !== 'string' || !value) {
    return { supported: false, origin: null, reason: 'No active page URL is available.' };
  }
  let url;
  try { url = new URL(value); }
  catch { return { supported: false, origin: null, reason: 'The active page URL is invalid.' }; }
  if (url.protocol !== 'https:' || url.username || url.password || url.origin !== expectedOrigin) {
    return { supported: false, origin: url.origin, reason: 'This extension is limited to the configured KLU ERP HTTPS origin.' };
  }
  return { supported: true, origin: url.origin, reason: 'Supported ERP origin matched.' };
}
