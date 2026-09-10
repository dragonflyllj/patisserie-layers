"use client";

/**
 * Client-side shopping cart.
 *
 * The cart lives entirely in the browser and holds nothing but product IDs and
 * quantities. No prices are stored here — they are looked up from the catalog
 * for display and recomputed on the server before charging, so a tampered
 * localStorage entry can change *what* is ordered but never what it costs.
 *
 * ── WHY AN EXTERNAL STORE ────────────────────────────────────────────────
 * localStorage is an external system, and React's sanctioned way to read one
 * during render is `useSyncExternalStore`. It solves three problems at once:
 *
 *   1. Hydration. The server has no localStorage, so `getServerSnapshot`
 *      returns an empty cart; React renders that, then immediately re-renders
 *      with the real client value. No mismatch warning, no effect needed.
 *   2. Sharing. The store is module-level, so every component sees the same
 *      cart without a context provider wrapping the tree.
 *   3. Cross-tab sync. A `storage` event from another tab updates this one,
 *      so a customer with two tabs open does not lose items.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CartLine } from "./order";
import { MAX_LINE_QUANTITY } from "./order";
import { getProduct } from "./products";

/** localStorage key. Versioned so the shape can change without breaking carts. */
const STORAGE_KEY = "layers.cart.v1";

/**
 * Stable empty array.
 *
 * `getSnapshot` must return a referentially-identical value when nothing has
 * changed, or React re-renders forever. A shared constant guarantees that for
 * the empty case.
 */
const EMPTY: readonly CartLine[] = Object.freeze([]);

/** The current cart. Reassigned only by `commit`, never mutated in place. */
let snapshot: readonly CartLine[] = EMPTY;

/** Whether localStorage has been read yet. */
let initialized = false;

/** Components to notify when the cart changes. */
const listeners = new Set<() => void>();

/**
 * Reads and sanitises the persisted cart.
 *
 * Anything unrecognised is discarded rather than repaired: a stale cart
 * referencing a delisted product would otherwise fail validation at checkout
 * with a confusing error, so those lines are dropped here instead.
 *
 * @returns Valid cart lines, or an empty array if nothing usable is stored.
 */
function readStoredCart(): readonly CartLine[] {
  if (typeof window === "undefined") return EMPTY;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const lines = parsed.flatMap((entry): CartLine[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { productId, quantity } = entry as Record<string, unknown>;
      if (typeof productId !== "string") return [];
      if (typeof quantity !== "number" || !Number.isInteger(quantity)) return [];
      // Drop lines for products that no longer exist or are sold out.
      const product = getProduct(productId);
      if (!product || !product.available) return [];
      return [
        { productId, quantity: Math.min(Math.max(quantity, 1), MAX_LINE_QUANTITY) },
      ];
    });

    return lines.length > 0 ? lines : EMPTY;
  } catch {
    // Corrupt JSON, or localStorage blocked (private mode, cookie settings).
    // An empty cart is the correct, non-fatal fallback.
    return EMPTY;
  }
}

/** Reads localStorage once, on first access from the browser. */
function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  snapshot = readStoredCart();
}

/** Re-reads the cart when another tab changes it. */
function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  snapshot = readStoredCart();
  listeners.forEach((listener) => listener());
}

/**
 * Subscribes a component to cart changes.
 *
 * The `storage` listener is attached only while at least one component is
 * subscribed, so nothing is left bound after the last one unmounts.
 *
 * @param listener - Called whenever the cart changes.
 * @returns An unsubscribe function.
 */
function subscribe(listener: () => void): () => void {
  ensureInitialized();
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

/** Current cart in the browser. */
function getSnapshot(): readonly CartLine[] {
  ensureInitialized();
  return snapshot;
}

/** Cart as seen on the server: always empty, since there is no storage there. */
function getServerSnapshot(): readonly CartLine[] {
  return EMPTY;
}

/**
 * Replaces the cart, persists it, and notifies subscribers.
 *
 * @param next - The new cart lines.
 */
function commit(next: CartLine[]): void {
  snapshot = next.length > 0 ? next : EMPTY;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage full or unavailable. The cart still works for this session.
  }

  listeners.forEach((listener) => listener());
}

/** True on the client, false during server render and hydration. */
const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

export type UseCartResult = {
  /** Current cart lines. Empty on the server and during hydration. */
  lines: readonly CartLine[];
  /** Total number of individual items, for the header badge. */
  itemCount: number;
  /**
   * False during server render and hydration, true afterwards. Components use
   * it to avoid flashing "your cart is empty" at someone who has items.
   */
  hydrated: boolean;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

/**
 * Reads and mutates the cart from any client component.
 *
 * No provider is required — the store is module-level.
 *
 * @returns The cart and its mutation functions.
 */
export function useCart(): UseCartResult {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribeNoop, getTrue, getFalse);

  /**
   * Adds a product, merging into the existing line if already present.
   *
   * @param productId - Product to add.
   * @param quantity - How many to add. Defaults to 1.
   */
  const addItem = useCallback((productId: string, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((line) => line.productId === productId);

    if (!existing) {
      commit([
        ...current,
        { productId, quantity: Math.min(quantity, MAX_LINE_QUANTITY) },
      ]);
      return;
    }

    commit(
      current.map((line) =>
        line.productId === productId
          ? {
              ...line,
              quantity: Math.min(line.quantity + quantity, MAX_LINE_QUANTITY),
            }
          : line,
      ),
    );
  }, []);

  /**
   * Sets an exact quantity. Zero or less removes the line, which is what the
   * quantity stepper's "−" button relies on at 1.
   *
   * @param productId - Product to update.
   * @param quantity - Desired quantity.
   */
  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot();

    if (quantity <= 0) {
      commit(current.filter((line) => line.productId !== productId));
      return;
    }

    commit(
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(quantity, MAX_LINE_QUANTITY) }
          : line,
      ),
    );
  }, []);

  /** Removes a line outright, regardless of quantity. */
  const removeItem = useCallback((productId: string) => {
    commit(getSnapshot().filter((line) => line.productId !== productId));
  }, []);

  /** Empties the cart. Called after a payment completes successfully. */
  const clear = useCallback(() => {
    if (getSnapshot().length > 0) commit([]);
  }, []);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  return { lines, itemCount, hydrated, addItem, setQuantity, removeItem, clear };
}
