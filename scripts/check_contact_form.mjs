#!/usr/bin/env node
// Build guard: the contact form must POST to the API route that sends email.
//
// History: commit a72cab6 (2026-07-23) switched the form action to
// "/contact-thank-you" while adding Netlify Forms attributes. On Vercel nothing
// intercepts that POST, so the thank-you page rendered normally and every
// inquiry was silently discarded for ~5 weeks. This check fails the build
// instead of letting that ship again.

import { readFile } from "node:fs/promises";

const FORM_PAGE = "src/pages/contact.astro";
const REQUIRED_ACTION = "/api/contact";

const source = await readFile(new URL(`../${FORM_PAGE}`, import.meta.url), "utf8");

const form = source.match(/<form\b[^>]*name=["']contact["'][^>]*>/s);
if (!form) {
  console.error(
    `\n[check:contact-form] Could not find the contact <form> in ${FORM_PAGE}.\n` +
      `The guard cannot verify inquiry delivery. If the form moved, update this check.\n`,
  );
  process.exit(1);
}

const action = form[0].match(/\baction=["']([^"']*)["']/)?.[1];

if (action !== REQUIRED_ACTION) {
  console.error(
    `\n[check:contact-form] Contact form action must be "${REQUIRED_ACTION}", found ${
      action ? `"${action}"` : "no action attribute"
    }.\n\n` +
      `  File: ${FORM_PAGE}\n\n` +
      `Any other value silently breaks inquiry email. The page still returns 200,\n` +
      `so this failure is invisible at runtime. Do not "fix" it by changing this\n` +
      `check. Netlify Forms patterns (action pointing at a success page) do not\n` +
      `work here because this site is deployed on Vercel.\n`,
  );
  process.exit(1);
}

console.log(`[check:contact-form] OK — form posts to ${REQUIRED_ACTION}`);
