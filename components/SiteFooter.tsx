/**
 * Site footer: shop details, navigation and the legally required links.
 *
 * A server component — it renders static shop data and needs no interactivity.
 */

import Link from "next/link";
import { SHOP } from "@/lib/shop";

/** Legal pages Japanese e-commerce sites are expected (or required) to carry. */
const LEGAL_LINKS = [
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/legal/privacy", label: "プライバシーポリシー" },
  { href: "/legal/terms", label: "ご利用規約" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-lg tracking-[0.2em]">{SHOP.name}</p>
          <p className="text-[11px] tracking-[0.16em] text-muted mt-1">
            {SHOP.nameJa}
          </p>
          <address className="not-italic text-sm text-muted mt-5 leading-relaxed">
            〒{SHOP.postalCode}
            <br />
            {SHOP.address}
            <br />
            {SHOP.access}
            <br />
            <a href={`tel:${SHOP.tel.replace(/-/g, "")}`} className="hover:text-accent">
              TEL {SHOP.tel}
            </a>
          </address>
        </div>

        <div className="text-sm">
          <p className="eyebrow mb-4">Hours</p>
          {SHOP.hours.map((row) => (
            <p key={row.days} className="text-muted">
              {row.days}　{row.open}–{row.close}
            </p>
          ))}
          <p className="text-muted mt-2">定休日：{SHOP.closedDays}</p>
          <p className="text-muted/80 text-xs mt-3 leading-relaxed">
            {SHOP.holidayNote}
          </p>
        </div>

        <div className="text-sm">
          <p className="eyebrow mb-4">Information</p>
          <ul className="space-y-2">
            <li>
              <Link href="/shop" className="text-muted hover:text-accent">
                オンラインショップ
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-muted hover:text-accent">
                レイヤーズについて
              </Link>
            </li>
            <li>
              <Link href="/access" className="text-muted hover:text-accent">
                店舗案内・アクセス
              </Link>
            </li>
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`https://www.instagram.com/${SHOP.instagram}/`}
                target="_blank"
                // noopener/noreferrer: prevents the opened tab from reaching
                // back into this one via window.opener.
                rel="noopener noreferrer"
                className="text-muted hover:text-accent"
              >
                Instagram @{SHOP.instagram} ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted">
          © {new Date().getFullYear()} {SHOP.name}
        </p>
      </div>
    </footer>
  );
}
