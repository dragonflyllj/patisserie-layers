"use client";

/**
 * Quantity stepper plus "add to cart" button on the product detail page.
 *
 * The only interactive island on an otherwise static product page, so it is
 * kept deliberately small — the surrounding page stays a server component.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { MAX_LINE_QUANTITY } from "@/lib/order";
import type { Product } from "@/lib/products";

export function AddToCartForm({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  /** Shows a short confirmation after adding, instead of navigating away. */
  const [justAdded, setJustAdded] = useState(false);

  if (!product.available) {
    return (
      <p className="mt-8 rounded-sm border border-sold/30 bg-sold/5 px-5 py-4 text-sm text-sold">
        申し訳ありません。こちらの商品は現在売り切れです。
      </p>
    );
  }

  /**
   * Adds the chosen quantity and surfaces a confirmation.
   * The message auto-clears so the button returns to its normal state.
   */
  function handleAdd() {
    addItem(product.id, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2500);
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center rounded-full border border-line bg-paper">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-11 h-11 text-lg disabled:opacity-30"
            aria-label="数量を1つ減らす"
          >
            −
          </button>
          <span
            className="w-10 text-center text-sm tabular-nums"
            aria-live="polite"
            aria-label={`数量 ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity((q) => Math.min(MAX_LINE_QUANTITY, q + 1))
            }
            disabled={quantity >= MAX_LINE_QUANTITY}
            className="w-11 h-11 text-lg disabled:opacity-30"
            aria-label="数量を1つ増やす"
          >
            ＋
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 min-w-45 rounded-full bg-ink text-cream px-8 py-3.5 text-sm hover:bg-accent-deep transition-colors"
        >
          カートに入れる
        </button>
      </div>

      {/*
        role="status" makes screen readers announce the confirmation without
        stealing focus from the button the customer just pressed.
      */}
      {justAdded && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-sm bg-accent/10 px-5 py-3 text-sm"
        >
          <span>カートに追加しました。</span>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="text-accent hover:text-accent-deep border-b border-accent/40"
          >
            カートを見る →
          </button>
        </div>
      )}
    </div>
  );
}
