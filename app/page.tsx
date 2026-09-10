/**
 * Home page.
 *
 * Composed of server components throughout, so the whole page — including the
 * live Instagram feed — is rendered to HTML on the server with no client-side
 * JavaScript beyond the header's cart badge.
 */

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { InstagramFeed } from "@/components/InstagramFeed";
import { getFeaturedProducts } from "@/lib/products";
import { SHOP } from "@/lib/shop";

/**
 * The three points of the shop's story, shown under the hero.
 * Kept here rather than in shop.ts because it is page copy, not shop data.
 */
const CONCEPT_POINTS = [
  {
    title: "層を、数える",
    body: "折り込んだ生地の一層ずつに、火の入り方の違いがあります。焼き上がりの断面を見て、その日の温度と時間を決めています。",
  },
  {
    title: "その日のぶんだけ",
    body: "生菓子は毎朝、売り切れる量だけを仕込みます。並ぶ数は多くありませんが、いちばんいい状態のものだけをお渡しするためです。",
  },
  {
    title: "持ち帰った先まで",
    body: "焼き菓子は、数日おいてから香りが立つように配合しています。贈りものとして届いた日が、いちばんおいしい日になるように。",
  },
];

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/*
          The background is a set of stacked translucent bands — a quiet nod to
          the shop's name (layers) and to the cross-section of a folded pastry.
          Drawn in CSS so the hero needs no image and renders instantly.
        */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,#F3EADD 0%,#EFE2D1 38%,#EADBC6 62%,#FAF7F2 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-45"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(168,118,62,0.16) 0px, rgba(168,118,62,0.16) 1px, transparent 1px, transparent 13px)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <p className="eyebrow">Tokyo · Toritsu-Kasei</p>
          <h1 className="font-display text-4xl sm:text-6xl mt-6 leading-[1.35] tracking-wide">
            {SHOP.tagline}
          </h1>
          <p className="text-sm sm:text-base text-ink/75 mt-8 max-w-lg leading-loose">
            西武新宿線・都立家政のちいさなパティスリー。
            <br />
            看板のエッグタルトから、贈りものの焼き菓子まで、
            <br className="hidden sm:block" />
            毎日店内で焼き上げています。
          </p>

          <div className="flex flex-wrap gap-3 mt-12">
            <Link
              href="/shop"
              className="rounded-full bg-ink text-cream px-8 py-3.5 text-sm hover:bg-accent-deep transition-colors"
            >
              オンラインショップへ
            </Link>
            <Link
              href="/access"
              className="rounded-full border border-ink/25 px-8 py-3.5 text-sm hover:border-accent hover:text-accent transition-colors"
            >
              店舗案内
            </Link>
          </div>
        </div>
      </section>

      {/* ── Concept ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">Concept</p>
        <h2 className="font-display text-2xl sm:text-3xl mt-3 mb-14">
          重ねること、だけを考えて
        </h2>

        <div className="grid gap-10 md:grid-cols-3">
          {CONCEPT_POINTS.map((point, index) => (
            <div key={point.title}>
              <span className="font-display text-accent text-sm">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg mt-3">{point.title}</h3>
              <p className="text-sm text-muted mt-4 leading-loose">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured products ─────────────────────────────────────────── */}
      <section className="bg-paper border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <p className="eyebrow">Selection</p>
              <h2 className="font-display text-2xl sm:text-3xl mt-3">
                おすすめの品
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm text-accent hover:text-accent-deep border-b border-accent/40 pb-0.5"
            >
              すべての商品を見る →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram ─────────────────────────────────────────────────── */}
      <InstagramFeed />

      {/* ── Access strip ──────────────────────────────────────────────── */}
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-6xl px-5 py-20 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="eyebrow">Access</p>
            <h2 className="font-display text-2xl sm:text-3xl mt-3">
              店舗のご案内
            </h2>
            <address className="not-italic text-sm text-cream/75 mt-6 leading-loose">
              〒{SHOP.postalCode} {SHOP.address}
              <br />
              {SHOP.access}
              <br />
              TEL {SHOP.tel}
            </address>
          </div>

          <div className="text-sm text-cream/75 leading-loose md:border-l md:border-cream/15 md:pl-10">
            {SHOP.hours.map((row) => (
              <p key={row.days}>
                {row.days}　{row.open}–{row.close}
              </p>
            ))}
            <p className="mt-2">定休日：{SHOP.closedDays}</p>
            <Link
              href="/access"
              className="inline-block mt-8 rounded-full border border-cream/30 px-7 py-3 text-sm hover:border-accent hover:text-accent transition-colors"
            >
              地図・詳しい行き方 →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
