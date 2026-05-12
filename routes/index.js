// routes/index.js
// ─────────────────────────────────────────────────────────
//  Page routes + contact form POST handler
// ─────────────────────────────────────────────────────────
'use strict';

const express   = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendContactEmail } = require('../services/mailer');

const router = express.Router();

// ── Rate limiter for contact form ─────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                                   // 15 min window
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later.' },
});

// ── Validation rules ──────────────────────────────────────
const contactValidation = [
  body('firstname').trim().notEmpty().isLength({ max: 100 }),
  body('lastname').trim().notEmpty().isLength({ max: 100 }),
  body('company').trim().notEmpty().isLength({ max: 200 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('category').trim().notEmpty().isLength({ max: 100 }),
  body('message').trim().notEmpty().isLength({ min: 10, max: 5000 }),
];

// ── GET  /  →  redirect to default lang ──────────────────
router.get('/', (req, res) => {
  res.redirect(`/${req.lang}`);
});

// ── GET  /:lang  →  landing page ─────────────────────────
router.get('/:lang', (req, res) => {
  res.render('home', {
    layout: 'main',
    t: res.locals.t,
    lang: res.locals.lang,
  });
});

// ── POST /:lang/contact  →  send email ───────────────────
router.post(
  '/:lang/contact',
  contactLimiter,
  contactValidation,
  async (req, res) => {
    const lang = res.locals.lang;
    const t    = res.locals.t;

    // Validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: t.contact.form.error,
        fields: errors.array(),
      });
    }

    const { firstname, lastname, company, email, category, message } = req.body;

    try {
      await sendContactEmail({ firstname, lastname, company, email, category, message, lang });
      return res.json({ success: true, message: t.contact.form.success });
    } catch (err) {
      console.error('Mailer error:', err);
      return res.status(500).json({ success: false, message: t.contact.form.error });
    }
  }
);

module.exports = router;
