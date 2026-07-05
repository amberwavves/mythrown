import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const prerender = false;

const CONTACT_TO = import.meta.env.CONTACT_TO || "amber@mythrown.com";
const MAX_FIELD = 200;
const MAX_MESSAGE = 5000;

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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string,
  );
}

function field(data: FormData, name: string, max = MAX_FIELD): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const POST: APIRoute = async ({ request, redirect }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Honeypot: bots fill this hidden field. Pretend success and discard.
  if (field(data, "bot-field")) {
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
    return redirect("/contact?error=invalid", 303);
  }

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

  try {
    if (GMAIL_USER && GMAIL_APP_PASSWORD) {
      // --- Gmail SMTP (Google Workspace) ---
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: `THROWN Website <${GMAIL_USER}>`,
        to: CONTACT_TO,
        replyTo: email,
        subject,
        html,
      });
    } else if (RESEND_API_KEY) {
      // --- Resend ---
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [CONTACT_TO],
          reply_to: email,
          subject,
          html,
        }),
      });
      if (!res.ok) {
        console.error("Resend API error:", res.status, await res.text().catch(() => ""));
        return redirect("/contact?error=send", 303);
      }
    } else {
      console.error("No email provider configured (set GMAIL_USER+GMAIL_APP_PASSWORD or RESEND_API_KEY).");
      return redirect("/contact?error=send", 303);
    }
  } catch (err) {
    console.error("Contact email failed to send:", err);
    return redirect("/contact?error=send", 303);
  }

  return redirect("/contact-thank-you", 303);
};
