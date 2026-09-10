"use client";

/**
 * Empties the cart once, on mount.
 *
 * Rendered only on the order-completion page, so the customer does not return
 * to the shop still holding the items they just bought. It renders nothing.
 *
 * This is separate from the completion page itself so that page can stay a
 * server component (it needs the KOMOJU secret key to confirm the payment,
 * which must never reach the browser).
 */

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

export function ClearCartOnMount() {
  const { clear, hydrated } = useCart();

  useEffect(() => {
    // Wait for hydration: clearing before the stored cart has been read would
    // be immediately undone when it loads.
    if (hydrated) clear();
  }, [hydrated, clear]);

  return null;
}
