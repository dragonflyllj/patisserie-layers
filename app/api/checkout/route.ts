/**
 * POST /api/checkout — turns a cart into a KOMOJU payment session.
 *
 * This is the trust boundary of the whole shop. Everything arriving here is
 * attacker-controlled, so the route:
 *
 *   1. Accepts only product IDs and quantities from the cart — never prices.
 *   2. Re-prices the entire order from the server-side catalog.
 *   3. Re-validates the customer details the browser already checked.
 *   4. Sends the *server's* total to KOMOJU.
 *
 * A customer editing localStorage, or POSTing here directly with a forged
 * total, changes nothing about what they are charged.
 */

import { NextResponse } from "next/server";
import {
  CartValidationError,
  parseCartLines,
  priceOrder,
} from "@/lib/order";
import { validateCheckoutDetails } from "@/lib/customer";
import {
  createCheckoutSession,
  generateOrderReference,
} from "@/lib/komoju";
import { createPendingOrder } from "@/lib/orders";
import { SITE_URL } from "@/lib/shop";

/**
 * Payments must never be prerendered or cached — this route has to run per
 * request, on the server, every time.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Parse separately from the rest: a malformed body is a bad request
    // (400), not a server fault, and should not fall into the 500 handler.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new CartValidationError("ご注文内容の形式が正しくありません。");
    }

    if (typeof body !== "object" || body === null) {
      throw new CartValidationError("ご注文内容の形式が正しくありません。");
    }

    const payload = body as Record<string, unknown>;

    // ── 1. Re-price the cart from the catalog ────────────────────────────
    // The client sends only {productId, quantity}. Everything monetary is
    // derived here.
    const lines = parseCartLines(payload.lines);
    const regionId =
      typeof payload.shipping === "object" && payload.shipping !== null
        ? String(
            (payload.shipping as Record<string, unknown>).regionId ?? "",
          ) || null
        : null;

    const priced = priceOrder(lines, regionId);

    // Defence in depth. validateCheckoutDetails below also requires a valid
    // region whenever the cart ships, but this makes the money-side invariant
    // explicit: never charge a total whose shipping fee is a placeholder.
    if (priced.requiresShipping && !priced.shippingFeeKnown) {
      throw new CartValidationError("配送先の地域をお選びください。");
    }

    // ── 2. Validate the customer details ────────────────────────────────
    const details = validateCheckoutDetails(
      payload,
      priced.requiresShipping,
      priced.requiresPickup,
    );

    // ── 3. Create the payment session ───────────────────────────────────
    const reference = generateOrderReference();

    const session = await createCheckoutSession({
      // The server's total, not anything the client sent.
      amount: priced.total,
      returnUrl: `${SITE_URL}/checkout/complete?ref=${encodeURIComponent(reference)}`,
      orderReference: reference,
      email: details.customer.email,
      metadata: {
        order_reference: reference,
        customer_name: details.customer.name,
        fulfillment: priced.requiresShipping
          ? priced.requiresPickup
            ? "mixed"
            : "shipping"
          : "pickup",
        ...(details.pickup ? { pickup_date: details.pickup.date } : {}),
      },
    });

    // ── 4. Record the order before handing off to KOMOJU ─────────────────
    await createPendingOrder(reference, session.id, priced, details);

    return NextResponse.json({
      redirectUrl: session.session_url,
      reference,
    });
  } catch (error) {
    // Validation problems are the customer's to fix, so their (Japanese)
    // message is returned as-is with a 400.
    if (error instanceof CartValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Anything else is ours. Log the detail server-side, but return a generic
    // message — API errors can carry internal detail that should not be
    // shown to customers.
    console.error("[checkout] unexpected failure:", error);
    return NextResponse.json(
      {
        error:
          "決済ページの準備中にエラーが発生しました。お手数ですが、しばらくしてからもう一度お試しください。",
      },
      { status: 500 },
    );
  }
}
