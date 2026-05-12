// server.js
// ─────────────────────────────────────────────────────────
//  FDL Chemicals — Express server entry point
// ─────────────────────────────────────────────────────────
'use strict';

require('dotenv').config();

const express       = require('express');
const path          = require('path');
const cookieParser  = require('cookie-parser');
const morgan        = require('morgan');
const helmet        = require('helmet');
const { engine }    = require('express-handlebars');

const { i18nMiddleware, SUPPORTED_LANGS } = require('./middleware/i18n');
const { siteSettingsMiddleware }        = require('./middleware/siteSettings');
const { verifyConnection }                = require('./services/mailer');
const routes                              = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
        styleSrc:   ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc:    ["'self'", 'fonts.gstatic.com'],
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// ── Request logging ───────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body parsers ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static assets ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Handlebars template engine ────────────────────────────
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir:  path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
      // {{json obj}}
      json: (ctx) => JSON.stringify(ctx),

      // {{eq a b}} — block or inline equality
      eq: function (a, b, options) {
        if (options && options.fn) {
          return a === b ? options.fn(this) : (options.inverse ? options.inverse(this) : '');
        }
        return a === b;
      },

      // {{ne a b}}
      ne: (a, b) => a !== b,

      // {{{productIcon num}}} — returns safe HTML string for each product icon
      productIcon: (num) => {
        const icons = {
          '01': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="6" width="20" height="32" rx="2" stroke="#7aff4f" stroke-width="1.4"/><path d="M17 18h10M17 24h7M17 12h10" stroke="#7aff4f" stroke-width="1.1" stroke-linecap="round"/><circle cx="30" cy="34" r="2" fill="#7aff4f"/></svg>`,
          '02': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 6v8M14 12l5 5M30 12l-5 5" stroke="#7aff4f" stroke-width="1.4" stroke-linecap="round"/><circle cx="22" cy="26" r="10" stroke="#7aff4f" stroke-width="1.4"/><circle cx="22" cy="26" r="4" fill="#7aff4f" opacity="0.28"/></svg>`,
          '03': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 36c0-8 6-16 12-20 6 4 12 12 12 20H10z" stroke="#7aff4f" stroke-width="1.4"/><path d="M22 16v12" stroke="#7aff4f" stroke-width="1.1" stroke-linecap="round"/><path d="M17 26l5 6 5-6" stroke="#7aff4f" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
          '04': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="18" width="28" height="18" rx="2" stroke="#7aff4f" stroke-width="1.4"/><path d="M16 18v-4a6 6 0 0112 0v4" stroke="#7aff4f" stroke-width="1.4"/><circle cx="22" cy="27" r="3" stroke="#7aff4f" stroke-width="1.1"/><path d="M22 30v4" stroke="#7aff4f" stroke-width="1.1" stroke-linecap="round"/></svg>`,
          '05': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 36V18l10-12 10 12v18H12z" stroke="#7aff4f" stroke-width="1.4"/><path d="M18 36v-8h8v8" stroke="#7aff4f" stroke-width="1.1"/><circle cx="22" cy="20" r="3" stroke="#7aff4f" stroke-width="1.1"/></svg>`,
          '06': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="22,6 36,14 36,30 22,38 8,30 8,14" stroke="#7aff4f" stroke-width="1.4" fill="none"/><polygon points="22,14 30,18 30,26 22,30 14,26 14,18" stroke="#7aff4f" stroke-width="0.9" fill="none" opacity="0.4"/><circle cx="22" cy="22" r="3" fill="#7aff4f" opacity="0.35"/></svg>`,
          '07': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="26" width="32" height="10" rx="1" stroke="#7aff4f" stroke-width="1.4"/><path d="M14 26V16a2 2 0 012-2h12a2 2 0 012 2v10" stroke="#7aff4f" stroke-width="1.4"/><path d="M18 14V8M26 14V8" stroke="#7aff4f" stroke-width="1.1" stroke-linecap="round"/></svg>`,
          '08': `<svg class="product-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="14" stroke="#7aff4f" stroke-width="1.4"/><path d="M16 22c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="#7aff4f" stroke-width="1.1" stroke-linecap="round"/><circle cx="22" cy="22" r="2.5" fill="#7aff4f"/></svg>`,
        };
        return icons[num] || '';
      },
    },
  })
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ── Language routing middleware ───────────────────────────
// Detect /:lang prefix and set req.lang before i18n runs
app.use((req, res, next) => {
  const seg = req.path.split('/')[1];
  req.lang  = SUPPORTED_LANGS.includes(seg) ? seg : null;
  next();
});

app.use(i18nMiddleware);
app.use(siteSettingsMiddleware);

// ── Routes ────────────────────────────────────────────────
app.use('/', routes);

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { layout: 'main', t: res.locals.t, lang: res.locals.lang });
});

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀  FDL Chemicals server running at http://localhost:${PORT}`);
  console.log(`   Default language : ${process.env.DEFAULT_LANG || 'fr'}`);
  console.log(`   Environment      : ${process.env.NODE_ENV || 'development'}\n`);
  await verifyConnection();
});

module.exports = app;
