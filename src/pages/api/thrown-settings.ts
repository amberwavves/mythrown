import type { APIRoute } from "astro";
import { loadThrownSettings, saveThrownSettings, type ThrownSettings } from "../../lib/thrown-settings";

export const prerender = false;

export const GET: APIRoute = () => {
  const settings = loadThrownSettings();
  return new Response(JSON.stringify(settings), {
    headers: { "content-type": "application/json" },
  });
};

function isThrownSettings(value: unknown): value is ThrownSettings {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray((value as any).rows) &&
    (value as any).rows.length === 3
  );
}

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json().catch(() => null);
  if (!isThrownSettings(payload)) {
    return new Response(JSON.stringify({ error: "invalid settings payload" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const saved = saveThrownSettings(payload);
    return new Response(JSON.stringify({ ok: true, saved }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
