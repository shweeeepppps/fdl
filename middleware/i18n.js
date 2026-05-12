// middleware/i18n.js
// ─────────────────────────────────────────────────────────
//  Loads the correct locale JSON and attaches it to res.locals
//  so every Handlebars template has access to `t` (translations).
// ─────────────────────────────────────────────────────────
'use strict';

const path = require('path');
const fs   = require('fs');

const SUPPORTED_LANGS = ['fr', 'en'];
const DEFAULT_LANG    = process.env.DEFAULT_LANG || 'fr';

// Cache locale files in memory
const localeCache = {};

function loadLocale(lang) {
  if (localeCache[lang]) return localeCache[lang];
  const filePath = path.join(__dirname, '..', 'locales', `${lang}.json`);
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  localeCache[lang] = data;
  return data;
}

/**
 * Detects desired language from:
 *  1. URL prefix  /fr/... or /en/...
 *  2. Cookie      lang=fr
 *  3. Default from .env
 */
function i18nMiddleware(req, res, next) {
  // 1. URL prefix — set by router (req.lang)
  let lang = req.lang;

  // 2. Cookie fallback
  if (!lang && req.cookies && SUPPORTED_LANGS.includes(req.cookies.lang)) {
    lang = req.cookies.lang;
  }

  // 3. Default
  if (!SUPPORTED_LANGS.includes(lang)) {
    lang = DEFAULT_LANG;
  }

  const t = loadLocale(lang);
  if (!t) {
    return next(new Error(`Locale file missing: ${lang}.json`));
  }

  // Persist preference in cookie (1 year)
  res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });

  // Expose to templates and downstream handlers
  res.locals.t    = t;
  res.locals.lang = lang;
  req.lang        = lang;

  next();
}

module.exports = { i18nMiddleware, SUPPORTED_LANGS, DEFAULT_LANG };
