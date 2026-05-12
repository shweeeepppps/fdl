'use strict';

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', 'data', 'site-settings.json');

const DEFAULT_SETTINGS = {
  // values are language-agnostic; labels come from locales
  contact: {
    address_value: 'Zone Industrielle, Casablanca, Morocco',
    email_value: 'contact@fdl-chemicals.ma',
    phone_value: '+212 5 22 XXX XXX',
    hours_value: 'Mon–Fri, 08:00–18:00 (GMT+1)',
  },
  footer: {
    copy: '© 2026 FDL Chemicals. All rights reserved.',
  },
};

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return { ...DEFAULT_SETTINGS };
    }
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return deepMerge({ ...DEFAULT_SETTINGS }, parsed);
  } catch (_err) {
    // If JSON is corrupt or unreadable, fall back to defaults.
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(next) {
  ensureDirExists(SETTINGS_PATH);
  const merged = deepMerge({ ...DEFAULT_SETTINGS }, next);
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source || {})) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      deepMerge(targetVal, sourceVal);
      continue;
    }
    target[key] = sourceVal;
  }
  return target;
}

module.exports = { readSettings, writeSettings, DEFAULT_SETTINGS };
