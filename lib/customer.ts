/**
 * Customer details captured at checkout, and their validation.
 *
 * Validation lives here rather than in the form component so that the *server*
 * is the one enforcing it. Browser-side validation is a convenience for the
 * customer; it can be bypassed, so the API route runs these same functions on
 * whatever actually arrives.
 */

import { CartValidationError } from "./order";
import { getShippingRegion } from "./shipping";

/** Who is ordering and how to reach them. */
export type CustomerDetails = {
  name: string;
  /** Phonetic reading. Standard on Japanese forms and useful for delivery. */
  nameKana: string;
  email: string;
  phone: string;
};

/** Where a shipped order is going. Absent for pickup-only orders. */
export type ShippingDetails = {
  /** Region ID from lib/shipping.ts — determines the fee. */
  regionId: string;
  /** 7-digit postal code, with or without the hyphen. */
  postalCode: string;
  /** Prefecture, e.g. "東京都". */
  prefecture: string;
  /** City / ward / town and the rest of the address. */
  addressLine: string;
  /** Building name and room number. Optional. */
  building: string;
};

/** When a pickup order will be collected. Absent for shipping-only orders. */
export type PickupDetails = {
  /** Collection date as "YYYY-MM-DD". */
  date: string;
};

/** Everything the checkout form submits, alongside the cart lines. */
export type CheckoutDetails = {
  customer: CustomerDetails;
  shipping: ShippingDetails | null;
  pickup: PickupDetails | null;
  /** Free-text note — gift message, allergy question, delivery instruction. */
  note: string;
};

/** Minimum days' notice required for a store pickup order. */
export const PICKUP_LEAD_DAYS = 3;

/**
 * Loose email check.
 *
 * Deliberately permissive: the only reliable test of an address is sending
 * mail to it, and over-strict patterns reject valid addresses. This catches
 * typos and empty submissions, which is all it is for.
 *
 * @param email - Candidate address.
 * @returns True if it is plausibly an email address.
 */
function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Checks a Japanese phone number.
 *
 * Accepts digits with optional hyphens, 10 or 11 digits total, which covers
 * both landline (03-xxxx-xxxx) and mobile (090-xxxx-xxxx) formats.
 *
 * @param phone - Candidate phone number.
 * @returns True if it has a plausible number of digits.
 */
function looksLikePhone(phone: string): boolean {
  const digits = phone.replace(/[-\s]/g, "");
  return /^\d{10,11}$/.test(digits);
}

/**
 * Checks a Japanese postal code (7 digits, hyphen optional).
 *
 * @param code - Candidate postal code.
 * @returns True if it is 7 digits.
 */
function looksLikePostalCode(code: string): boolean {
  return /^\d{3}-?\d{4}$/.test(code.trim());
}

/**
 * Returns the earliest date a pickup order may be collected, as "YYYY-MM-DD".
 *
 * Exposed so the form can set the date input's `min` attribute to the same
 * value the server enforces.
 *
 * @returns The earliest allowed pickup date.
 */
export function earliestPickupDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + PICKUP_LEAD_DAYS);
  return date.toISOString().slice(0, 10);
}

/**
 * Validates and normalises checkout details.
 *
 * Trims every string (so a name of spaces is caught) and only requires the
 * shipping or pickup blocks that the cart's contents actually call for — a
 * pickup-only order must not be blocked for lacking a delivery address.
 *
 * @param input - Untrusted parsed JSON from the request body.
 * @param requiresShipping - True if the cart contains shipped items.
 * @param requiresPickup - True if the cart contains store-pickup items.
 * @returns Normalised, validated details.
 * @throws {CartValidationError} with a customer-facing Japanese message.
 */
export function validateCheckoutDetails(
  input: unknown,
  requiresShipping: boolean,
  requiresPickup: boolean,
): CheckoutDetails {
  if (typeof input !== "object" || input === null) {
    throw new CartValidationError("ご注文内容の形式が正しくありません。");
  }

  const body = input as Record<string, unknown>;
  const rawCustomer = (body.customer ?? {}) as Record<string, unknown>;

  /**
   * Pulls a trimmed string out of an untrusted object.
   *
   * @param source - The object to read from.
   * @param key - The property name.
   * @returns The trimmed value, or an empty string if absent/not a string.
   */
  const str = (source: Record<string, unknown>, key: string): string =>
    typeof source[key] === "string" ? (source[key] as string).trim() : "";

  const customer: CustomerDetails = {
    name: str(rawCustomer, "name"),
    nameKana: str(rawCustomer, "nameKana"),
    email: str(rawCustomer, "email"),
    phone: str(rawCustomer, "phone"),
  };

  if (!customer.name) {
    throw new CartValidationError("お名前をご入力ください。");
  }
  if (!looksLikeEmail(customer.email)) {
    throw new CartValidationError("メールアドレスをご確認ください。");
  }
  if (!looksLikePhone(customer.phone)) {
    throw new CartValidationError(
      "電話番号をご確認ください。ハイフンなしの10桁または11桁でご入力ください。",
    );
  }

  let shipping: ShippingDetails | null = null;

  if (requiresShipping) {
    const raw = (body.shipping ?? {}) as Record<string, unknown>;
    const regionId = str(raw, "regionId");

    // Cross-check against the fee table: an unknown region would otherwise
    // reach calculateShippingFee and throw a less helpful error.
    if (!getShippingRegion(regionId)) {
      throw new CartValidationError("配送先の地域をお選びください。");
    }

    const postalCode = str(raw, "postalCode");
    if (!looksLikePostalCode(postalCode)) {
      throw new CartValidationError("郵便番号を7桁でご入力ください。");
    }

    const prefecture = str(raw, "prefecture");
    const addressLine = str(raw, "addressLine");
    if (!prefecture || !addressLine) {
      throw new CartValidationError("お届け先のご住所をご入力ください。");
    }

    shipping = {
      regionId,
      postalCode,
      prefecture,
      addressLine,
      building: str(raw, "building"),
    };
  }

  let pickup: PickupDetails | null = null;

  if (requiresPickup) {
    const raw = (body.pickup ?? {}) as Record<string, unknown>;
    const date = str(raw, "date");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new CartValidationError("お受け取り日をお選びください。");
    }
    // String comparison is safe here because both sides are ISO "YYYY-MM-DD",
    // which sorts identically as text and as dates.
    if (date < earliestPickupDate()) {
      throw new CartValidationError(
        `お受け取り日は${PICKUP_LEAD_DAYS}日後以降をお選びください。`,
      );
    }

    pickup = { date };
  }

  // Cap the note so an oversized payload cannot be used to bloat stored
  // orders or the metadata we forward to KOMOJU.
  const note = str(body, "note").slice(0, 500);

  return { customer, shipping, pickup, note };
}
