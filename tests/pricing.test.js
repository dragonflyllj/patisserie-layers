/**
 * Unit tests for the pricing engine — the code that decides what a customer
 * is charged, and the single most security-sensitive part of the shop.
 *
 * Run with `npm test`. That first compiles the relevant lib/ modules to
 * .test-build/ (they use only relative imports, so they run standalone
 * outside Next.js), then runs this file with Node's built-in test runner —
 * no test framework dependency needed.
 *
 * If you change prices, shipping rates or the free-shipping threshold in
 * lib/, the expected values here need updating too. That is deliberate: it
 * makes an accidental pricing change fail loudly.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { priceOrder, parseCartLines, CartValidationError } = require("../.test-build/order.js");
const { getProduct } = require("../.test-build/products.js");

const FINANCIER = getProduct("financier-8");   // 2160, shipping
const EGG_TART  = getProduct("egg-tart-4");    // 1180, pickup

test("prices a single shipped line from the catalog", () => {
  const o = priceOrder([{ productId: "financier-8", quantity: 2 }], "kanto");
  assert.equal(o.subtotal, FINANCIER.price * 2);
  assert.equal(o.shippingFee, 800);
  assert.equal(o.total, FINANCIER.price * 2 + 800);
  assert.equal(o.requiresShipping, true);
  assert.equal(o.requiresPickup, false);
});

test("pickup-only orders need no region and pay no shipping", () => {
  const o = priceOrder([{ productId: "egg-tart-4", quantity: 1 }], null);
  assert.equal(o.shippingFee, 0);
  assert.equal(o.total, EGG_TART.price);
  assert.equal(o.requiresShipping, false);
  assert.equal(o.requiresPickup, true);
});

test("mixed cart requires both, and shipping applies only to shipped items", () => {
  const o = priceOrder(
    [{ productId: "financier-8", quantity: 1 }, { productId: "egg-tart-4", quantity: 1 }],
    "okinawa",
  );
  assert.equal(o.shippableSubtotal, FINANCIER.price);
  assert.equal(o.pickupSubtotal, EGG_TART.price);
  assert.equal(o.shippingFee, 2000);
  assert.equal(o.requiresShipping && o.requiresPickup, true);
});

test("free shipping kicks in at the threshold, on shipped subtotal only", () => {
  // 5 x 2160 = 10800 >= 10000 threshold
  const free = priceOrder([{ productId: "financier-8", quantity: 5 }], "hokkaido");
  assert.equal(free.shippingFee, 0);
  // 4 x 2160 = 8640 < 10000
  const paid = priceOrder([{ productId: "financier-8", quantity: 4 }], "hokkaido");
  assert.equal(paid.shippingFee, 1500);
});

test("a client-supplied price is ignored entirely", () => {
  // Simulates a tampered cart claiming the item costs 1 yen.
  const tampered = [{ productId: "financier-8", quantity: 1, price: 1, lineTotal: 1 }];
  const o = priceOrder(tampered, "kanto");
  assert.equal(o.subtotal, FINANCIER.price, "server must re-read price from catalog");
  assert.equal(o.total, FINANCIER.price + 800);
  assert.equal(o.shippingFeeKnown, true);
});

test("rejects unknown products", () => {
  assert.throws(
    () => priceOrder([{ productId: "not-a-real-product", quantity: 1 }], "kanto"),
    CartValidationError,
  );
});

test("rejects invalid quantities", () => {
  for (const q of [0, -3, 1.5, 999, NaN, Infinity]) {
    assert.throws(
      () => priceOrder([{ productId: "financier-8", quantity: q }], "kanto"),
      CartValidationError,
      `quantity ${q} should be rejected`,
    );
  }
});

test("rejects an empty cart", () => {
  assert.throws(() => priceOrder([], "kanto"), CartValidationError);
});

test("rejects an unknown shipping region instead of charging zero", () => {
  assert.throws(
    () => priceOrder([{ productId: "financier-8", quantity: 1 }], "atlantis"),
    CartValidationError,
  );
});

test("a not-yet-chosen region is priceable for display, but not chargeable", () => {
  // The cart page prices the order before any destination is known. That must
  // render, not throw — but it must be clearly marked as an incomplete total,
  // so the checkout API can refuse to charge it.
  const o = priceOrder([{ productId: "financier-8", quantity: 1 }], null);
  assert.equal(o.shippingFeeKnown, false, "fee must be flagged as not yet known");
  assert.equal(o.shippingFee, 0);
  assert.equal(o.total, FINANCIER.price, "total excludes shipping until a region is chosen");
  assert.equal(o.requiresShipping, true, "and the order still needs shipping");
});

test("a chosen region makes the fee known", () => {
  const o = priceOrder([{ productId: "financier-8", quantity: 1 }], "kanto");
  assert.equal(o.shippingFeeKnown, true);
});

test("pickup-only orders have a known (zero) fee with no region", () => {
  const o = priceOrder([{ productId: "egg-tart-4", quantity: 1 }], null);
  assert.equal(o.shippingFeeKnown, true, "nothing to ship, so the fee is known to be zero");
  assert.equal(o.shippingFee, 0);
});

test("parseCartLines rejects malformed payloads", () => {
  for (const bad of ["nope", 42, null, [{ productId: 1, quantity: 1 }], [{ productId: "x" }]]) {
    assert.throws(() => parseCartLines(bad), CartValidationError);
  }
});

test("included tax is computed at the reduced 8% rate on food", () => {
  const o = priceOrder([{ productId: "financier-8", quantity: 1 }], "kanto");
  // 2160 tax-inclusive at 8% => 160 yen of tax; 800 shipping at 10% => 73.
  assert.equal(o.includedTaxTotal, 160 + 73);
});
