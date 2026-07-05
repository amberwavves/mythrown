import type { APIRoute } from "astro";

export const prerender = false;

const CONTACT_TO = import.meta.env.CONTACT_TO || "amber@mythrown.com";
// Until mythrown.com is verified in Resend, use their onboarding sender.
const CONTACT_FROM = import.meta.env.CONTACT_FROM || "THROWN Website <onboarding@resend.dev>";
const MAX_FIELD = 200;
const MAX_MESSAGE = 5000;

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

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; contact form email not sent.");
    return redirect("/contact?error=send", 303);
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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: email,
      subject: `THROWN inquiry: ${name}${projectType ? ` — ${projectType}` : ""}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Resend API error:", res.status, await res.text().catch(() => ""));
    return redirect("/contact?error=send", 303);
  }

  return redirect("/contact-thank-you", 303);
};
