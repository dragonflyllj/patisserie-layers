/**
 * Domestic shipping fees.
 *
 * Japanese couriers price by destination region, so the customer picks their
 * prefecture group at checkout. Like prices, the fee is recalculated on the
 * server at charge time — the client's choice of region is validated against
 * this table and never trusted as a number.
 *
 * ⚠️ CONFIRM — these are typical 宅急便 rates for a small parcel from Tokyo,
 * not a quote from your courier. Replace with your contracted rates.
 */

/** A shipping destination group. */
export type ShippingRegion = {
  /** Stable key stored on the order and sent by the checkout form. */
  id: string;
  /** Label shown in the region dropdown. */
  label: string;
  /** Fee in whole yen, tax included. */
  fee: number;
};

export const SHIPPING_REGIONS: ShippingRegion[] = [
  { id: "kanto", label: "関東（東京・神奈川・千葉・埼玉・茨城・栃木・群馬・山梨）", fee: 800 },
  { id: "shinetsu", label: "信越・北陸・東海", fee: 900 },
  { id: "kansai", label: "関西", fee: 1000 },
  { id: "tohoku", label: "東北", fee: 1000 },
  { id: "chugoku", label: "中国", fee: 1200 },
  { id: "shikoku", label: "四国", fee: 1200 },
  { id: "kyushu", label: "九州", fee: 1400 },
  { id: "hokkaido", label: "北海道", fee: 1500 },
  { id: "okinawa", label: "沖縄", fee: 2000 },
];

/**
 * Order subtotal at or above which shipping is free.
 * Set to null to disable free shipping entirely.
 */
export const FREE_SHIPPING_THRESHOLD: number | null = 10000;

/**
 * Resolves a region ID sent by the client into a known region.
 *
 * Returning undefined for an unrecognised ID is deliberate: the checkout API
 * treats that as a validation failure rather than silently charging ¥0.
 *
 * @param id - The region ID submitted by the checkout form.
 * @returns The matching region, or undefined if the ID is not in the table.
 */
export function getShippingRegion(id: string): ShippingRegion | undefined {
  return SHIPPING_REGIONS.find((r) => r.id === id);
}

/**
 * Calculates the shipping fee for an order.
 *
 * Three outcomes, and the difference between them matters:
 *   - `0`    — nothing to ship, or the free-shipping threshold was met.
 *   - `null` — something is being shipped but no destination has been chosen
 *              yet. This is the normal state of the cart page, so it is not
 *              an error; the caller shows the fee as "to be calculated".
 *   - throws — a region ID was supplied but is not in the table. That means
 *              a forged or stale value, and it must never quietly become a
 *              free delivery.
 *
 * @param regionId - Destination region ID, or null if none chosen.
 * @param shippableSubtotal - Subtotal of the shipped items only, in yen.
 *        Pickup-only items must be excluded, since they never enter a parcel.
 * @returns The fee in yen, or null when it cannot be known yet.
 * @throws Error when a region ID is given but not recognised.
 */
export function calculateShippingFee(
  regionId: string | null,
  shippableSubtotal: number,
): number | null {
  // Nothing to ship (pickup-only order): no fee, and no region required.
  if (shippableSubtotal <= 0) return 0;

  // Destination not chosen yet — knowable later, not wrong now.
  if (!regionId) return null;

  const region = getShippingRegion(regionId);
  if (!region) {
    throw new Error(`不明な配送地域です: ${regionId}`);
  }

  if (
    FREE_SHIPPING_THRESHOLD !== null &&
    shippableSubtotal >= FREE_SHIPPING_THRESHOLD
  ) {
    return 0;
  }

  return region.fee;
}
