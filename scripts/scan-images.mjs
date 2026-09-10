/**
 * Scans public/products/ and public/site/ and writes lib/images.generated.ts.
 *
 * WHY THIS EXISTS
 * Photography arrives as files, not as code changes. This script means adding
 * a photo is exactly one action — drop the file in the right folder — with no
 * editing of lib/products.ts and no risk of a typo pointing at a file that
 * isn't there.
 *
 * It runs automatically before `npm run dev` and `npm run build` (see the
 * `predev` / `prebuild` scripts in package.json), so a newly added file is
 * picked up on the next start. It is also safe to run by hand:
 *
 *     node scripts/scan-images.mjs
 *
 * The generated file is committed so that a fresh clone type-checks before
 * anything has been built.
 *
 * NAMING
 *   public/products/<product-id>.<ext>   → shown for that product
 *   public/site/<name>.<ext>             → referenced by name in page code
 *
 * Product IDs are the `id` values in lib/products.ts, e.g. `egg-tart-4.jpg`.
 * Recognised extensions: .jpg .jpeg .png .webp .avif
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";

/** Image extensions Next.js can optimise. */
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/**
 * Strips image extensions from a filename, repeatedly.
 *
 * Windows File Explorer hides known extensions by default, so renaming
 * `hero.png` to `hero.jpg` in the GUI silently produces `hero.jpg.png`. The
 * intent is unambiguous, so rather than rejecting the file we strip every
 * trailing image extension and use the name underneath.
 *
 * Only image extensions are stripped, so a genuinely dotted name such as
 * `my.product.jpg` still resolves to `my.product`.
 *
 * @param {string} file - The filename, e.g. "hero.jpg.png".
 * @returns {string} The key, e.g. "hero".
 */
function stripImageExtensions(file) {
  let name = file;
  // Bounded loop: two doubled extensions is already pathological.
  for (let i = 0; i < 3; i += 1) {
    const ext = extname(name).toLowerCase();
    if (!EXTENSIONS.has(ext)) break;
    name = basename(name, extname(name));
  }
  return name;
}

/**
 * Lists usable images in a public/ subfolder, keyed by filename without
 * extension.
 *
 * @param {string} folder - Path relative to public/, e.g. "products".
 * @returns {Record<string,string>} Map of key to web path.
 */
function scan(folder) {
  const dir = join(process.cwd(), "public", folder);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return {};
  }

  /** @type {Record<string,string>} */
  const found = {};

  for (const file of readdirSync(dir).sort()) {
    const ext = extname(file).toLowerCase();
    if (!EXTENSIONS.has(ext)) continue;

    const key = stripImageExtensions(file);
    // First match wins, so a .jpg and a .webp of the same name are not
    // ambiguous — the alphabetically first extension is used.
    if (!(key in found)) found[key] = `/${folder}/${file}`;
  }

  return found;
}

/**
 * Reads the product IDs out of lib/products.ts.
 *
 * Parsed with a regular expression rather than imported, so this script stays
 * a plain Node script with no TypeScript loader. The `id:` keys inside the
 * PRODUCTS array are quoted; the `id: string` in the type declaration is not,
 * so it cannot match by accident.
 *
 * @returns {string[]} Every product ID in the catalog.
 */
function readProductIds() {
  const source = readFileSync(join(process.cwd(), "lib", "products.ts"), "utf8");
  return [...source.matchAll(/^\s+id: "([^"]+)",/gm)].map((m) => m[1]);
}

const products = scan("products");
const site = scan("site");

// ── Report mismatches loudly ────────────────────────────────────────────
// A filename that matches no product is the most common mistake by far —
// usually a file left under its original download name. Without this check
// the count above looks correct while nothing actually appears on the site.
const productIds = readProductIds();
const knownSiteNames = ["hero", "about-layers", "about-interior"];

// Files that work but are named oddly — flag them for tidying, not as errors.
const doubled = [...Object.values(products), ...Object.values(site)].filter((path) =>
  /\.(jpe?g|png|webp|avif)\.(jpe?g|png|webp|avif)$/i.test(path),
);
if (doubled.length > 0) {
  console.log(
    `[scan-images] note: ${doubled.length} file(s) have a doubled extension ` +
      `(e.g. "hero.jpg.png") — these still work, but you can tidy them with:\n` +
      `              Get-ChildItem public\\products, public\\site -Filter *.jpg.png | ` +
      `Rename-Item -NewName { $_.Name -replace '\\.jpg\\.png$', '.png' }`,
  );
}

const unmatchedProducts = Object.keys(products).filter((k) => !productIds.includes(k));
const unmatchedSite = Object.keys(site).filter((k) => !knownSiteNames.includes(k));
const missing = productIds.filter((id) => !(id in products));

if (unmatchedProducts.length > 0) {
  console.warn(
    `\n[scan-images] ⚠ ${unmatchedProducts.length} file(s) in public/products/ do not match any product ID,\n` +
      `              so they will NOT appear on the site. Rename them:\n` +
      unmatchedProducts.map((k) => `                ✗ ${products[k]}`).join("\n") +
      `\n\n              Expected names (see public/products/README.md):\n` +
      productIds.map((id) => `                • ${id}.jpg`).join("\n"),
  );
}

if (unmatchedSite.length > 0) {
  console.warn(
    `\n[scan-images] ⚠ ${unmatchedSite.length} file(s) in public/site/ are not used by any page:\n` +
      unmatchedSite.map((k) => `                ✗ ${site[k]}`).join("\n") +
      `\n              Expected: ${knownSiteNames.map((n) => `${n}.jpg`).join(", ")}`,
  );
}

const contents = `// AUTO-GENERATED by scripts/scan-images.mjs — do not edit by hand.
// Regenerate with \`node scripts/scan-images.mjs\`; it also runs automatically
// before \`npm run dev\` and \`npm run build\`.
//
// To add a photo, drop a file into public/products/ or public/site/ and
// restart the dev server. Nothing else needs changing.

/** Product photos found on disk, keyed by product ID. */
export const PRODUCT_IMAGES: Record<string, string> = ${JSON.stringify(products, null, 2)};

/** Site imagery (hero, about page) found on disk, keyed by filename. */
export const SITE_IMAGES: Record<string, string> = ${JSON.stringify(site, null, 2)};
`;

writeFileSync(join(process.cwd(), "lib", "images.generated.ts"), contents, "utf8");

// Report matches, not raw file counts: a file that matches nothing is not a
// photo the site can use, and saying "10 images" about it is misleading.
const matchedProducts = productIds.length - missing.length;
const matchedSite = knownSiteNames.filter((n) => n in site).length;

console.log(
  `[scan-images] ${matchedProducts}/${productIds.length} product photos, ` +
    `${matchedSite}/${knownSiteNames.length} site images` +
    (missing.length > 0 ? ` — ${missing.length} product(s) still using placeholders` : ""),
);
