/**
 * Product detail page.
 *
 * Statically generated for every catalog entry via `generateStaticParams`, so
 * each product page is served as pre-rendered HTML.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartForm } from "@/components/AddToCartForm";
import {
  CATEGORY_LABELS,
  FULFILLMENT_LABELS,
  PRODUCTS,
  getProduct,
} from "@/lib/products";
import { formatYen } from "@/lib/money";
import { SHOP } from "@/lib/shop";

/**
 * Tells Next which product pages to pre-render at build time.
 *
 * @returns One params object per catalog product.
 */
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

/**
 * Per-product page metadata, so shared links show the right title.
 *
 * @param params - Route params containing the product ID.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) return { title: "商品が見つかりません" };

  return {
    title: product.name,
    description: product.summary,
    openGraph: {
      title: `${product.name} | ${SHOP.name}`,
      description: product.summary,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);

  // Renders the 404 page for an unknown ID rather than throwing.
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <nav className="text-xs text-muted mb-10" aria-label="パンくずリスト">
        <Link href="/shop" className="hover:text-accent">
          オンラインショップ
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <ProductImage
          product={product}
          priority
          className="aspect-square rounded-sm"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        <div>
          <p className="eyebrow">{product.nameLatin}</p>
          <h1 className="font-display text-2xl sm:text-3xl mt-3 leading-snug">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 mt-6">
            <span className="font-display text-2xl">
              {formatYen(product.price)}
            </span>
            <span className="text-xs text-muted">税込</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <span className="text-[11px] border border-line rounded-full px-3 py-1">
              {CATEGORY_LABELS[product.category]}
            </span>
            <span className="text-[11px] border border-accent/40 text-accent rounded-full px-3 py-1">
              {FULFILLMENT_LABELS[product.fulfillment]}
            </span>
          </div>

          <p className="text-sm text-ink/80 mt-8 leading-loose">
            {product.description}
          </p>

          <AddToCartForm product={product} />

          {/* Food-labelling details. Expected on Japanese food listings. */}
          <dl className="mt-12 border-t border-line text-sm">
            <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 border-b border-line">
              <dt className="text-muted text-xs pt-1">特定原材料</dt>
              <dd className="leading-relaxed">
                {product.allergens.join("・")}
                <span className="block text-xs text-muted mt-1">
                  同一工場内で、えび・かに・そば・落花生を含む製品を製造しています。
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 border-b border-line">
              <dt className="text-muted text-xs pt-1">保存方法・賞味期限</dt>
              <dd className="leading-relaxed">{product.storage}</dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 border-b border-line">
              <dt className="text-muted text-xs pt-1">お届け方法</dt>
              <dd className="leading-relaxed">
                {product.fulfillment === "shipping"
                  ? "ご注文日から3〜5営業日以内に発送いたします。"
                  : "店頭でのお受け取りのみとなります。ご希望のお受け取り日をご注文時にご指定ください。"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
