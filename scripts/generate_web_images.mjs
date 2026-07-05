// Generates web-optimized WebP variants for all images under public/images/<category>/
// Output:
//   public/images/<category>/_web/<basename>.webp   (max 1200px wide — gallery grids)
//   public/images/<category>/_full/<basename>.webp  (max 2000px wide — lightbox / click-through)
//
// Run after adding new images: node scripts/generate_web_images.mjs
// Pages fall back to the original file if a variant is missing, so this is safe
// to run incrementally (already up-to-date variants are skipped).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("./public/images");
// "." processes root-level images in public/images (e.g. statue.png)
const CATS = [".", "commercial", "residential", "shop", "about", "renderings"];
const IMG_RE = /\.(jpe?g|png|webp)$/i;

const VARIANTS = [
  { dir: "_web", width: 1200, quality: 78 },
  { dir: "_full", width: 2000, quality: 82 },
];

let totalMade = 0;
let totalSkipped = 0;

async function processCategory(cat) {
  const dir = path.join(ROOT, cat);
  if (!fs.existsSync(dir)) return;

  for (const variant of VARIANTS) {
    fs.mkdirSync(path.join(dir, variant.dir), { recursive: true });
  }

  const files = fs.readdirSync(dir).filter((f) => IMG_RE.test(f) && fs.statSync(path.join(dir, f)).isFile());
  for (const f of files) {
    const src = path.join(dir, f);
    for (const { dir: vdir, width, quality } of VARIANTS) {
      const out = path.join(dir, vdir, path.parse(f).name + ".webp");
      try {
        if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) {
          totalSkipped++;
          continue;
        }
        await sharp(src)
          .rotate() // respect EXIF orientation
          .resize({ width, withoutEnlargement: true })
          .webp({ quality })
          .toFile(out);
        totalMade++;
      } catch (e) {
        console.error("ERR", cat, f, e.message);
      }
    }
  }
  console.log(`${cat}: done`);
}

for (const c of CATS) await processCategory(c);
console.log(`Generated ${totalMade}, up-to-date ${totalSkipped}.`);
