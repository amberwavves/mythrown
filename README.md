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

## Structure
- `src/pages/` — one file per page (routes)
- `src/layouts/Base.astro` — shared HTML shell
- `src/components/` — Nav, Footer, reusable blocks
- `src/styles/global.css` — Tailwind entry + theme tokens
- `public/` — static assets (favicon, images you don't process)
