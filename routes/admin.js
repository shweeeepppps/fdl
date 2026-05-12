'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuthMiddleware } = require('../middleware/adminAuth');
const { readSettings, writeSettings } = require('../services/siteSettings');

const router = express.Router();

// GET /admin/login
router.get('/login', (req, res) => {
  res.render('admin/login', {
    layout: 'main',
    t: res.locals.t,
    lang: res.locals.lang,
    error: null,
  });
});

// POST /admin/login
router.post(
  '/login',
  [
    body('token').trim().notEmpty().withMessage('Token is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/login', {
        layout: 'main',
        t: res.locals.t,
        lang: res.locals.lang,
        error: errors.array()[0]?.msg || 'Invalid token',
      });
    }

    const token = req.body.token;
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).render('admin/login', {
        layout: 'main',
        t: res.locals.t,
        lang: res.locals.lang,
        error: 'Invalid admin token',
      });
    }

    const maxAgeMs = 365 * 24 * 60 * 60 * 1000;
    res.cookie('admin_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAgeMs,
    });
    return res.redirect('/admin');
  }
);

// POST /admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_auth');
  return res.redirect('/admin/login');
});

// GET /admin  (settings page)
router.get('/', adminAuthMiddleware, (req, res) => {
  const settings = readSettings();
  const updated = req.query.updated === '1';

  const hours = settings?.contact?.hours_value || '';
  // Expected format: "Mon–Fri, 08:00–18:00 (GMT+1)"
  const hoursMatch = hours.match(/^(.+?),\s*([0-9]{2}:[0-9]{2})–([0-9]{2}:[0-9]{2})/);

  const hoursDay = hoursMatch?.[1] || '';
  const hoursStart = hoursMatch?.[2] || '';
  const hoursEnd = hoursMatch?.[3] || '';

  const settingsWithEdit = {
    ...settings,
    contact: {
      ...settings.contact,
      hours_edit_day_value: hoursDay,
      hours_edit_start_time_value: hoursStart,
      hours_edit_end_time_value: hoursEnd,
    },
  };

  return res.render('admin/settings', {
    layout: 'main',
    t: res.locals.t,
    lang: res.locals.lang,
    settings: settingsWithEdit,
    updated,
    error: null,
  });
});

// POST /admin  (update settings)
router.post(
  '/',
  adminAuthMiddleware,
  [
    body('contact_address_value').trim().notEmpty().isLength({ max: 300 }),
    body('contact_email_value').trim().isEmail().isLength({ max: 150 }),
    body('contact_phone_value').trim().notEmpty().isLength({ max: 80 }),
    body('contact_hours_day_value').trim().notEmpty().isLength({ max: 50 }),
    body('contact_hours_start_time_value').trim().notEmpty().matches(/^\d{2}:\d{2}$/),
    body('contact_hours_end_time_value').trim().notEmpty().matches(/^\d{2}:\d{2}$/),
    body('footer_copy').trim().notEmpty().isLength({ max: 200 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/settings', {
        layout: 'main',
        t: res.locals.t,
        lang: res.locals.lang,
        settings: req.body,
        error: errors.array()[0]?.msg || 'Invalid input',
      });
    }

    const dayRange = req.body.contact_hours_day_value;
    const startTime = req.body.contact_hours_start_time_value;
    const endTime = req.body.contact_hours_end_time_value;

    // Keep the same human-friendly string format used by the homepage.
    const composedHoursValue = `${dayRange}, ${startTime}–${endTime} (GMT+1)`;

    const nextSettings = {
      contact: {
        address_value: req.body.contact_address_value,
        email_value: req.body.contact_email_value,
        phone_value: req.body.contact_phone_value,
        hours_value: composedHoursValue,
      },
      footer: {
        copy: req.body.footer_copy,
      },
    };

    try {
      writeSettings(nextSettings);
      return res.redirect('/admin?updated=1');
    } catch (err) {
      console.error('Failed to write settings:', err);
      return res.status(500).render('admin/settings', {
        layout: 'main',
        t: res.locals.t,
        lang: res.locals.lang,
        settings: nextSettings,
        error: 'Failed to save settings',
      });
    }
  }
);

module.exports = router;
