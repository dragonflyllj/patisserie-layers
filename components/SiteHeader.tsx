"use client";

/**
 * Sticky site header: logotype, primary navigation and the cart badge.
 *
 * This is a client component because the cart badge subscribes to cart state.
 * It is small and self-contained, so nothing else on the page is forced into
 * the client bundle as a result.
 */

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { SHOP } from "@/lib/shop";

/** Primary navigation entries, in display order. */
const NAV_LINKS = [
  { href: "/shop", label: "オンラインショップ" },
  { href: "/about", label: "レイヤーズについて" },
  { href: "/#instagram", label: "Instagram" },
  { href: "/access", label: "店舗案内" },
];

export function SiteHeader() {
  const { itemCount, hydrated } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-5 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="min-w-0 leading-tight">
          <span className="font-display block text-[15px] sm:text-xl tracking-[0.08em] sm:tracking-[0.2em] text-ink whitespace-nowrap">
            {SHOP.name}
          </span>
          <span className="block text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.18em] text-muted whitespace-nowrap">
            {SHOP.nameJa}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-ink/80 hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 sm:px-4 py-2 text-[13px] whitespace-nowrap hover:border-accent transition-colors"
            aria-label={`カート（${hydrated ? itemCount : 0}点）`}
          >
            <span aria-hidden>🛒</span>
            <span className="hidden sm:inline">カート</span>
            {/*
              Render the count only after hydration. Before that the server
              rendered an empty cart, and showing a number here would produce
              a hydration mismatch warning.
            */}
            {hydrated && itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-accent text-paper text-[11px] font-medium grid place-items-center">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="lg:hidden rounded-full border border-line bg-paper px-3 py-2 text-[13px] whitespace-nowrap"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            // The visible label is an icon on narrow screens, so give the
            // button an explicit accessible name at every width.
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            {/* Below `sm` there is not enough room for the word beside the
                logotype, so the label collapses to an icon. */}
            <span className="sm:hidden" aria-hidden>
              {menuOpen ? "✕" : "☰"}
            </span>
            <span className="hidden sm:inline" aria-hidden>
              {menuOpen ? "閉じる" : "メニュー"}
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="lg:hidden border-t border-line bg-paper px-5 py-3"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm border-b border-line/60 last:border-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
