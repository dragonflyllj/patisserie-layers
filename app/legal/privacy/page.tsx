/**
 * Privacy policy.
 *
 * ⚠️ TEMPLATE — this covers the data this site actually handles (order
 * details, and what is passed to KOMOJU), which makes it a reasonable
 * starting point rather than generic filler. It is still not legal advice.
 * Have it reviewed before launch, and update it if you add anything that
 * collects data — analytics, a newsletter, a chat widget.
 */

import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { SHOP } from "@/lib/shop";

export const metadata: Metadata = { title: "プライバシーポリシー" };

/** Section heading style, repeated throughout the policy. */
const H2 = "font-display text-lg text-ink pt-8 pb-3";

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" eyebrow="Privacy">
      <p>
        {SHOP.name}（以下「当店」）は、お客様の個人情報の保護を重要な責務と考え、
        個人情報の保護に関する法律およびその他の関係法令を遵守し、
        以下の方針に基づき個人情報を取り扱います。
      </p>

      <h2 className={H2}>1. 取得する情報</h2>
      <p>当店は、オンラインショップのご利用にあたり、以下の情報を取得します。</p>
      <ul className="list-disc pl-5 mt-3 space-y-1">
        <li>お名前、フリガナ</li>
        <li>メールアドレス、電話番号</li>
        <li>お届け先のご住所（配送商品をご注文の場合）</li>
        <li>ご注文内容、お受け取り希望日、備考欄にご記入いただいた内容</li>
      </ul>
      <p className="mt-4">
        クレジットカード番号等の決済情報は、決済代行会社が直接取得するものであり、
        <strong className="font-medium">当店では取得も保存もいたしません。</strong>
      </p>

      <h2 className={H2}>2. 利用目的</h2>
      <ul className="list-disc pl-5 mt-3 space-y-1">
        <li>ご注文の確認、商品の発送およびお受け取りのご案内</li>
        <li>ご注文に関するお問い合わせへの対応</li>
        <li>代金の決済</li>
        <li>法令に基づく帳簿の保存</li>
      </ul>
      <p className="mt-4">
        上記の目的以外に利用することはありません。
        お客様の同意なく、広告・宣伝の目的で利用することもありません。
      </p>

      <h2 className={H2}>3. 第三者への提供</h2>
      <p>
        当店は、以下の場合を除き、お客様の個人情報を第三者に提供しません。
      </p>
      <ul className="list-disc pl-5 mt-3 space-y-1">
        <li>お客様の同意がある場合</li>
        <li>法令に基づき開示が求められた場合</li>
        <li>
          以下の業務委託先に対し、業務の遂行に必要な範囲で提供する場合
        </li>
      </ul>
      <dl className="mt-4 text-xs text-muted space-y-2 pl-5">
        <div>
          <dt className="inline text-ink">決済代行：</dt>
          <dd className="inline">
            {" "}
            株式会社DEGICA（KOMOJU）— お名前・メールアドレス・ご注文金額
          </dd>
        </div>
        <div>
          <dt className="inline text-ink">配送：</dt>
          <dd className="inline">
            {" "}
            運送会社 — お届け先のお名前・ご住所・電話番号
          </dd>
        </div>
      </dl>

      <h2 className={H2}>4. 安全管理</h2>
      <p>
        当店は、個人情報の漏えい、滅失または毀損を防止するため、
        通信の暗号化（HTTPS）をはじめとする必要かつ適切な措置を講じます。
      </p>

      <h2 className={H2}>5. Cookieについて</h2>
      <p>
        当サイトでは、お買い物カゴの内容を保持するために、
        お使いのブラウザの保存領域（localStorage）を利用しています。
        この情報はお客様のブラウザ内にのみ保存され、当店が閲覧することはありません。
        <br />
        また、当サイトでは広告目的の追跡Cookieは使用していません。
      </p>

      <h2 className={H2}>6. 保有期間</h2>
      <p>
        ご注文に関する情報は、法令に定められた期間保存したのち、
        速やかに削除いたします。
      </p>

      <h2 className={H2}>7. 開示・訂正・削除のご請求</h2>
      <p>
        ご自身の個人情報の開示、訂正、利用停止、削除をご希望の場合は、
        下記の窓口までご連絡ください。ご本人であることを確認のうえ、
        速やかに対応いたします。
      </p>

      <h2 className={H2}>8. お問い合わせ窓口</h2>
      <p>
        {SHOP.name}
        <br />
        〒{SHOP.postalCode} {SHOP.address}
        <br />
        電話：{SHOP.tel}
        <br />
        メール：{SHOP.email}
      </p>

      <p className="text-xs text-muted mt-12">
        制定日：<span className="text-sold">要記入</span>
        　／　最終改定日：<span className="text-sold">要記入</span>
      </p>
    </LegalPage>
  );
}
