// Generates 400px-wide WebP thumbnails for all images under public/images/<category>/
// Output: public/images/<category>/_thumbs/<basename>.webp
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("./public/images");
const CATS = ["commercial", "residential", "shop", "about"];
const IMG_RE = /\.(jpe?g|png|webp)$/i;

async function processCategory(cat) {
  const dir = path.join(ROOT, cat);
  if (!fs.existsSync(dir)) return;
  const thumbsDir = path.join(dir, "_thumbs");
  fs.mkdirSync(thumbsDir, { recursive: true });

  const files = fs.readdirSync(dir).filter((f) => IMG_RE.test(f));
  let made = 0, skipped = 0;
  for (const f of files) {
    const src = path.join(dir, f);
    const out = path.join(thumbsDir, path.parse(f).name + ".webp");
    try {
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) {
        skipped++;
        continue;
      }
      await sharp(src).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 70 }).toFile(out);
      made++;
    } catch (e) {
      console.error("ERR", f, e.message);
    }
  }
  console.log(`${cat}: ${made} generated, ${skipped} up-to-date`);
}

for (const c of CATS) await processCategory(c);
console.log("Done.");
