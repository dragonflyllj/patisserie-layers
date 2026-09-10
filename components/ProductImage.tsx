/**
 * Product imagery, with a designed fallback.
 *
 * Real photography is not in the repository yet, so a product whose `image`
 * is null renders a warm tonal placeholder carrying its Latin name instead of
 * a broken image or a grey box. Drop a square JPEG at
 * `public/products/<id>.jpg`, point `image` at it in lib/products.ts, and the
 * photo replaces the placeholder with no other changes.
 */

import Image from "next/image";
import type { Product } from "@/lib/products";

/**
 * Pairs of background tones used to tint placeholders.
 * Chosen to stay within the site's warm palette so a catalog page of
 * placeholders still looks deliberate.
 */
const PLACEHOLDER_TONES = [
  ["#EFE4D6", "#E2D0BB"],
  ["#EDE3DA", "#DCC9B8"],
  ["#F1E8DC", "#DFCDB6"],
  ["#EAE0D4", "#D8C4AC"],
];

/**
 * Picks a placeholder tone deterministically from the product ID.
 *
 * Deterministic rather than random so a product keeps the same tone between
 * the server render and the client render, and between page loads.
 *
 * @param id - The product ID.
 * @returns A [from, to] pair of hex colours for the gradient.
 */
function toneFor(id: string): string[] {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PLACEHOLDER_TONES[hash % PLACEHOLDER_TONES.length];
}

type Props = {
  product: Product;
  /** Applied to the wrapper; use it to set the aspect ratio. */
  className?: string;
  /**
   * Marks the image as high-priority so Next preloads it. Set this only for
   * images visible without scrolling (the hero, the first catalog row).
   */
  priority?: boolean;
  /** Responsive `sizes` hint, so the browser downloads the right resolution. */
  sizes?: string;
};

export function ProductImage({
  product,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: Props) {
  if (product.image) {
    return (
      <div className={`relative overflow-hidden bg-line/40 ${className}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  const [from, to] = toneFor(product.id);

  return (
    <div
      className={`relative overflow-hidden grid place-items-center ${className}`}
      style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}
      // Decorative stand-in, not a photo of the product: hide it from screen
      // readers, since the product name is always rendered as text alongside.
      role="presentation"
    >
      <span className="font-display text-center px-6 text-ink/45 tracking-[0.18em] text-sm">
        {product.nameLatin}
      </span>
    </div>
  );
}
