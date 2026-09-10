/**
 * Single source of truth for everything about the physical shop.
 *
 * Every page pulls its address, phone number and opening hours from here, so
 * correcting a detail once updates the whole site (including the structured
 * data Google reads for the map/knowledge panel).
 *
 * ⚠️ CONFIRM BEFORE LAUNCH — the values below were pre-filled from public
 * listings (Tabelog / LINE PLACE), not from you. Please check each one:
 *   - postalCode, address        (postal code inferred from the ward + district)
 *   - tel
 *   - hours / closedDays         (listing showed Wed–Sat only — verify)
 *   - lastOrder, holidayNote
 */

/** One row of the opening-hours table. */
export type OpeningHours = {
  /** Human-readable day or day range, e.g. "水〜土". */
  days: string;
  /** Opening time in 24h "HH:MM" form, or null when closed that day. */
  open: string | null;
  /** Closing time in 24h "HH:MM" form, or null when closed that day. */
  close: string | null;
};

export const SHOP = {
  /** Latin name, used for the logotype and the browser title. */
  name: "PATISSERIE LAYERS",
  /** Japanese reading, shown alongside the logotype and in structured data. */
  nameJa: "パティスリー レイヤーズ",
  /** One-line positioning statement used in the hero and meta description. */
  tagline: "重ねる、をおいしく。",
  /**
   * Longer description used for the site meta description and OG tags.
   * Kept under ~120 Japanese characters so search engines do not truncate it.
   */
  description:
    "東京・都立家政のパティスリー。看板のエッグタルトをはじめ、焼き菓子や生ケーキを毎日店内で焼き上げています。オンラインショップでは焼き菓子の全国配送と、店頭お受け取りのご予約を承ります。",

  postalCode: "165-0033",
  address: "東京都中野区鷺宮3-1-2 ハウスポートエデン 1F",
  /** Nearest station and walking time, shown on the access section. */
  access: "西武新宿線「都立家政」駅 徒歩約3分",
  tel: "03-6781-0198",
  /** Contact address for order enquiries. CONFIRM — placeholder. */
  email: "info@patisserie-layers.jp",

  /** Opening hours, rendered as a table on the access page. */
  hours: [
    { days: "水・木・金・土", open: "11:00", close: "18:00" },
  ] as OpeningHours[],
  /** Days the shop is shut, rendered under the hours table. */
  closedDays: "日・月・火曜日",
  /** Free-text note about irregular closures. */
  holidayNote: "臨時休業・営業時間の変更はInstagramでお知らせします。",

  /** Instagram handle without the leading "@". Drives the feed and the link. */
  instagram: "patisserielayers",

  /**
   * Geo coordinates for the map embed and structured data.
   * CONFIRM — approximate, derived from the address, not surveyed.
   */
  geo: { lat: 35.7285, lng: 139.6329 },
} as const;

/** Public origin of the deployed site, used to build absolute URLs. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Builds the `LocalBusiness` JSON-LD block for the shop.
 *
 * Emitting this lets Google show the address, hours and phone number directly
 * in search results. It is injected once, in the root layout.
 *
 * @returns A JSON-LD object ready to be serialised into a script tag.
 */
export function buildShopJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: SHOP.name,
    alternateName: SHOP.nameJa,
    description: SHOP.description,
    telephone: SHOP.tel,
    url: SITE_URL,
    image: `${SITE_URL}/og.png`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "東京都",
      addressLocality: "中野区",
      streetAddress: SHOP.address.replace("東京都中野区", ""),
      postalCode: SHOP.postalCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SHOP.geo.lat,
      longitude: SHOP.geo.lng,
    },
    // Wed–Sat 11:00–18:00. Keep in sync with SHOP.hours above.
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "11:00",
        closes: "18:00",
      },
    ],
    sameAs: [`https://www.instagram.com/${SHOP.instagram}/`],
  };
}
