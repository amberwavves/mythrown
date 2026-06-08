import fs from "node:fs";
import path from "node:path";

export type Category = "commercial" | "residential" | "shop" | "about";

export const CATEGORIES: Category[] = ["commercial", "residential", "shop", "about"];

const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;

function publicDir(category: Category) {
  return path.resolve("./public/images", category);
}

function orderFile(category: Category) {
  return path.join(publicDir(category), "order.json");
}

function listOnDisk(category: Category): string[] {
  const dir = publicDir(category);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => IMG_RE.test(f)).sort();
}

interface OrderFile {
  order: string[];
  hidden?: string[];
}

function loadOrder(category: Category): OrderFile {
  const f = orderFile(category);
  if (!fs.existsSync(f)) return { order: [], hidden: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    return {
      order: Array.isArray(raw.order) ? raw.order : [],
      hidden: Array.isArray(raw.hidden) ? raw.hidden : [],
    };
  } catch {
    return { order: [], hidden: [] };
  }
}

export interface GalleryState {
  visible: string[]; // ordered list of /images/{cat}/{file}
  hidden: string[];
  files: string[]; // all files on disk (filename only)
}

export function getGallery(category: Category): GalleryState {
  const onDisk = listOnDisk(category);
  const { order, hidden = [] } = loadOrder(category);
  const onDiskSet = new Set(onDisk);
  const hiddenSet = new Set(hidden.filter((h) => onDiskSet.has(h)));

  // Start with saved order, dropping any files that no longer exist
  const ordered = order.filter((f) => onDiskSet.has(f));
  const seen = new Set(ordered);
  // Append any new files not yet in the manifest (at the end)
  for (const f of onDisk) if (!seen.has(f)) ordered.push(f);

  const visible = ordered
    .filter((f) => !hiddenSet.has(f))
    .map((f) => `/images/${category}/${f}`);
  const hiddenList = ordered
    .filter((f) => hiddenSet.has(f))
    .map((f) => `/images/${category}/${f}`);

  return { visible, hidden: hiddenList, files: onDisk };
}

export function saveOrder(category: Category, order: string[], hidden: string[]) {
  const dir = publicDir(category);
  if (!fs.existsSync(dir)) throw new Error(`No such category: ${category}`);
  const onDisk = new Set(listOnDisk(category));
  const cleanOrder = order.filter((f) => onDisk.has(f));
  const cleanHidden = hidden.filter((f) => onDisk.has(f));
  const payload = { order: cleanOrder, hidden: cleanHidden };
  fs.writeFileSync(orderFile(category), JSON.stringify(payload, null, 2), "utf-8");
  return payload;
}
