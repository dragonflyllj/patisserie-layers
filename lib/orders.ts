/**
 * Order records.
 *
 * ⚠️ NOT PRODUCTION-READY STORAGE — READ THIS BEFORE GOING LIVE.
 *
 * This module currently keeps orders in a module-level Map and logs them to
 * the server console. That is enough to develop and test the whole payment
 * flow, but it is NOT durable:
 *
 *   - The Map is lost on every deploy, restart, and scale-to-zero.
 *   - On serverless hosting (Vercel, Netlify Functions) the checkout request
 *     and the KOMOJU webhook may run in *different* instances, so the webhook
 *     will often not find the order the checkout just wrote.
 *
 * Payments will still be taken correctly — KOMOJU is the system of record for
 * money, and every order is also written to the server log, so nothing is
 * actually lost. But you cannot run a shop off log lines.
 *
 * BEFORE LAUNCH, replace the two functions below with real persistence.
 * Everything else in the app talks to this module and nothing else, so it is
 * the only file that needs to change. Reasonable options:
 *   - Postgres (Supabase / Neon) with a `orders` table
 *   - Vercel KV / Upstash Redis for something lighter
 *   - Even a Google Sheet via its API, if that suits how the shop works
 *
 * Whatever you choose, also decide how the kitchen gets *told* about an order:
 * an email on `markOrderPaid` is the usual minimum. See the TODO there.
 */

import type { CheckoutDetails } from "./customer";
import type { PricedOrder } from "./order";

/** Lifecycle of an order. */
export type OrderStatus =
  /** Created, customer sent to KOMOJU, not yet paid. */
  | "pending"
  /** KOMOJU confirmed payment. This is when the kitchen should act. */
  | "paid"
  /** Payment failed, expired, or was cancelled. */
  | "failed";

export type OrderRecord = {
  /** Our reference, e.g. "LY-20260910-4F2A9C". */
  reference: string;
  /** KOMOJU session ID, for reconciling against their dashboard. */
  sessionId: string;
  status: OrderStatus;
  /** Total charged, in yen — the server-computed figure. */
  total: number;
  /** Flattened line items, kept so the record stands alone if the catalog changes. */
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  shippingFee: number;
  details: CheckoutDetails;
  createdAt: string;
  paidAt: string | null;
};

/**
 * In-memory store. See the file header — replace this.
 * Keyed by order reference.
 */
const orders = new Map<string, OrderRecord>();

/**
 * Records a new order in `pending` state, before the customer is redirected
 * to KOMOJU.
 *
 * Writing the order *before* payment (rather than only on the webhook) means
 * that if the webhook is delayed or dropped, there is still a record showing
 * what the customer intended to buy, which can be reconciled by hand against
 * the KOMOJU dashboard.
 *
 * @param reference - Order reference from `generateOrderReference`.
 * @param sessionId - The KOMOJU session ID.
 * @param priced - The server-computed order.
 * @param details - Validated customer details.
 * @returns The stored record.
 */
export async function createPendingOrder(
  reference: string,
  sessionId: string,
  priced: PricedOrder,
  details: CheckoutDetails,
): Promise<OrderRecord> {
  const record: OrderRecord = {
    reference,
    sessionId,
    status: "pending",
    total: priced.total,
    items: priced.lines.map((line) => ({
      productId: line.product.id,
      name: line.product.name,
      quantity: line.quantity,
      unitPrice: line.product.price,
    })),
    shippingFee: priced.shippingFee,
    details,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };

  orders.set(reference, record);

  // The durable trail until real storage is wired up. Deliberately one line
  // of JSON so it can be grepped out of a log drain and replayed if needed.
  console.info(`[order:pending] ${JSON.stringify(record)}`);

  return record;
}

/**
 * Marks an order paid. Called from the KOMOJU webhook, and only after the
 * webhook signature has been verified.
 *
 * Idempotent: KOMOJU retries webhooks, and the same event may arrive more than
 * once. Re-marking an already-paid order is a no-op rather than a duplicate,
 * which matters because this is where order-confirmation side effects belong.
 *
 * @param reference - The order reference echoed back by KOMOJU.
 * @param sessionId - The KOMOJU session ID, for the log trail.
 * @returns The updated record, or null if the reference is unknown (expected
 *          on serverless with the in-memory store — see the file header).
 */
export async function markOrderPaid(
  reference: string,
  sessionId: string,
): Promise<OrderRecord | null> {
  const record = orders.get(reference);

  if (!record) {
    console.warn(
      `[order:paid] no local record for ${reference} (session ${sessionId}). ` +
        "Expected if using the in-memory store on serverless — reconcile from the KOMOJU dashboard.",
    );
    return null;
  }

  if (record.status === "paid") {
    console.info(`[order:paid] ${reference} already marked paid, ignoring retry.`);
    return record;
  }

  record.status = "paid";
  record.paidAt = new Date().toISOString();
  orders.set(reference, record);

  console.info(`[order:paid] ${JSON.stringify(record)}`);

  // TODO(before launch): notify the shop that an order is ready to make.
  // A transactional email service (Resend, SendGrid, Postmark) sending to
  // SHOP.email is the usual minimum, plus a confirmation to the customer.
  // Do it here, inside the `status !== "paid"` branch, so retried webhooks
  // do not send duplicate emails.

  return record;
}

/**
 * Marks an order failed, cancelled or expired.
 *
 * @param reference - The order reference.
 * @param reason - KOMOJU's event type, kept for the log trail.
 * @returns The updated record, or null if unknown.
 */
export async function markOrderFailed(
  reference: string,
  reason: string,
): Promise<OrderRecord | null> {
  const record = orders.get(reference);
  if (!record) return null;

  // Never walk an order back out of `paid` — a late failure event for an
  // already-captured payment is a reconciliation matter, not an automatic
  // status change.
  if (record.status === "paid") {
    console.warn(
      `[order:failed] ignoring "${reason}" for already-paid order ${reference}.`,
    );
    return record;
  }

  record.status = "failed";
  orders.set(reference, record);
  console.info(`[order:failed] ${reference} (${reason})`);

  return record;
}

/**
 * Looks up an order by reference. Used by the completion page.
 *
 * @param reference - The order reference.
 * @returns The record, or null if not found.
 */
export async function getOrder(reference: string): Promise<OrderRecord | null> {
  return orders.get(reference) ?? null;
}
