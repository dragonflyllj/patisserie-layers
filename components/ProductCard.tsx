/**
 * A single product tile used on the home page and the shop catalog.
 *
 * Server component: it only renders catalog data and a link. The interactive
 * "add to cart" control lives on the product detail page, which keeps the
 * catalog page entirely out of the client bundle.
 */

import Link from "next/link";
import { ProductImage } from "./ProductImage";
import { FULFILLMENT_LABELS, type Product } from "@/lib/products";
import { formatYen } from "@/lib/money";

type Props = {
  product: Product;
  /** Pass true for the first row so those images are preloaded. */
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: Props) {
  return (
    <Link href={`/shop/${product.id}`} className="group block">
      <ProductImage
        product={product}
        priority={priority}
        className="aspect-square rounded-sm"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
      />

      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[15px] leading-snug group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          {!product.available && (
            <span className="shrink-0 text-[11px] text-sold border border-sold/40 rounded-full px-2 py-0.5">
              売切
            </span>
          )}
        </div>

        <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
          {product.summary}
        </p>

        <div className="flex items-baseline gap-3 mt-3">
          <span className="text-sm">{formatYen(product.price)}</span>
          <span className="text-[10px] text-muted">税込</span>
          <span className="ml-auto text-[10px] text-muted border border-line rounded-full px-2 py-0.5">
            {FULFILLMENT_LABELS[product.fulfillment]}
          </span>
        </div>
      </div>
    </Link>
  );
}
