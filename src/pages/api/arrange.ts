import type { APIRoute } from "astro";
import { CATEGORIES, getGallery, saveOrder, type Category } from "../../lib/gallery";

export const prerender = false;

function isCategory(s: unknown): s is Category {
  return typeof s === "string" && (CATEGORIES as string[]).includes(s);
}

export const GET: APIRoute = ({ url }) => {
  const cat = url.searchParams.get("category");
  if (!isCategory(cat)) {
    return new Response(JSON.stringify({ error: "bad category" }), { status: 400 });
  }
  const state = getGallery(cat);
  // Strip the leading "/images/{cat}/" so the UI works with bare filenames
  const prefix = `/images/${cat}/`;
  return new Response(
    JSON.stringify({
      category: cat,
      visible: state.visible.map((p) => p.slice(prefix.length)),
      hidden: state.hidden.map((p) => p.slice(prefix.length)),
      files: state.files,
    }),
    { headers: { "content-type": "application/json" } }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body || !isCategory(body.category) || !Array.isArray(body.order) || !Array.isArray(body.hidden)) {
    return new Response(JSON.stringify({ error: "bad payload" }), { status: 400 });
  }
  try {
    const saved = saveOrder(body.category, body.order, body.hidden);
    return new Response(JSON.stringify({ ok: true, saved }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
