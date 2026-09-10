/**
 * Online shop — the full product catalog.
 *
 * Category filtering is driven by a URL search param rather than client state,
 * which keeps the page a pure server component (no JS shipped), makes each
 * filtered view linkable and shareable, and lets the browser Back button work
 * as expected.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORY_LABELS, PRODUCTS, type Product } from "@/lib/products";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { formatYen } from "@/lib/money";

export const metadata: Metadata = {
  title: "オンラインショップ",
  description:
    "焼き菓子の全国配送と、生ケーキの店頭お受け取りのご予約を承ります。クレジットカード・PayPay・コンビニ決済がご利用いただけます。",
};

/** The filter tabs, in display order. `null` means "show everything". */
const FILTERS: { key: Product["category"] | null; label: string }[] = [
  { key: null, label: "すべて" },
  { key: "yakigashi", label: CATEGORY_LABELS.yakigashi },
  { key: "namagashi", label: CATEGORY_LABELS.namagashi },
  { key: "gift", label: CATEGORY_LABELS.gift },
];

/**
 * Validates the `category` search param against the known categories.
 *
 * An unknown value falls back to "show everything" rather than an empty page,
 * so a mistyped or stale URL still renders something useful.
 *
 * @param raw - The raw search param value.
 * @returns A valid category, or null for no filter.
 */
function resolveCategory(raw: string | undefined): Product["category"] | null {
  if (!raw) return null;
  return raw in CATEGORY_LABELS ? (raw as Product["category"]) : null;
}

export default async function ShopPage({
  searchParams,
}: {
  // Next 15+ passes searchParams as a Promise.
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const active = resolveCategory(rawCategory);

  const products = active
    ? PRODUCTS.filter((p) => p.category === active)
    : PRODUCTS;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="eyebrow">Online Shop</p>
      <h1 className="font-display text-3xl sm:text-4xl mt-3">オンラインショップ</h1>
      <p className="text-sm text-muted mt-5 max-w-xl leading-loose">
        焼き菓子は全国へ配送いたします。生ケーキは鮮度の都合で、店頭でのお受け取りのみとさせていただいております。
        {FREE_SHIPPING_THRESHOLD !== null && (
          <>
            <br />
            配送商品の小計が{formatYen(FREE_SHIPPING_THRESHOLD)}以上で送料無料です。
          </>
        )}
      </p>

      {/* Filter tabs. Plain links — no client-side state involved. */}
      <nav className="flex flex-wrap gap-2 mt-10 mb-12" aria-label="商品カテゴリ">
        {FILTERS.map((filter) => {
          const isActive = active === filter.key;
          const href = filter.key ? `/shop?category=${filter.key}` : "/shop";
          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "rounded-full bg-ink text-cream px-5 py-2 text-[13px]"
                  : "rounded-full border border-line bg-paper px-5 py-2 text-[13px] hover:border-accent transition-colors"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted py-16 text-center">
          このカテゴリの商品は現在ございません。
        </p>
      )}
    </div>
  );
}
