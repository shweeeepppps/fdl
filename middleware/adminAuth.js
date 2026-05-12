'use strict';

const crypto = require('crypto');

const ADMIN_COOKIE = 'admin_auth';

function isAdminConfigured() {
  return Boolean(process.env.ADMIN_TOKEN);
}

function timingSafeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function adminAuthMiddleware(req, res, next) {
  // If admin isn’t configured, don’t throw a 500; send users to login first.
  // (They’ll still fail until ADMIN_TOKEN is set correctly.)
  if (!isAdminConfigured()) {
    return res.redirect('/admin/login');
  }

  const token = req.cookies && req.cookies[ADMIN_COOKIE];
  if (token && timingSafeEquals(token, process.env.ADMIN_TOKEN)) {
    return next();
  }

  return res.redirect('/admin/login');
}

module.exports = { adminAuthMiddleware, ADMIN_COOKIE };
