// services/mailer.js
// ─────────────────────────────────────────────────────────
//  Nodemailer transporter — reads all config from .env
// ─────────────────────────────────────────────────────────
'use strict';

const nodemailer = require('nodemailer');

// Build transporter from env variables
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',   // true → port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

/**
 * Send contact-form email to CONTACT_RECEIVER_EMAIL.
 *
 * @param {Object} data
 * @param {string} data.firstname
 * @param {string} data.lastname
 * @param {string} data.company
 * @param {string} data.email
 * @param {string} data.category
 * @param {string} data.message
 * @param {string} data.lang          - 'fr' | 'en'
 * @returns {Promise<Object>}          nodemailer info object
 */
async function sendContactEmail(data) {
  const { firstname, lastname, company, email, category, message, lang } = data;

  const subject =
    lang === 'fr'
      ? `[FDL Chemicals] Nouvelle demande — ${category} — ${firstname} ${lastname}`
      : `[FDL Chemicals] New inquiry — ${category} — ${firstname} ${lastname}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#080a08; color:#e8f0e8; margin:0; padding:0; }
    .wrapper { max-width:600px; margin:0 auto; padding:40px 20px; }
    .header { border-bottom:3px solid #7aff4f; padding-bottom:20px; margin-bottom:32px; }
    .logo { font-size:22px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#e8f0e8; }
    .logo span { color:#7aff4f; }
    .badge { display:inline-block; background:#7aff4f; color:#080a08; font-size:10px; letter-spacing:0.15em; text-transform:uppercase; padding:4px 10px; margin-top:8px; font-weight:700; }
    .field { margin-bottom:20px; }
    .field-label { font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:#4a5e4a; margin-bottom:4px; font-family:monospace; }
    .field-value { font-size:15px; color:#e8f0e8; border-left:2px solid #7aff4f; padding-left:12px; }
    .message-box { background:#0e110e; border:1px solid #1f261f; padding:20px; margin-top:8px; }
    .message-box p { margin:0; font-size:14px; color:#8a9e8a; line-height:1.7; white-space:pre-wrap; }
    .footer { margin-top:40px; border-top:1px solid #1f261f; padding-top:20px; font-size:11px; color:#4a5e4a; font-family:monospace; letter-spacing:0.1em; text-transform:uppercase; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">FDL<span>.</span>Chemicals</div>
    <div class="badge">${lang === 'fr' ? 'Nouvelle Demande de Contact' : 'New Contact Inquiry'}</div>
  </div>

  <div class="field">
    <div class="field-label">${lang === 'fr' ? 'Nom Complet' : 'Full Name'}</div>
    <div class="field-value">${escapeHtml(firstname)} ${escapeHtml(lastname)}</div>
  </div>

  <div class="field">
    <div class="field-label">${lang === 'fr' ? 'Société' : 'Company'}</div>
    <div class="field-value">${escapeHtml(company)}</div>
  </div>

  <div class="field">
    <div class="field-label">Email</div>
    <div class="field-value"><a href="mailto:${escapeHtml(email)}" style="color:#7aff4f;">${escapeHtml(email)}</a></div>
  </div>

  <div class="field">
    <div class="field-label">${lang === 'fr' ? 'Catégorie de Produit' : 'Product Category'}</div>
    <div class="field-value">${escapeHtml(category)}</div>
  </div>

  <div class="field">
    <div class="field-label">${lang === 'fr' ? 'Message & Spécifications' : 'Message & Specifications'}</div>
    <div class="message-box"><p>${escapeHtml(message)}</p></div>
  </div>

  <div class="footer">
    FDL Chemicals · Zone Industrielle, Casablanca, Maroc<br>
    ${lang === 'fr' ? 'Reçu le' : 'Received'}: ${new Date().toLocaleString(lang === 'fr' ? 'fr-MA' : 'en-GB', { timeZone: 'Africa/Casablanca' })}
  </div>
</div>
</body>
</html>`;

  const mailOptions = {
    from: `"FDL Chemicals Website" <${process.env.CONTACT_SENDER_EMAIL}>`,
    to:   process.env.CONTACT_RECEIVER_EMAIL,
    replyTo: email,
    subject,
    html: htmlBody,
    text: `${subject}\n\nName: ${firstname} ${lastname}\nCompany: ${company}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}`,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Verify SMTP connection on startup.
 * Logs result — does not throw (non-fatal).
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('✅  SMTP connection verified — mailer ready');
  } catch (err) {
    console.warn('⚠️  SMTP connection failed:', err.message);
    console.warn('   Check your SMTP_* variables in .env');
  }
}

/** Basic HTML escape to prevent injection in email body */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendContactEmail, verifyConnection };
