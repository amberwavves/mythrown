# mythrown

Local rebuild of mythrown.com — Astro 5 + Tailwind 4.

## Run locally
```powershell
cd mythrown
npm install
npm run dev
```
Then open the URL printed in the terminal (usually http://localhost:4321).

## Build
```powershell
npm run build
npm run preview
```

## Inquiry Delivery Hardening
The contact form posts to `/api/contact` and now supports:
- Provider failover between Gmail SMTP and Resend.
- Multiple recipients and optional BCC archive mailbox.
- Optional webhook mirroring to store every lead payload outside email.

Set these environment variables in your hosting provider:

- `CONTACT_TO`
: Comma-separated recipient emails. Example: `amber@mythrown.com,ops@mythrown.com`
- `CONTACT_BCC`
: Optional comma-separated archive inboxes for backup copies.
- `EMAIL_PROVIDER_PREFERENCE`
: `gmail` (default) or `resend`.
- `GMAIL_USER` and `GMAIL_APP_PASSWORD`
: Gmail SMTP credentials.
- `RESEND_API_KEY`
: Resend API key (used as fallback or primary based on preference).
- `CONTACT_FROM`
: Optional Resend from value. Default is onboarding sender.
- `INQUIRY_BACKUP_WEBHOOK_URL`
: Optional webhook endpoint to mirror every accepted inquiry payload.

Recommended minimum for "never miss a lead":
1. Configure both Gmail and Resend so one can fail over to the other.
2. Set `CONTACT_TO` to at least two inboxes.
3. Set `CONTACT_BCC` to a separate archive mailbox.
4. Set `INQUIRY_BACKUP_WEBHOOK_URL` to a durable store (Zapier/Make -> Airtable, Google Sheets, or database).

## Structure
- `src/pages/` — one file per page (routes)
- `src/layouts/Base.astro` — shared HTML shell
- `src/components/` — Nav, Footer, reusable blocks
- `src/styles/global.css` — Tailwind entry + theme tokens
- `public/` — static assets (favicon, images you don't process)
