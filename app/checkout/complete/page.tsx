/**
 * Order completion page — where KOMOJU sends the customer after payment.
 *
 * ⚠️ Landing here is NOT proof of payment. The URL is guessable and the
 * customer's browser is not a trustworthy source of truth, so this page asks
 * KOMOJU directly what the session's real status is. The authoritative record
 * is still the webhook (app/api/webhooks/komoju/route.ts) — this page only
 * decides what to *tell* the customer.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { retrieveSession } from "@/lib/komoju";
import { getOrder } from "@/lib/orders";
import { SHOP } from "@/lib/shop";

export const metadata: Metadata = {
  title: "ご注文ありがとうございます",
  // This page is per-customer and has no business in search results.
  robots: { index: false, follow: false },
};

/** Must run per request — it queries KOMOJU for live payment status. */
export const dynamic = "force-dynamic";

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const reference = ref ?? null;

  const order = reference ? await getOrder(reference) : null;

  // Confirm with KOMOJU when we can. If the order record is missing — which
  // is expected with the in-memory store on serverless, see lib/orders.ts —
  // fall through to the neutral message below rather than claiming failure.
  const session = order ? await retrieveSession(order.sessionId) : null;
  const confirmedPaid =
    session?.status === "completed" || order?.status === "paid";

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <ClearCartOnMount />

      <p className="eyebrow">Thank you</p>
      <h1 className="font-display text-3xl mt-4">
        ご注文ありがとうございます
      </h1>

      {reference && (
        <p className="mt-8 inline-block rounded-sm border border-line bg-paper px-6 py-3 text-sm">
          ご注文番号
          <span className="font-display ml-3 tracking-wider">{reference}</span>
        </p>
      )}

      <div className="mt-10 text-sm text-ink/80 leading-loose">
        {confirmedPaid ? (
          <p>
            お支払いを確認いたしました。
            <br />
            ご入力いただいたメールアドレス宛に、確認のご連絡をお送りします。
          </p>
        ) : (
          <p>
            ご注文を承りました。
            <br />
            お支払いの確認が取れ次第、ご入力いただいたメールアドレス宛にご連絡いたします。
            <br />
            <span className="text-muted text-xs">
              ※ コンビニ決済をお選びの場合は、店頭でのお支払い後に確定となります。
            </span>
          </p>
        )}
      </div>

      <div className="mt-12 rounded-sm border border-line bg-paper px-6 py-6 text-left text-xs text-muted leading-relaxed">
        <p className="text-ink text-sm mb-3">お問い合わせ</p>
        <p>
          ご注文に関するお問い合わせは、ご注文番号を添えて
          <a href={`tel:${SHOP.tel.replace(/-/g, "")}`} className="text-accent">
            {" "}
            {SHOP.tel}{" "}
          </a>
          または
          <a href={`mailto:${SHOP.email}`} className="text-accent">
            {" "}
            {SHOP.email}{" "}
          </a>
          までお願いいたします。
        </p>
      </div>

      <Link
        href="/"
        className="inline-block mt-12 rounded-full border border-ink/25 px-8 py-3.5 text-sm hover:border-accent hover:text-accent transition-colors"
      >
        トップページへ戻る
      </Link>
    </div>
  );
}
