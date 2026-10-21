import { MESSAGE_TYPES } from './constants.js';

const SCHEMAS = Object.freeze({
  [MESSAGE_TYPES.GET_PAGE_STATUS]: new Set(['type']),
  [MESSAGE_TYPES.FOCUS_CAPTCHA_INPUT]: new Set(['type']),
  [MESSAGE_TYPES.TRIGGER_CAPTCHA_REFRESH]: new Set(['type'])
});

export function validateMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message) || Object.getPrototypeOf(message) !== Object.prototype) {
    return { valid: false, error: 'Message must be a plain object.' };
  }
  const keys = Object.keys(message);
  if (typeof message.type !== 'string' || !Object.hasOwn(SCHEMAS, message.type)) {
    return { valid: false, error: 'Unknown message type.' };
  }
  const allowed = SCHEMAS[message.type];
  if (keys.some((key) => !allowed.has(key))) return { valid: false, error: 'Unexpected message property.' };
  return { valid: true, value: message };
}

export function isTrustedExtensionSender(sender, extensionId) {
  return Boolean(sender && typeof sender.id === 'string' && extensionId && sender.id === extensionId);
}
