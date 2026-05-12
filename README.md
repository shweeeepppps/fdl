# FDL Chemicals — Website

> Industrial-premium bilingual website (FR/EN) for FDL Chemicals,
> Casablanca — built with Node.js, Express, Handlebars, and GSAP.

---

## Project Structure

```
fdl-chemicals/
├── server.js                  # Express entry point
├── package.json
├── .env.example               # ← copy to .env and fill in values
├── .gitignore
│
├── locales/
│   ├── fr.json                # All French text content
│   └── en.json                # All English text content
│
├── middleware/
│   └── i18n.js                # Language detection & locale loading
│
├── routes/
│   └── index.js               # Page routes + contact form POST
│
├── services/
│   └── mailer.js              # Nodemailer — sends contact emails
│
├── views/
│   ├── layouts/
│   │   └── main.hbs           # HTML shell (head, scripts)
│   ├── partials/
│   │   └── product-icons.hbs  # (reserved for future partials)
│   ├── home.hbs               # Full landing page template
│   └── 404.hbs                # 404 page
│
└── public/
    ├── css/
    │   └── style.css          # Full design system
    └── js/
        └── main.js            # GSAP animations + form AJAX
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Server
PORT=3000
NODE_ENV=development

# The mailbox that receives contact form inquiries
CONTACT_RECEIVER_EMAIL=contact@fdl-chemicals.ma

# The "from" address shown in the email
CONTACT_SENDER_EMAIL=noreply@fdl-chemicals.ma

# SMTP credentials (see options below)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password

# Default language when no preference is detected
DEFAULT_LANG=fr
```

### 3. Run

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/fr` or `/en` based on your `DEFAULT_LANG`.

---

## Language Switching

| URL | Language |
|-----|----------|
| `/`    | Redirects to `DEFAULT_LANG` |
| `/fr`  | French |
| `/en`  | English |
| `/fr/contact` | French form POST endpoint |
| `/en/contact` | English form POST endpoint |

Language preference is also stored in a cookie (`lang`) for 1 year.

All text content lives in `locales/fr.json` and `locales/en.json` — edit those files to update any copy on the site without touching templates.

---

## Contact Form & Email

The contact form submits via AJAX to `POST /:lang/contact`.

The server:
1. **Validates** all fields (express-validator)
2. **Rate-limits** to 5 submissions per IP per 15 minutes
3. **Sends an HTML email** to `CONTACT_RECEIVER_EMAIL` via Nodemailer
4. **Returns JSON** `{ success: true/false, message: "..." }`

The client JS handles the response and shows a success or error message inline — no page reload.

### SMTP Options

**Gmail (recommended for testing)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # App Password (not your login password)
```
→ Enable 2FA on your Google account, then generate an App Password at
  https://myaccount.google.com/apppasswords

**Outlook / Office 365**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@yourcompany.com
SMTP_PASS=your-password
```

**OVH / Infomaniak / cPanel**
```env
SMTP_HOST=mail.your-domain.ma
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@fdl-chemicals.ma
SMTP_PASS=your-password
```

**Transactional services (production recommended)**
- [Resend](https://resend.com) — `SMTP_HOST=smtp.resend.com` `SMTP_PORT=465` `SMTP_SECURE=true`
- [Brevo (Sendinblue)](https://brevo.com)
- [Mailgun](https://mailgun.com)
- [AWS SES](https://aws.amazon.com/ses/)

---

## Deployment

### VPS / Server (PM2)

```bash
npm install -g pm2
pm2 start server.js --name fdl-chemicals
pm2 save
pm2 startup
```

### Railway / Render / Fly.io

Set the environment variables in the dashboard (same keys as `.env`) and deploy. The `start` script (`node server.js`) is used automatically.

### Nginx reverse proxy (production)

```nginx
server {
    listen 80;
    server_name fdl-chemicals.ma www.fdl-chemicals.ma;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then add HTTPS with Certbot:
```bash
certbot --nginx -d fdl-chemicals.ma -d www.fdl-chemicals.ma
```

---

## Editing Content

All text is in `locales/fr.json` and `locales/en.json`.

- To **add a product category**: add an object to the `products.items` array in both files, add the option to `contact.form.categories`.
- To **change contact info**: update `contact.address_value`, `contact.email_value`, `contact.phone_value`.
- To **add a language**: create `locales/xx.json`, add `'xx'` to `SUPPORTED_LANGS` in `middleware/i18n.js`, add a route and link in the nav.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Templates | express-handlebars (Handlebars.js) |
| Email | Nodemailer |
| Animations | GSAP 3 + ScrollTrigger |
| Fonts | Google Fonts (Barlow Condensed, Barlow, IBM Plex Mono) |
| Security | helmet, express-rate-limit, express-validator |
| Dev | nodemon |
