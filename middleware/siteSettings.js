'use strict';

const { readSettings } = require('../services/siteSettings');

function siteSettingsMiddleware(req, res, next) {
  const settings = readSettings();

  // `t` comes from i18nMiddleware and must already exist at this point.
  // We only override the specific keys used by the homepage templates.
  if (res.locals && res.locals.t) {
    res.locals.t = {
      ...res.locals.t,
      contact: {
        ...res.locals.t.contact,
        address_value: settings.contact.address_value,
        email_value: settings.contact.email_value,
        phone_value: settings.contact.phone_value,
        hours_value: settings.contact.hours_value,
      },
      footer: {
        ...res.locals.t.footer,
        copy: settings.footer.copy,
      },
    };
  }

  next();
}

module.exports = { siteSettingsMiddleware };
