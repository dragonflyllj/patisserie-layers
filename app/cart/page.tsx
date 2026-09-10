"use client";

/**
 * Cart page.
 *
 * A client component, because the cart lives in the browser. Totals shown here
 * come from the same `priceOrder` used by the server at charge time, so the
 * figures the customer reviews are the figures they pay — but note that this
 * page's numbers are for *display only*; the server recomputes them.
 */

import Link from "next/link";
import { useMemo } from "react";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/lib/cart";
import { CartValidationError, MAX_LINE_QUANTITY, priceOrder } from "@/lib/order";
import { FULFILLMENT_LABELS } from "@/lib/products";
import { formatYen } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from "@/lib/komoju";

export default function CartPage() {
  const { lines, hydrated, setQuantity, removeItem } = useCart();

  /**
   * Prices the cart for display. Shipping is passed as null because no
   * destination has been chosen yet; priceOrder handles that by leaving
   * `shippingFeeKnown` false rather than erroring, so the subtotal still
   * renders. The try/catch is for a genuinely invalid cart (a delisted
   * product, say), which shows an explanation instead of crashing.
   */
  const priced = useMemo(() => {
    if (lines.length === 0) return null;
    try {
      return priceOrder(lines, null);
    } catch (error) {
      return error instanceof CartValidationError ? error : null;
    }
  }, [lines]);

  // Before hydration the cart is always empty, so render nothing rather than
  // flashing "your cart is empty" at someone who has items.
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24">
        <p className="text-sm text-muted">読み込み中…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h1 className="font-display text-2xl">カートは空です</h1>
        <p className="text-sm text-muted mt-4">
          オンラインショップから商品をお選びください。
        </p>
        <Link
          href="/shop"
          className="inline-block mt-10 rounded-full bg-ink text-cream px-8 py-3.5 text-sm hover:bg-accent-deep transition-colors"
        >
          商品を見る
        </Link>
      </div>
    );
  }

  if (priced instanceof CartValidationError) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h1 className="font-display text-2xl">カートを確認してください</h1>
        <p className="text-sm text-sold mt-4">{priced.message}</p>
        <Link
          href="/shop"
          className="inline-block mt-10 rounded-full bg-ink text-cream px-8 py-3.5 text-sm"
        >
          商品を見る
        </Link>
      </div>
    );
  }

  if (!priced) return null;

  const remainingForFreeShipping =
    FREE_SHIPPING_THRESHOLD !== null && priced.requiresShipping
      ? FREE_SHIPPING_THRESHOLD - priced.shippableSubtotal
      : 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-display text-3xl">カート</h1>

      <ul className="mt-12 border-t border-line">
        {priced.lines.map((line) => (
          <li
            key={line.product.id}
            className="flex gap-5 py-6 border-b border-line"
          >
            <Link href={`/shop/${line.product.id}`} className="shrink-0">
              <ProductImage
                product={line.product}
                className="w-24 h-24 rounded-sm"
                sizes="96px"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/shop/${line.product.id}`}
                className="font-display text-[15px] hover:text-accent"
              >
                {line.product.name}
              </Link>
              <p className="text-[11px] text-muted mt-1">
                {FULFILLMENT_LABELS[line.product.fulfillment]}　単価{" "}
                {formatYen(line.product.price)}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="inline-flex items-center rounded-full border border-line bg-paper">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(line.product.id, line.quantity - 1)
                    }
                    className="w-9 h-9 text-base"
                    aria-label={`${line.product.name}の数量を減らす`}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(line.product.id, line.quantity + 1)
                    }
                    disabled={line.quantity >= MAX_LINE_QUANTITY}
                    className="w-9 h-9 text-base disabled:opacity-30"
                    aria-label={`${line.product.name}の数量を増やす`}
                  >
                    ＋
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(line.product.id)}
                  className="text-xs text-muted hover:text-sold"
                >
                  削除
                </button>
              </div>
            </div>

            <p className="text-sm tabular-nums shrink-0">
              {formatYen(line.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_18rem]">
        <div className="text-xs text-muted leading-relaxed space-y-3 order-2 md:order-1">
          {priced.requiresPickup && (
            <p>
              ※ 「店頭お受け取り」の商品が含まれています。ご希望のお受け取り日は、次のお手続きでご指定ください。
            </p>
          )}
          {priced.requiresShipping && remainingForFreeShipping > 0 && (
            <p>
              ※ 配送商品をあと{formatYen(remainingForFreeShipping)}
              分お買い上げで送料無料になります。
            </p>
          )}
          <p>
            ※ 送料は次のお手続きで、お届け先の地域に応じて計算されます。
          </p>
          <p className="pt-2">
            お支払い方法：
            {PAYMENT_TYPES.map((type) => PAYMENT_TYPE_LABELS[type]).join("・")}
          </p>
        </div>

        <div className="order-1 md:order-2 rounded-sm border border-line bg-paper p-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted">小計</span>
            <span className="tabular-nums">{formatYen(priced.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mt-3">
            <span className="text-muted">送料</span>
            <span className="text-xs text-muted">次の画面で計算</span>
          </div>
          <div className="flex justify-between items-baseline mt-5 pt-5 border-t border-line">
            <span className="text-sm">合計</span>
            <span className="font-display text-xl tabular-nums">
              {formatYen(priced.subtotal)}
              <span className="text-[10px] text-muted ml-1.5">税込</span>
            </span>
          </div>

          <Link
            href="/checkout"
            className="block text-center mt-6 rounded-full bg-ink text-cream px-6 py-3.5 text-sm hover:bg-accent-deep transition-colors"
          >
            お客様情報の入力へ
          </Link>
          <Link
            href="/shop"
            className="block text-center mt-3 text-xs text-muted hover:text-accent"
          >
            買い物を続ける
          </Link>
        </div>
      </div>
    </div>
  );
}
