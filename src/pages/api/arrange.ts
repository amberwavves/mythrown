import type { APIRoute } from "astro";

export const prerender = false;

const CATEGORIES = ["commercial", "residential", "shop", "about", "renderings"] as const;
type Category = (typeof CATEGORIES)[number];

function isCategory(s: unknown): s is Category {
  return typeof s === "string" && (CATEGORIES as string[]).includes(s);
}

export const GET: APIRoute = async ({ url }) => {
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: "Not available in production" }), { status: 404 });
  }
  const cat = url.searchParams.get("category");
  if (!isCategory(cat)) {
    return new Response(JSON.stringify({ error: "bad category" }), { status: 400 });
  }
  const { getGallery } = await import("../../lib/gallery");
  const state = getGallery(cat);
  // Strip the leading "/images/{cat}/" so the UI works with bare filenames
  const prefix = `/images/${cat}/`;
  return new Response(
    JSON.stringify({
      category: cat,
      visible: state.visible.map((p) => p.slice(prefix.length)),
      hidden: state.hidden.map((p) => p.slice(prefix.length)),
      files: state.files,
      crop: state.crop,
    }),
    { headers: { "content-type": "application/json" } }
  );
};

export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: "Not available in production" }), { status: 404 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !isCategory(body.category) || !Array.isArray(body.order) || !Array.isArray(body.hidden)) {
    return new Response(JSON.stringify({ error: "bad payload" }), { status: 400 });
  }
  const crop = body.crop ?? {};
  if (typeof crop !== "object" || crop === null || Array.isArray(crop)) {
    return new Response(JSON.stringify({ error: "bad crop payload" }), { status: 400 });
  }
  try {
    const { saveOrder } = await import("../../lib/gallery");
    const saved = saveOrder(body.category, body.order, body.hidden, crop as Record<string, any>);
    return new Response(JSON.stringify({ ok: true, saved }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
