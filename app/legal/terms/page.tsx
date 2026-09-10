/**
 * Terms of use for the online shop.
 *
 * ⚠️ TEMPLATE — written to match how this shop actually operates (pickup lead
 * times, perishable goods, no returns on food), but not legal advice. Have it
 * reviewed before launch.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { SHOP } from "@/lib/shop";
import { PICKUP_LEAD_DAYS } from "@/lib/customer";
import { MAX_LINE_QUANTITY } from "@/lib/order";

export const metadata: Metadata = { title: "ご利用規約" };

const H2 = "font-display text-lg text-ink pt-8 pb-3";

export default function TermsPage() {
  return (
    <LegalPage title="ご利用規約" eyebrow="Terms">
      <p>
        本規約は、{SHOP.name}（以下「当店」）が運営するオンラインショップ
        （以下「本サービス」）のご利用条件を定めるものです。
        本サービスをご利用いただいた時点で、本規約にご同意いただいたものとみなします。
      </p>

      <h2 className={H2}>第1条（ご注文の成立）</h2>
      <p>
        ご注文は、お客様が注文手続きを完了し、決済が確認された時点で成立します。
        なお、在庫の状況等により、ご注文成立後にやむを得ずキャンセルをお願いする場合があります。
        その場合は速やかにご連絡のうえ、お支払いいただいた代金を全額返金いたします。
      </p>

      <h2 className={H2}>第2条（商品について）</h2>
      <p>
        当店の商品はすべて食品です。商品ページに記載の保存方法・賞味期限をお守りください。
        アレルギーをお持ちの方は、ご注文前に各商品ページの特定原材料の表示を必ずご確認ください。
        同一の工場内で、えび・かに・そば・落花生を含む製品を製造しております。
      </p>
      <p className="mt-3">
        手仕込みのため、焼き色や大きさに個体差が生じます。あらかじめご了承ください。
      </p>

      <h2 className={H2}>第3条（数量の制限）</h2>
      <p>
        1回のご注文につき、同一商品は{MAX_LINE_QUANTITY}
        点までとさせていただきます。
        これを超える数量をご希望の場合は、お電話にてご相談ください。
      </p>

      <h2 className={H2}>第4条（配送について）</h2>
      <p>
        配送商品は、ご注文（コンビニ決済の場合はご入金）の確認後、
        3〜5営業日以内に発送いたします。
        天候・交通事情等によりお届けが遅れる場合がありますが、
        これに起因する損害について当店は責任を負いかねます。
      </p>
      <p className="mt-3">
        長期のご不在等により商品をお受け取りいただけず、
        当店に返送された場合、商品の性質上、再送および返金はいたしかねます。
      </p>

      <h2 className={H2}>第5条（店頭お受け取りについて）</h2>
      <p>
        店頭お受け取りの商品は、ご注文から{PICKUP_LEAD_DAYS}
        日後以降の営業日をご指定いただけます。
        ご指定日にお越しいただけなかった場合、品質保持の都合上、
        翌営業日以降のお渡しおよび返金はいたしかねます。
      </p>

      <h2 className={H2}>第6条（返品・交換）</h2>
      <p>
        食品という商品の性質上、お客様のご都合による返品・交換はお受けできません。
        商品の破損、または誤配送の場合の対応については、
        <Link href="/legal/tokushoho" className="text-accent hover:text-accent-deep">
          特定商取引法に基づく表記
        </Link>
        をご確認ください。
      </p>

      <h2 className={H2}>第7条（禁止事項）</h2>
      <p>本サービスのご利用にあたり、以下の行為を禁止します。</p>
      <ul className="list-disc pl-5 mt-3 space-y-1">
        <li>虚偽の情報を用いてご注文いただく行為</li>
        <li>転売を目的としたご注文</li>
        <li>本サービスの運営を妨げる行為</li>
        <li>他のお客様、第三者または当店の権利を侵害する行為</li>
      </ul>

      <h2 className={H2}>第8条（免責）</h2>
      <p>
        当店は、本サービスの内容の正確性に努めますが、
        システムの障害、通信回線の不具合等により本サービスを一時的に
        ご利用いただけない場合があります。
        これによって生じた損害について、当店の故意または重大な過失による場合を除き、
        責任を負いかねます。
      </p>

      <h2 className={H2}>第9条（規約の変更）</h2>
      <p>
        当店は、必要と判断した場合、本規約を変更することがあります。
        変更後の規約は、本ページに掲載した時点から効力を生じます。
      </p>

      <h2 className={H2}>第10条（準拠法・管轄）</h2>
      <p>
        本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、
        当店の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
      </p>

      <p className="text-xs text-muted mt-12">
        制定日：<span className="text-sold">要記入</span>
      </p>
    </LegalPage>
  );
}
