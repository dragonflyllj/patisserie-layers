/**
 * Store information and directions.
 *
 * The map is a keyless Google Maps embed driven by the address string from
 * lib/shop.ts, so correcting the address there also corrects the map. Using
 * the keyless embed avoids adding a billable Google Maps API key to the
 * project just to show one pin.
 */

import type { Metadata } from "next";
import { SHOP } from "@/lib/shop";

export const metadata: Metadata = {
  title: "店舗案内・アクセス",
  description: `${SHOP.name}の店舗情報。${SHOP.address}（${SHOP.access}）`,
};

/**
 * Directions from the station, shown as a numbered list.
 *
 * ⚠️ INVENTED — these steps were written to fit the address, not walked.
 * Replace them with the real route (which exit, which landmarks) before
 * launch, or delete the list and rely on the map alone.
 */
const DIRECTIONS = [
  "西武新宿線「都立家政」駅の改札を出て、南口へ。",
  "駅前の商店街（都立家政駅前通り）を南へ直進します。",
  "1つ目の信号を渡り、そのまま商店街を進みます。",
  "左手、1階に白い庇の出た建物が当店です。徒歩約3分。",
];

export default function AccessPage() {
  // Google's keyless embed takes the address as a query string.
  const mapQuery = encodeURIComponent(`${SHOP.postalCode} ${SHOP.address}`);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=17&hl=ja&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="eyebrow">Access</p>
      <h1 className="font-display text-3xl sm:text-4xl mt-3">店舗案内</h1>

      <div className="mt-12 aspect-[16/10] sm:aspect-[16/7] w-full overflow-hidden rounded-sm border border-line bg-line/30">
        <iframe
          src={mapSrc}
          title={`${SHOP.name}の地図`}
          className="w-full h-full"
          // lazy: the map is below the fold on mobile and is the heaviest
          // thing on the page, so it should not block first paint.
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="grid gap-12 md:grid-cols-2 mt-12">
        <div>
          <h2 className="font-display text-xl">{SHOP.nameJa}</h2>
          <dl className="mt-6 text-sm border-t border-line">
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 border-b border-line">
              <dt className="text-muted text-xs pt-1">住所</dt>
              <dd className="leading-relaxed">
                〒{SHOP.postalCode}
                <br />
                {SHOP.address}
              </dd>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 border-b border-line">
              <dt className="text-muted text-xs pt-1">アクセス</dt>
              <dd className="leading-relaxed">{SHOP.access}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 border-b border-line">
              <dt className="text-muted text-xs pt-1">電話</dt>
              <dd>
                <a
                  href={`tel:${SHOP.tel.replace(/-/g, "")}`}
                  className="hover:text-accent"
                >
                  {SHOP.tel}
                </a>
              </dd>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 border-b border-line">
              <dt className="text-muted text-xs pt-1">営業時間</dt>
              <dd className="leading-relaxed">
                {SHOP.hours.map((row) => (
                  <span key={row.days} className="block">
                    {row.days}　{row.open}–{row.close}
                  </span>
                ))}
                <span className="block mt-1">定休日：{SHOP.closedDays}</span>
              </dd>
            </div>
          </dl>

          <p className="text-xs text-muted mt-5 leading-relaxed">
            {SHOP.holidayNote}
          </p>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 rounded-full border border-ink/25 px-7 py-3 text-sm hover:border-accent hover:text-accent transition-colors"
          >
            経路を検索する ↗
          </a>
        </div>

        <div>
          <h2 className="font-display text-xl">駅からの行き方</h2>
          <ol className="mt-6 space-y-5 text-sm leading-loose">
            {DIRECTIONS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="font-display text-accent shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-ink/85">{step}</span>
              </li>
            ))}
          </ol>

          <p className="text-xs text-muted mt-8 leading-relaxed">
            ※ 専用の駐車場はございません。お車でお越しの際は、
            近隣のコインパーキングをご利用ください。
          </p>
        </div>
      </div>
    </div>
  );
}
