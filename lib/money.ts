/**
 * Money helpers.
 *
 * All amounts in this codebase are integer **yen**, never floats. JPY has no
 * minor unit, so 1200 means ¥1,200 exactly — this avoids the rounding errors
 * that come from representing money as a decimal, and it is also the format
 * KOMOJU's API expects for the `amount` field.
 */

/**
 * Formats an integer yen amount for display, e.g. 1200 → "¥1,200".
 *
 * @param yen - Amount in whole yen.
 * @returns The amount with a yen sign and thousands separators.
 */
export function formatYen(yen: number): string {
  return `¥${Math.round(yen).toLocaleString("ja-JP")}`;
}

/**
 * Japanese consumption tax rates.
 *
 * Food sold for takeout falls under the 8% reduced rate (軽減税率); shipping
 * is a service and is taxed at the standard 10%. We store catalog prices
 * tax-inclusive because Japanese law (総額表示義務) requires consumer-facing
 * prices to be shown with tax included.
 */
export const TAX_RATE = {
  /** Reduced rate applied to food products. */
  food: 0.08,
  /** Standard rate applied to the shipping fee. */
  standard: 0.1,
} as const;

/**
 * Extracts the tax portion already baked into a tax-inclusive price.
 *
 * Used only to print the "うち消費税" line on receipts and the order summary;
 * it never changes the amount actually charged.
 *
 * @param taxIncludedYen - The displayed, tax-inclusive amount.
 * @param rate - The applicable rate, from {@link TAX_RATE}.
 * @returns The included tax, rounded to the nearest yen.
 */
export function includedTax(taxIncludedYen: number, rate: number): number {
  return Math.round(taxIncludedYen - taxIncludedYen / (1 + rate));
}
