/**
 * Order pricing.
 *
 * This module turns a bare list of {productId, quantity} into a fully priced
 * order. It is deliberately pure and dependency-free so that the *same*
 * function runs in two places:
 *
 *   1. In the browser, to show the customer their running total.
 *   2. On the server, to decide what to actually charge.
 *
 * Sharing one implementation means the displayed total and the charged total
 * cannot drift apart, while the server still derives every yen from the
 * catalog rather than from anything the browser sent.
 */

import { getProduct, PRODUCT_TAX_RATE, type Product } from "./products";
import { calculateShippingFee } from "./shipping";
import { includedTax, TAX_RATE } from "./money";

/** The only order data the client is trusted to send. */
export type CartLine = {
  productId: string;
  quantity: number;
};

/** A cart line resolved against the catalog and priced. */
export type PricedLine = {
  product: Product;
  quantity: number;
  /** unit price × quantity, in yen. */
  lineTotal: number;
};

/** A fully priced order, ready to display or to charge. */
export type PricedOrder = {
  lines: PricedLine[];
  /** Subtotal of every line, in yen. */
  subtotal: number;
  /** Subtotal of shipped items only — what the shipping threshold applies to. */
  shippableSubtotal: number;
  /** Subtotal of store-pickup items only. */
  pickupSubtotal: number;
  shippingFee: number;
  /**
   * False when the cart contains shipped items but no destination has been
   * chosen yet, so `shippingFee` is a placeholder zero rather than a real
   * figure. The cart page uses this to show "calculated at checkout"; the
   * checkout API refuses to charge an order where it is false.
   */
  shippingFeeKnown: boolean;
  /** Grand total actually charged, in yen. */
  total: number;
  /** True when at least one line is shipped, so an address is required. */
  requiresShipping: boolean;
  /** True when at least one line is collected in store, so a date is required. */
  requiresPickup: boolean;
  /** Consumption tax already included in `total`, for the receipt breakdown. */
  includedTaxTotal: number;
};

/** Largest quantity accepted for a single line, to blunt absurd orders. */
export const MAX_LINE_QUANTITY = 20;

/**
 * Thrown when a cart cannot be priced. The message is customer-facing
 * Japanese, so it can be surfaced directly in the checkout UI.
 */
export class CartValidationError extends Error {}

/**
 * Prices a cart against the catalog.
 *
 * Every line is re-resolved from {@link getProduct}; the client's idea of the
 * price is not an input to this function and cannot be. Unknown, unavailable
 * or absurdly-quantified lines raise {@link CartValidationError} rather than
 * being silently dropped, so a customer never gets charged for a cart that
 * differs from the one they reviewed.
 *
 * @param lines - Raw cart lines, typically straight from localStorage or a
 *        request body. Assumed untrusted.
 * A null `regionId` is allowed: the cart page prices an order before any
 * destination is known. In that case `shippingFeeKnown` is false and the
 * total excludes shipping — callers that are about to charge money must
 * check that flag (the checkout API does).
 *
 * @param regionId - Selected shipping region ID, or null if none chosen yet.
 * @returns The priced order.
 * @throws {CartValidationError} if the cart is empty, any line is invalid, or
 *         a region ID was supplied that is not in the shipping table.
 */
export function priceOrder(
  lines: readonly CartLine[],
  regionId: string | null,
): PricedOrder {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new CartValidationError("カートが空です。");
  }

  const priced: PricedLine[] = [];

  for (const line of lines) {
    const product = getProduct(line.productId);

    if (!product) {
      throw new CartValidationError(
        `お取り扱いのない商品が含まれています（${line.productId}）。カートを空にして、もう一度お試しください。`,
      );
    }
    if (!product.available) {
      throw new CartValidationError(
        `「${product.name}」は現在売り切れです。カートから削除してください。`,
      );
    }

    // Quantity must be a whole number in range. Note that Number.isInteger
    // rejects NaN, Infinity and floats, which covers most tampering attempts.
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_LINE_QUANTITY
    ) {
      throw new CartValidationError(
        `「${product.name}」の数量は1〜${MAX_LINE_QUANTITY}の間で指定してください。`,
      );
    }

    priced.push({
      product,
      quantity: line.quantity,
      lineTotal: product.price * line.quantity,
    });
  }

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);

  const shippableSubtotal = priced
    .filter((l) => l.product.fulfillment === "shipping")
    .reduce((sum, l) => sum + l.lineTotal, 0);

  const pickupSubtotal = subtotal - shippableSubtotal;

  const requiresShipping = shippableSubtotal > 0;
  const requiresPickup = pickupSubtotal > 0;

  // calculateShippingFee returns null when a destination has not been chosen
  // yet, and throws only on a region ID that is not in the table. Convert
  // that throw into the customer-facing error type used above.
  let fee: number | null;
  try {
    fee = calculateShippingFee(
      requiresShipping ? regionId : null,
      shippableSubtotal,
    );
  } catch (error) {
    throw new CartValidationError(
      error instanceof Error ? error.message : "配送料を計算できませんでした。",
    );
  }

  const shippingFeeKnown = fee !== null;
  const shippingFee = fee ?? 0;

  const total = subtotal + shippingFee;

  // Products are food (8% reduced rate); shipping is a service (10%).
  const includedTaxTotal =
    includedTax(subtotal, PRODUCT_TAX_RATE) +
    includedTax(shippingFee, TAX_RATE.standard);

  return {
    lines: priced,
    subtotal,
    shippableSubtotal,
    pickupSubtotal,
    shippingFee,
    shippingFeeKnown,
    total,
    requiresShipping,
    requiresPickup,
    includedTaxTotal,
  };
}

/**
 * Normalises an untrusted request body into cart lines.
 *
 * Applied to JSON arriving at the checkout API before it reaches
 * {@link priceOrder}, so that malformed shapes fail with a clear message
 * instead of a type error deep in the pricing logic.
 *
 * @param input - Arbitrary parsed JSON.
 * @returns Well-formed cart lines.
 * @throws {CartValidationError} if the payload is not an array of lines.
 */
export function parseCartLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) {
    throw new CartValidationError("カートの形式が正しくありません。");
  }

  return input.map((raw) => {
    if (typeof raw !== "object" || raw === null) {
      throw new CartValidationError("カートの形式が正しくありません。");
    }
    const { productId, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string" || typeof quantity !== "number") {
      throw new CartValidationError("カートの形式が正しくありません。");
    }
    return { productId, quantity };
  });
}
