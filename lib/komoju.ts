import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * KOMOJU payment integration.
 *
 * KOMOJU is a Japanese payment service provider. We use its **Hosted Page**
 * (Sessions) flow: we create a session server-side, redirect the customer to
 * KOMOJU's own payment page, and they come back to us afterwards.
 *
 * ── WHY HOSTED, NOT INLINE ───────────────────────────────────────────────
 * Card numbers never touch this server or this codebase. That keeps the shop
 * out of PCI-DSS scope almost entirely (SAQ A rather than SAQ A-EP/D), which
 * is a very large difference in compliance burden for a small business. Do
 * not "improve" this later by collecting card fields yourself.
 *
 * ── PAYMENT METHODS ──────────────────────────────────────────────────────
 * Credit card plus the Japanese QR wallets and konbini. Which of these are
 * actually available depends on what is enabled on your KOMOJU merchant
 * account — anything not enabled simply will not appear on the payment page.
 *
 * ⚠️ NOT VERIFIED AGAINST A LIVE API. The build environment blocks outbound
 * requests to komoju.com, so this client was written from KOMOJU's documented
 * API shape and type-checked, but no real call was made. Before launch:
 *   1. Run one test-mode purchase end to end (see README).
 *   2. Compare the request/response shape below against the current docs at
 *      https://docs.komoju.com/ and adjust here if anything has moved.
 * Everything KOMOJU-specific is contained in this one file to make that easy.
 */

/** KOMOJU API root. */
const API_BASE = "https://komoju.com/api/v1";

/**
 * Payment methods offered on the hosted page, in display order.
 *
 * `credit_card` covers Visa / Mastercard / JCB / AMEX / Diners.
 * The rest are Japanese QR wallets, plus konbini for customers who prefer
 * to pay in cash at a convenience store.
 */
export const PAYMENT_TYPES = [
  "credit_card",
  "paypay",
  "linepay",
  "merpay",
  "aupay",
  "rakutenpay",
  "konbini",
] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

/** Customer-facing labels, used to show accepted methods before checkout. */
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  credit_card: "クレジットカード",
  paypay: "PayPay",
  linepay: "LINE Pay",
  merpay: "メルペイ",
  aupay: "au PAY",
  rakutenpay: "楽天ペイ",
  konbini: "コンビニ決済",
};

/** The subset of the session object we rely on. */
export type KomojuSession = {
  id: string;
  /** URL to redirect the customer to. This is the payment page. */
  session_url: string;
  status: string;
  amount: number;
  currency: string;
};

/** Parameters for {@link createCheckoutSession}. */
export type CreateSessionParams = {
  /** Total to charge, in whole yen. Must be the server-computed total. */
  amount: number;
  /** Where KOMOJU sends the customer after payment. Must be absolute. */
  returnUrl: string;
  /** Our own order reference, echoed back on the webhook. */
  orderReference: string;
  /** Customer email, so KOMOJU can send its own receipt. */
  email: string;
  /** Arbitrary key/values stored on the payment and returned by the webhook. */
  metadata?: Record<string, string>;
};

/**
 * Reads the KOMOJU secret key from the environment.
 *
 * Isolated in a function (rather than a module-level constant) so that the
 * absence of a key surfaces as a clear runtime error on the checkout request,
 * rather than crashing the whole server at import time — the rest of the site
 * should stay up even if payments are misconfigured.
 *
 * @returns The secret key.
 * @throws Error if the key is not configured.
 */
function getSecretKey(): string {
  const key = process.env.KOMOJU_SECRET_KEY;
  if (!key) {
    throw new Error(
      "KOMOJU_SECRET_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  return key;
}

/**
 * Builds the HTTP Basic auth header KOMOJU expects.
 *
 * KOMOJU authenticates with the secret key as the username and an empty
 * password — note the trailing colon, which is required.
 *
 * @returns The value for the Authorization header.
 */
function authHeader(): string {
  const encoded = Buffer.from(`${getSecretKey()}:`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Creates a hosted payment session and returns where to send the customer.
 *
 * The `amount` passed here must always come from the server-side pricing in
 * lib/order.ts. Passing a client-supplied total would let a customer choose
 * their own price.
 *
 * @param params - Session parameters.
 * @returns The created session, including the URL to redirect to.
 * @throws Error if the key is missing or KOMOJU rejects the request. The
 *         message is safe to log but should not be shown verbatim to
 *         customers, as it may contain API detail.
 */
export async function createCheckoutSession(
  params: CreateSessionParams,
): Promise<KomojuSession> {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // KOMOJU expects JPY as a whole-yen integer (no minor unit).
      amount: params.amount,
      currency: "JPY",
      return_url: params.returnUrl,
      default_locale: "ja",
      payment_types: PAYMENT_TYPES,
      email: params.email,
      external_order_num: params.orderReference,
      metadata: params.metadata ?? {},
    }),
    // Never cache a payment session: each one is single-use.
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `KOMOJU session creation failed (${response.status}): ${body.slice(0, 500)}`,
    );
  }

  const session = (await response.json()) as KomojuSession;

  if (!session.session_url) {
    throw new Error("KOMOJU response did not include a session_url.");
  }

  return session;
}

/**
 * Fetches a session by ID, to confirm its real status.
 *
 * Used on the completion page: the customer arriving back at `return_url` is
 * *not* proof that they paid — they could simply navigate to that URL. This
 * asks KOMOJU directly.
 *
 * @param sessionId - The session ID.
 * @returns The session, or null if it cannot be retrieved.
 */
export async function retrieveSession(
  sessionId: string,
): Promise<KomojuSession | null> {
  try {
    const response = await fetch(
      `${API_BASE}/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: authHeader() },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      console.error(`[komoju] session retrieve failed (${response.status})`);
      return null;
    }
    return (await response.json()) as KomojuSession;
  } catch (error) {
    console.error("[komoju] session retrieve threw:", error);
    return null;
  }
}

/**
 * Verifies the HMAC signature on an incoming webhook.
 *
 * ⚠️ SECURITY-CRITICAL. The webhook endpoint is a public URL: anyone can POST
 * to it claiming an order was paid. This signature is the only thing that
 * distinguishes a genuine KOMOJU callback from a forged one. Never process a
 * webhook whose signature has not verified.
 *
 * The comparison uses `timingSafeEqual` rather than `===` so that an attacker
 * cannot recover the expected signature byte-by-byte by measuring how long
 * the comparison takes.
 *
 * @param rawBody - The request body as the exact bytes received. It must NOT
 *        be re-serialised from parsed JSON: any difference in key order or
 *        whitespace changes the hash and would fail a valid webhook.
 * @param signature - Value of the `X-Komoju-Signature` header.
 * @param secret - The webhook secret from your KOMOJU dashboard.
 * @returns True only if the signature is valid.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");

  // timingSafeEqual throws if the lengths differ, so check that first —
  // a length mismatch already means the signature is invalid.
  if (received.length !== computed.length) return false;

  return timingSafeEqual(received, computed);
}

/**
 * Generates a human-readable order reference, e.g. "LY-20260910-4F2A9C".
 *
 * Shown to the customer, quoted in emails, and sent to KOMOJU as
 * `external_order_num` so a payment can be traced back to an order. The random
 * suffix uses `crypto.randomUUID` rather than `Math.random` so references
 * cannot be guessed or enumerated.
 *
 * @returns A new order reference.
 */
export function generateOrderReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `LY-${date}-${suffix}`;
}
