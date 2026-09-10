/**
 * 特定商取引法に基づく表記
 * (Disclosure required by the Act on Specified Commercial Transactions).
 *
 * ⚠️ LEGALLY REQUIRED — Japanese law requires every online shop to publish
 * this information, and the fields below are the ones the Act names. It is
 * not optional and not boilerplate.
 *
 * ⚠️ THE HIGHLIGHTED FIELDS MUST BE COMPLETED BEFORE TAKING REAL PAYMENTS.
 * A few can only come from you (the legal representative's name, and the
 * business address if it differs from the shop address). Have a professional
 * check this page if you are unsure — the return/refund terms in particular
 * interact with food-hygiene rules.
 */

import type { Metadata } from "next";
import { LegalPage, LegalRow, TodoValue } from "@/components/LegalPage";
import { SHOP } from "@/lib/shop";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from "@/lib/komoju";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_REGIONS } from "@/lib/shipping";
import { formatYen } from "@/lib/money";
import { PICKUP_LEAD_DAYS } from "@/lib/customer";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  robots: { index: true, follow: true },
};

export default function TokushohoPage() {
  const minFee = Math.min(...SHIPPING_REGIONS.map((r) => r.fee));
  const maxFee = Math.max(...SHIPPING_REGIONS.map((r) => r.fee));

  return (
    <LegalPage title="特定商取引法に基づく表記" eyebrow="Legal">
      <dl className="border-t border-line">
        <LegalRow label="販売事業者名">
          {SHOP.name}（{SHOP.nameJa}）
        </LegalRow>

        <LegalRow label="運営統括責任者">
          <TodoValue>代表者のお名前</TodoValue>
        </LegalRow>

        <LegalRow label="所在地">
          〒{SHOP.postalCode} {SHOP.address}
        </LegalRow>

        <LegalRow label="電話番号">
          {SHOP.tel}
          <span className="block text-xs text-muted mt-1">
            受付時間：営業日の{SHOP.hours[0].open}〜{SHOP.hours[0].close}
            （定休日：{SHOP.closedDays}）
          </span>
        </LegalRow>

        <LegalRow label="メールアドレス">
          {SHOP.email}
          <span className="block text-xs text-muted mt-1">
            ※ 実際に受信できるアドレスに設定してください。
          </span>
        </LegalRow>

        <LegalRow label="販売価格">
          各商品ページに表示された金額（消費税込）
        </LegalRow>

        <LegalRow label="商品代金以外の必要料金">
          送料：お届け先の地域により{formatYen(minFee)}〜{formatYen(maxFee)}
          （消費税込）
          {FREE_SHIPPING_THRESHOLD !== null && (
            <span className="block text-xs text-muted mt-1">
              配送商品の小計が{formatYen(FREE_SHIPPING_THRESHOLD)}
              以上の場合は送料無料。
            </span>
          )}
          <span className="block text-xs text-muted mt-1">
            コンビニ決済をご利用の場合、別途手数料がかかる場合があります。
          </span>
        </LegalRow>

        <LegalRow label="お支払い方法">
          {PAYMENT_TYPES.map((t) => PAYMENT_TYPE_LABELS[t]).join("／")}
          <span className="block text-xs text-muted mt-1">
            決済代行：株式会社DEGICA（KOMOJU）
          </span>
        </LegalRow>

        <LegalRow label="お支払い時期">
          クレジットカード・QRコード決済：ご注文時に確定します。
          <br />
          コンビニ決済：ご注文後に発行される番号でお支払いください。お支払い期限はご注文から3日以内です。
        </LegalRow>

        <LegalRow label="商品のお引渡し時期">
          配送商品：ご注文（コンビニ決済の場合はご入金）の確認後、3〜5営業日以内に発送いたします。
          <br />
          店頭お受け取り商品：ご指定のお受け取り日（ご注文から{PICKUP_LEAD_DAYS}
          日後以降）に店頭でお渡しいたします。
        </LegalRow>

        <LegalRow label="返品・交換について">
          <p>
            食品という商品の性質上、お客様のご都合による返品・交換はお受けできません。
          </p>
          <p className="mt-3">
            商品に破損があった場合、またはご注文と異なる商品が届いた場合は、
            商品到着後2日以内に、お写真を添えて上記の電話番号またはメールアドレスまでご連絡ください。
            送料当店負担にて、代替品の送付または返金にて対応いたします。
          </p>
          <p className="mt-3 text-xs text-muted">
            ※ 店頭お受け取り商品について、ご指定日にお越しいただけなかった場合、
            商品の品質保持の都合上、翌営業日以降のお渡しおよび返金はいたしかねます。
          </p>
        </LegalRow>

        <LegalRow label="キャンセルについて">
          配送商品：発送準備前であればキャンセルを承ります。お早めにご連絡ください。
          <br />
          店頭お受け取り商品：お受け取り日の3日前までにご連絡ください。
        </LegalRow>

        <LegalRow label="販売数量の制限">
          商品によっては、1回のご注文につき数量に上限を設けている場合があります。
        </LegalRow>

        <LegalRow label="食品表示について">
          原材料・アレルギー（特定原材料）・保存方法・賞味期限は、
          各商品ページおよび商品に同梱の表示をご確認ください。
        </LegalRow>
      </dl>

      <p className="text-xs text-muted mt-10 leading-relaxed">
        ※ 本ページの記載内容は、法令の改正等により予告なく変更する場合があります。
      </p>
    </LegalPage>
  );
}
