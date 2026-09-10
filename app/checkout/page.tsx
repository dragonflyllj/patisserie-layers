"use client";

/**
 * Checkout — customer details, then hand off to KOMOJU's payment page.
 *
 * This page never sees a card number. On submit it POSTs the cart (IDs and
 * quantities only) plus the customer's details to /api/checkout, which prices
 * the order server-side, creates a KOMOJU session and returns a URL. We then
 * redirect the browser there, and KOMOJU handles the payment itself.
 *
 * The totals rendered here are a preview. The server recomputes them, so the
 * two agreeing is a correctness property, not something the customer can lean
 * on to change the price.
 */

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { priceOrder } from "@/lib/order";
import { formatYen } from "@/lib/money";
import { SHIPPING_REGIONS } from "@/lib/shipping";
import { PREFECTURES } from "@/lib/prefectures";
import { earliestPickupDate, PICKUP_LEAD_DAYS } from "@/lib/customer";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from "@/lib/komoju";

/** Shared class strings, so every field looks identical. */
const FIELD_CLASS =
  "w-full rounded-sm border border-line bg-paper px-4 py-3 text-sm focus:border-accent outline-none";
const LABEL_CLASS = "block text-xs text-muted mb-2";

export default function CheckoutPage() {
  const { lines, hydrated } = useCart();

  // ── Form state ────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [nameKana, setNameKana] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regionId, setRegionId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [building, setBuilding] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Prices the cart with the currently selected region, so the shipping fee
   * and grand total update live as the customer picks a destination.
   */
  const priced = useMemo(() => {
    if (lines.length === 0) return null;
    try {
      return priceOrder(lines, regionId || null);
    } catch {
      // Only reachable if the cart itself is invalid (a delisted product, or
      // a region ID not in the table). Render nothing rather than a broken
      // summary; the server will reject the same cart with a clear message.
      return null;
    }
  }, [lines, regionId]);

  /** True once the shipping fee is a real figure rather than a placeholder. */
  const shippingKnown = priced?.shippingFeeKnown ?? false;

  /**
   * Submits the order and redirects to KOMOJU.
   *
   * @param event - The form submit event.
   */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Only IDs and quantities. Prices are the server's business.
          lines,
          customer: { name, nameKana, email, phone },
          shipping: priced?.requiresShipping
            ? { regionId, postalCode, prefecture, addressLine, building }
            : null,
          pickup: priced?.requiresPickup ? { date: pickupDate } : null,
          note,
        }),
      });

      const data = (await response.json()) as {
        redirectUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.redirectUrl) {
        setError(data.error ?? "決済ページを開けませんでした。");
        setSubmitting(false);
        return;
      }

      // Full page navigation, not router.push: KOMOJU's payment page is an
      // external origin and is not part of this Next.js app.
      window.location.href = data.redirectUrl;
    } catch {
      setError(
        "通信エラーが発生しました。接続をご確認のうえ、もう一度お試しください。",
      );
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24">
        <p className="text-sm text-muted">読み込み中…</p>
      </div>
    );
  }

  if (!priced) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h1 className="font-display text-2xl">カートは空です</h1>
        <Link
          href="/shop"
          className="inline-block mt-8 rounded-full bg-ink text-cream px-8 py-3.5 text-sm"
        >
          商品を見る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-display text-3xl">ご注文手続き</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-12 grid gap-12 md:grid-cols-[1fr_18rem] items-start"
      >
        <div className="space-y-12">
          {/* ── Customer ──────────────────────────────────────────────── */}
          <fieldset>
            <legend className="font-display text-lg mb-6">お客様情報</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={LABEL_CLASS}>
                  お名前 <span className="text-sold">*</span>
                </label>
                <input
                  id="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="nameKana" className={LABEL_CLASS}>
                  お名前（フリガナ）
                </label>
                <input
                  id="nameKana"
                  value={nameKana}
                  onChange={(e) => setNameKana(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="email" className={LABEL_CLASS}>
                  メールアドレス <span className="text-sold">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="phone" className={LABEL_CLASS}>
                  電話番号 <span className="text-sold">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="09012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Shipping (only when the cart contains shipped items) ───── */}
          {priced.requiresShipping && (
            <fieldset>
              <legend className="font-display text-lg mb-6">お届け先</legend>
              <div className="grid gap-5">
                <div>
                  <label htmlFor="regionId" className={LABEL_CLASS}>
                    地域 <span className="text-sold">*</span>
                  </label>
                  <select
                    id="regionId"
                    required
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="">選択してください</option>
                    {SHIPPING_REGIONS.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.label}（送料 {formatYen(region.fee)}）
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="postalCode" className={LABEL_CLASS}>
                      郵便番号 <span className="text-sold">*</span>
                    </label>
                    <input
                      id="postalCode"
                      required
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="1650033"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className={FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="prefecture" className={LABEL_CLASS}>
                      都道府県 <span className="text-sold">*</span>
                    </label>
                    <select
                      id="prefecture"
                      required
                      value={prefecture}
                      onChange={(e) => setPrefecture(e.target.value)}
                      className={FIELD_CLASS}
                    >
                      <option value="">選択してください</option>
                      {PREFECTURES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="addressLine" className={LABEL_CLASS}>
                    市区町村・番地 <span className="text-sold">*</span>
                  </label>
                  <input
                    id="addressLine"
                    required
                    autoComplete="address-line1"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="building" className={LABEL_CLASS}>
                    建物名・部屋番号
                  </label>
                  <input
                    id="building"
                    autoComplete="address-line2"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* ── Pickup (only when the cart contains pickup items) ──────── */}
          {priced.requiresPickup && (
            <fieldset>
              <legend className="font-display text-lg mb-6">
                店頭お受け取り
              </legend>
              <p className="text-xs text-muted mb-5 leading-relaxed">
                カートに店頭お受け取りの商品が含まれています。
                ご準備の都合上、{PICKUP_LEAD_DAYS}日後以降の日付をお選びください。
                営業日は水・木・金・土曜日です。
              </p>
              <div className="sm:w-64">
                <label htmlFor="pickupDate" className={LABEL_CLASS}>
                  お受け取り日 <span className="text-sold">*</span>
                </label>
                <input
                  id="pickupDate"
                  type="date"
                  required
                  // Same minimum the server enforces, so the picker cannot
                  // offer a date that would be rejected on submit.
                  min={earliestPickupDate()}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="font-display text-lg mb-6">備考</legend>
            <label htmlFor="note" className={LABEL_CLASS}>
              熨斗・メッセージカード・アレルギーに関するご質問など（500文字まで）
            </label>
            <textarea
              id="note"
              rows={4}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={FIELD_CLASS}
            />
          </fieldset>
        </div>

        {/* ── Order summary ───────────────────────────────────────────── */}
        <aside className="rounded-sm border border-line bg-paper p-6 md:sticky md:top-28">
          <h2 className="font-display text-base mb-5">ご注文内容</h2>

          <ul className="space-y-3 text-xs border-b border-line pb-5">
            {priced.lines.map((line) => (
              <li key={line.product.id} className="flex justify-between gap-3">
                <span className="text-muted min-w-0">
                  {line.product.name}
                  <span className="text-muted/70"> × {line.quantity}</span>
                </span>
                <span className="tabular-nums shrink-0">
                  {formatYen(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between text-sm mt-5">
            <span className="text-muted">小計</span>
            <span className="tabular-nums">{formatYen(priced.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mt-3">
            <span className="text-muted">送料</span>
            <span className="tabular-nums">
              {shippingKnown ? (
                priced.shippingFee === 0 ? (
                  <span className="text-accent">無料</span>
                ) : (
                  formatYen(priced.shippingFee)
                )
              ) : (
                <span className="text-xs text-muted">地域を選択してください</span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-baseline mt-5 pt-5 border-t border-line">
            <span className="text-sm">合計</span>
            <span className="font-display text-xl tabular-nums">
              {formatYen(shippingKnown ? priced.total : priced.subtotal)}
            </span>
          </div>
          <p className="text-[10px] text-muted mt-1 text-right">
            税込（うち消費税 {formatYen(priced.includedTaxTotal)}）
          </p>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-sm bg-sold/10 border border-sold/30 px-4 py-3 text-xs text-sold leading-relaxed"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 rounded-full bg-ink text-cream px-6 py-3.5 text-sm hover:bg-accent-deep transition-colors disabled:opacity-50"
          >
            {submitting ? "決済ページへ移動中…" : "お支払いへ進む"}
          </button>

          <p className="text-[10px] text-muted mt-4 leading-relaxed">
            次の画面で、お支払い方法をお選びいただけます。
            <br />
            {PAYMENT_TYPES.map((t) => PAYMENT_TYPE_LABELS[t]).join("／")}
          </p>
          <p className="text-[10px] text-muted mt-3 leading-relaxed">
            決済はKOMOJUの安全な決済ページで行われます。カード情報が当店のサーバーに保存されることはありません。
          </p>
        </aside>
      </form>
    </div>
  );
}
