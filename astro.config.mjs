import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  output: 'server',
  // Astro's built-in checkOrigin compares the browser Origin header against the
  // reconstructed request URL. On Vercel's serverless runtime the internal
  // request is http:// while the browser Origin is https://, so every form POST
  // is wrongly rejected as "cross-site" (403). We disable it here and enforce a
  // protocol-agnostic origin allowlist ourselves in src/pages/api/contact.ts.
  security: {
    checkOrigin: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
