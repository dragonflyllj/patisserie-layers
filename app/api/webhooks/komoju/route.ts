/**
 * POST /api/webhooks/komoju — KOMOJU payment notifications.
 *
 * This is how the shop learns that money actually arrived. The customer
 * returning to the site is not proof of payment (they can close the tab, or
 * simply visit the return URL); this webhook is.
 *
 * ⚠️ SECURITY: this endpoint is publicly reachable, so every request is
 * treated as hostile until its HMAC signature verifies. Nothing is written,
 * and no email is sent, before that check passes.
 *
 * ── SETUP ────────────────────────────────────────────────────────────────
 * In the KOMOJU dashboard → Webhooks, add:
 *     https://<your-domain>/api/webhooks/komoju
 * and copy the signing secret into KOMOJU_WEBHOOK_SECRET.
 *
 * Note that `konbini` payments settle *later* — the customer pays at a
 * convenience store hours or days after checkout. That order stays `pending`
 * until this webhook fires, which is correct and not a bug.
 */

import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/komoju";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** KOMOJU event types that mean money was successfully taken. */
const SUCCESS_EVENTS = new Set(["payment.captured", "payment.authorized"]);

/** Event types that mean the payment will not complete. */
const FAILURE_EVENTS = new Set([
  "payment.failed",
  "payment.cancelled",
  "payment.expired",
]);

export async function POST(request: Request) {
  const secret = process.env.KOMOJU_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[komoju:webhook] KOMOJU_WEBHOOK_SECRET is not set.");
    // 500, not 400: the request may well be valid — we are the ones
    // misconfigured, and KOMOJU should retry once that is fixed.
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  // Read the body as raw text. It must be hashed exactly as received —
  // parsing and re-serialising it would reorder keys and break the signature.
  const rawBody = await request.text();
  const signature = request.headers.get("x-komoju-signature");

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    console.warn("[komoju:webhook] rejected request with invalid signature.");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: { id?: string; external_order_num?: string; status?: string };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = event.type ?? "unknown";
  const reference = event.data?.external_order_num;
  const sessionId = event.data?.id ?? "";

  if (!reference) {
    // Nothing to correlate against. Acknowledge so KOMOJU stops retrying —
    // retrying will not make a reference appear.
    console.warn(`[komoju:webhook] "${eventType}" carried no order reference.`);
    return NextResponse.json({ received: true });
  }

  if (SUCCESS_EVENTS.has(eventType)) {
    await markOrderPaid(reference, sessionId);
  } else if (FAILURE_EVENTS.has(eventType)) {
    await markOrderFailed(reference, eventType);
  } else {
    console.info(`[komoju:webhook] ignoring event type "${eventType}".`);
  }

  // Always 200 once the signature is valid. A non-2xx makes KOMOJU retry, and
  // there is nothing to gain by retrying an event we have already handled or
  // deliberately ignored.
  return NextResponse.json({ received: true });
}
