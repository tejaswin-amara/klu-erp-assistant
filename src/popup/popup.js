import { MESSAGE_TYPES, UI_STATES, ZOOM_LEVELS, VISUAL_FILTERS } from '../shared/constants.js';
import { SUPPORTED_ERP_ORIGIN } from '../shared/config.js';
import { isSupportedErpUrl } from '../shared/url-validator.js';
import { loadPreferences, savePreferences, resetPreferences } from '../shared/preferences.js';

const $ = (id) => document.getElementById(id);
const elements = {
  status: $('status'), statusTitle: $('status-title'), statusMessage: $('status-message'),
  image: $('captcha-image'), empty: $('empty-state'), zoom: $('zoom'), filter: $('filter'),
  zoomReadout: $('zoom-readout'), focus: $('focus-button'), refresh: $('refresh-button'),
  check: $('check-button'), highContrast: $('high-contrast-ui'), reset: $('reset-button')
};
let prefs;
let activeTabId = null;
let pageStatus = null;

function setStatus(title, message, tone = '') {
  elements.status.className = `status ${tone}`.trim();
  elements.statusTitle.textContent = title;
  elements.statusMessage.textContent = message;
}

function applyPreview() {
  const zoom = Number(elements.zoom.value);
  const filter = elements.filter.value;
  elements.zoomReadout.textContent = `${zoom}×`;
  elements.image.style.transform = `scale(${zoom})`;
  elements.image.style.filter = filter === 'high-contrast'
    ? 'contrast(180%) brightness(105%)'
    : filter === 'grayscale' ? 'grayscale(100%) contrast(140%)' : 'none';
  elements.image.style.margin = `${Math.round((zoom - 1) * 14)}px auto`;
}

function renderStatus(response) {
  pageStatus = response;
  elements.focus.disabled = !response?.hasCaptchaInput;
  elements.refresh.disabled = !response?.hasRefreshControl;
  if (response?.imageDataUrl && response.state === UI_STATES.ASSISTANCE_AVAILABLE) {
    elements.image.src = response.imageDataUrl;
    elements.image.hidden = false;
    elements.empty.hidden = true;
    setStatus('Assistance available', response.message, 'ok');
    applyPreview();
  } else {
    elements.image.removeAttribute('src');
    elements.image.hidden = true;
    elements.empty.hidden = false;
    elements.empty.textContent = response?.hasCaptchaImage
      ? 'Image could not be copied safely. Inspect it directly on the ERP page.'
      : 'No supported CAPTCHA image is available.';
    const tone = response?.state === UI_STATES.UNSUPPORTED_PAGE ? 'warning' : 'warning';
    setStatus(response?.state?.replaceAll('_', ' ') ?? 'Unable to inspect page', response?.message ?? 'Re-check the active tab.', tone);
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0] ?? null;
}

async function sendPageMessage(type) {
  if (activeTabId == null) throw new Error('No active supported tab.');
  return chrome.tabs.sendMessage(activeTabId, { type });
}

async function inspectActiveTab() {
  elements.focus.disabled = true;
  elements.refresh.disabled = true;
  elements.image.hidden = true;
  elements.empty.hidden = false;
  try {
    const tab = await getActiveTab();
    activeTabId = tab?.id ?? null;
    if (!tab?.url || !isSupportedErpUrl(tab.url, SUPPORTED_ERP_ORIGIN).supported) {
      activeTabId = null;
      renderStatus({ state: UI_STATES.UNSUPPORTED_PAGE, message: `Open the supported ERP at ${SUPPORTED_ERP_ORIGIN}.`, hasCaptchaImage: false, hasCaptchaInput: false, hasRefreshControl: false });
      return;
    }
    setStatus('Checking page', 'Inspecting only the visible CAPTCHA-related elements…');
    const response = await sendPageMessage(MESSAGE_TYPES.GET_PAGE_STATUS);
    if (!response?.ok) throw new Error(response?.error || response?.message || 'The content script did not respond. Reload the ERP tab and try again.');
    renderStatus(response);
  } catch (error) {
    activeTabId = null;
    renderStatus({ state: UI_STATES.RECOVERABLE_ERROR, message: error instanceof Error ? error.message : 'Could not communicate with the ERP page.', hasCaptchaImage: false, hasCaptchaInput: false, hasRefreshControl: false });
  }
}

async function saveCurrentPrefs(partial) {
  prefs = await savePreferences(partial, chrome.storage.local);
  elements.zoom.value = String(prefs.zoom);
  elements.filter.value = prefs.filter;
  elements.highContrast.checked = prefs.highContrastUi;
  document.body.classList.toggle('high-contrast', prefs.highContrastUi);
  applyPreview();
}

async function init() {
  prefs = await loadPreferences(chrome.storage.local);
  elements.zoom.value = String(prefs.zoom);
  elements.filter.value = prefs.filter;
  elements.highContrast.checked = prefs.highContrastUi;
  document.body.classList.toggle('high-contrast', prefs.highContrastUi);
  applyPreview();

  elements.zoom.addEventListener('change', () => saveCurrentPrefs({ zoom: Number(elements.zoom.value) }));
  elements.filter.addEventListener('change', () => {
    if (!VISUAL_FILTERS.includes(elements.filter.value)) return;
    saveCurrentPrefs({ filter: elements.filter.value });
  });
  elements.highContrast.addEventListener('change', () => saveCurrentPrefs({ highContrastUi: elements.highContrast.checked }));
  elements.check.addEventListener('click', inspectActiveTab);
  elements.focus.addEventListener('click', async () => {
    try {
      const result = await sendPageMessage(MESSAGE_TYPES.FOCUS_CAPTCHA_INPUT);
      setStatus(result.ok ? 'Action completed' : 'Action unavailable', result.message || result.error || 'No result returned.', result.ok ? 'ok' : 'warning');
    } catch { setStatus('Action unavailable', 'Reload the ERP tab and re-check the page.', 'warning'); }
  });
  elements.refresh.addEventListener('click', async () => {
    try {
      const result = await sendPageMessage(MESSAGE_TYPES.TRIGGER_CAPTCHA_REFRESH);
      setStatus(result.ok ? 'Action completed' : 'Refresh unavailable', result.message || result.error || 'No result returned.', result.ok ? 'ok' : 'warning');
      if (result.ok) window.setTimeout(inspectActiveTab, 700);
    } catch { setStatus('Refresh unavailable', 'Reload the ERP tab and re-check the page.', 'warning'); }
  });
  elements.reset.addEventListener('click', async () => {
    prefs = await resetPreferences(chrome.storage.local);
    elements.zoom.value = String(prefs.zoom);
    elements.filter.value = prefs.filter;
    elements.highContrast.checked = prefs.highContrastUi;
    document.body.classList.toggle('high-contrast', prefs.highContrastUi);
    applyPreview();
    setStatus('Preferences reset', 'Default magnification and display preferences restored.', 'ok');
  });
  await inspectActiveTab();
}

init().catch(() => setStatus('Initialization error', 'The extension could not initialize. Reload it from chrome://extensions and try again.', 'error'));
