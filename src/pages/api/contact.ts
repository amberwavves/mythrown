import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const prerender = false;

const CONTACT_TO = import.meta.env.CONTACT_TO || "amber@mythrown.com";
const CONTACT_BCC = import.meta.env.CONTACT_BCC || "";
const BACKUP_WEBHOOK_URL = import.meta.env.INQUIRY_BACKUP_WEBHOOK_URL || "";
const EMAIL_PROVIDER_PREFERENCE = (import.meta.env.EMAIL_PROVIDER_PREFERENCE || "gmail").toLowerCase();
const MAX_FIELD = 200;
const MAX_MESSAGE = 5000;

// Rate limiting. Generous on purpose: a real person will never trip 5 sends in
// 10 minutes, but a bot hammering this endpoint would burn the Gmail daily send
// quota, after which genuine inquiries stop going out silently — the exact
// failure mode this whole pipeline exists to prevent.
const RATE_LIMIT_MAX = Number(import.meta.env.CONTACT_RATE_LIMIT_MAX || 5);
const RATE_LIMIT_WINDOW_MS = Number(import.meta.env.CONTACT_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const RATE_LIMIT_MAX_TRACKED_IPS = 5000;

// Provider selection:
// - If GMAIL_USER + GMAIL_APP_PASSWORD are set, send via Gmail SMTP (no DNS/domain
//   verification needed; mail comes from the real mailbox).
// - Otherwise, if RESEND_API_KEY is set, send via Resend.
const GMAIL_USER = import.meta.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = import.meta.env.GMAIL_APP_PASSWORD;
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
// From address used by Resend (Gmail always sends from GMAIL_USER).
// Until mythrown.com is verified in Resend, their onboarding sender is used.
const RESEND_FROM = import.meta.env.CONTACT_FROM || "THROWN Website <onboarding@resend.dev>";

// Protocol-agnostic CSRF origin check. We disable Astro's built-in checkOrigin
// (it false-positives on Vercel, where the internal request is http:// but the
// browser Origin is https://) and instead compare only the Origin *host* to an
// allowlist. Requests with no Origin header (e.g. some server-to-server clients)
// are allowed through; bot spam is caught by the honeypot below.
const ALLOWED_HOSTS = new Set(
  (import.meta.env.ALLOWED_ORIGIN_HOSTS || "mythrown.com,www.mythrown.com,mythrown.vercel.app,localhost")
    .split(",")
    .map((h: string) => h.trim().toLowerCase())
    .filter(Boolean),
);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  try {
    return ALLOWED_HOSTS.has(new URL(origin).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string,
  );
}

function field(data: FormData, name: string, max = MAX_FIELD): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function toList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const CONTACT_TO_LIST = toList(CONTACT_TO);
const CONTACT_BCC_LIST = toList(CONTACT_BCC);

// Serverless instances are ephemeral and independent, so this window is
// per-instance and resets on cold start. That trade is deliberate: it costs
// nothing, adds no dependency, and stops the realistic attack (a single client
// hammering the form). Surviving a distributed flood would require shared state
// such as Vercel KV or Upstash Redis.
const submissionLog = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || (request.headers.get("x-real-ip") || "").trim();
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  // Bound memory so a flood of unique IPs cannot grow the map without limit.
  if (submissionLog.size > RATE_LIMIT_MAX_TRACKED_IPS) {
    for (const [key, times] of submissionLog) {
      const fresh = times.filter((t) => t > cutoff);
      if (fresh.length) submissionLog.set(key, fresh);
      else submissionLog.delete(key);
    }
  }

  const hits = (submissionLog.get(ip) || []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT_MAX) {
    submissionLog.set(ip, hits);
    return true;
  }

  hits.push(now);
  submissionLog.set(ip, hits);
  return false;
}

async function mirrorInquiryToWebhook(payload: Record<string, unknown>): Promise<void> {
  if (!BACKUP_WEBHOOK_URL) return;

  // Google Apps Script web apps answer a successful POST with a 302 to
  // script.googleusercontent.com. The handler has already run by that point.
  // Following the redirect would downgrade POST to GET and hit a doGet that
  // does not exist, so a real success would look like a failure. Stop at the
  // redirect and treat 3xx as delivered.
  const res = await fetch(BACKUP_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "manual",
  });

  const delivered = res.ok || (res.status >= 300 && res.status < 400);
  if (!delivered) {
    throw new Error(`Backup webhook responded with ${res.status}`);
  }
}

async function sendViaGmail(subject: string, html: string, replyTo: string): Promise<void> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials not configured");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: `THROWN Website <${GMAIL_USER}>`,
    to: CONTACT_TO_LIST,
    bcc: CONTACT_BCC_LIST.length ? CONTACT_BCC_LIST : undefined,
    replyTo,
    subject,
    html,
  });
}

async function sendViaResend(subject: string, html: string, replyTo: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("Resend API key not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: CONTACT_TO_LIST,
      bcc: CONTACT_BCC_LIST.length ? CONTACT_BCC_LIST : undefined,
      reply_to: replyTo,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${details}`);
  }
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const inquiryId = crypto.randomUUID();
  const origin = request.headers.get("origin");

  // Block genuine cross-site form posts (protocol-agnostic, Vercel-safe).
  if (!isAllowedOrigin(origin)) {
    console.warn(`[contact:${inquiryId}] blocked disallowed origin`, { origin });
    return new Response("Cross-site POST form submissions are forbidden", { status: 403 });
  }

  // Checked before the body is parsed so abusive traffic costs as little as
  // possible. An unrecognised IP fails OPEN: silently dropping a real inquiry is
  // a worse outcome than letting an extra one through.
  const ip = clientIp(request);
  if (ip && isRateLimited(ip)) {
    console.warn(`[contact:${inquiryId}] rate limited`, { ip });
    return redirect("/contact?error=rate", 303);
  }

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    console.warn(`[contact:${inquiryId}] invalid form data payload`);
    return new Response("Bad request", { status: 400 });
  }

  // Honeypot: bots fill this hidden field. Pretend success and discard.
  if (field(data, "bot-field")) {
    console.info(`[contact:${inquiryId}] honeypot triggered; discarded`);
    return redirect("/contact-thank-you", 303);
  }

  const name = field(data, "name");
  const email = field(data, "email");
  const projectType = field(data, "project_type");
  const investment = field(data, "project_investment");
  const timeline = field(data, "timeline");
  const referral = field(data, "referral_source");
  const message = field(data, "message", MAX_MESSAGE);

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn(`[contact:${inquiryId}] validation failed`, {
      hasName: Boolean(name),
      hasEmail: Boolean(email),
      hasMessage: Boolean(message),
    });
    return redirect("/contact?error=invalid", 303);
  }

  console.info(`[contact:${inquiryId}] accepted`, {
    email,
    projectType: projectType || null,
    origin,
  });

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Project Type", projectType],
    ["Investment", investment],
    ["Timeline", timeline],
    ["Heard about us", referral],
  ];

  const html = `
    <h2>New inquiry from mythrown.com</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`)
        .join("")}
    </table>
    <h3>About the project</h3>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  const subject = `THROWN inquiry: ${name}${projectType ? ` — ${projectType}` : ""}`;

  const mirrorPayload = {
    inquiryId,
    receivedAt: new Date().toISOString(),
    name,
    email,
    projectType,
    investment,
    timeline,
    referral,
    message,
    origin,
  };

  try {
    await mirrorInquiryToWebhook(mirrorPayload);
    if (BACKUP_WEBHOOK_URL) {
      console.info(`[contact:${inquiryId}] mirrored to backup webhook`);
    }
  } catch (err) {
    console.error(`[contact:${inquiryId}] backup webhook mirror failed:`, err);
  }

  try {
    if (!CONTACT_TO_LIST.length) {
      console.error(`[contact:${inquiryId}] CONTACT_TO has no valid recipients`);
      return redirect("/contact?error=send", 303);
    }

    const hasGmail = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
    const hasResend = Boolean(RESEND_API_KEY);

    if (!hasGmail && !hasResend) {
      console.error(
        `[contact:${inquiryId}] no email provider configured (set GMAIL_USER+GMAIL_APP_PASSWORD or RESEND_API_KEY).`,
      );
      return redirect("/contact?error=send", 303);
    }

    const tryGmailFirst = EMAIL_PROVIDER_PREFERENCE !== "resend";
    const attempts: Array<{ provider: "gmail" | "resend"; ok: boolean; error?: string }> = [];

    const runAttempt = async (provider: "gmail" | "resend") => {
      try {
        if (provider === "gmail") {
          await sendViaGmail(subject, html, email);
        } else {
          await sendViaResend(subject, html, email);
        }
        attempts.push({ provider, ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attempts.push({ provider, ok: false, error: message });
      }
    };

    const order: Array<"gmail" | "resend"> = tryGmailFirst ? ["gmail", "resend"] : ["resend", "gmail"];

    for (const provider of order) {
      if (provider === "gmail" && !hasGmail) continue;
      if (provider === "resend" && !hasResend) continue;
      await runAttempt(provider);
      const latest = attempts[attempts.length - 1];
      if (latest?.ok) break;
    }

    const success = attempts.find((a) => a.ok);
    if (!success) {
      console.error(`[contact:${inquiryId}] all providers failed`, attempts);
      return redirect("/contact?error=send", 303);
    }

    console.info(`[contact:${inquiryId}] sent`, {
      provider: success.provider,
      attempted: attempts,
      to: CONTACT_TO_LIST,
      bcc: CONTACT_BCC_LIST.length ? CONTACT_BCC_LIST : null,
    });
  } catch (err) {
    console.error(`[contact:${inquiryId}] contact email failed to send:`, err);
    return redirect("/contact?error=send", 303);
  }

  return redirect("/contact-thank-you", 303);
};
