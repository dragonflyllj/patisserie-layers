/**
 * The product catalog.
 *
 * ⚠️ THIS FILE IS THE ONLY SOURCE OF TRUTH FOR PRICES.
 *
 * The browser sends us nothing but product IDs and quantities; the server
 * re-reads every price from this file before charging. That means a customer
 * editing their cart in devtools cannot change what they pay. Never accept a
 * price sent from the client, anywhere.
 *
 * ⚠️ REPLACE WITH YOUR REAL PRODUCTS — the items below are a realistic
 * starting structure based on the shop's public menu, not your actual lineup
 * or prices. Edit freely: everything else on the site is driven from here.
 *
 * To add a photo: drop a square JPEG at `public/products/<id>.jpg` and set
 * `image` to `/products/<id>.jpg`. Leaving it null renders a styled
 * placeholder, so the site works before the photography is ready.
 */

import { TAX_RATE } from "./money";

/**
 * How an item reaches the customer.
 * - `shipping` — baked goods, shelf-stable, sent nationwide by courier.
 * - `pickup`   — fresh cakes, collected in store on a chosen date.
 */
export type Fulfillment = "shipping" | "pickup";

/**
 * The 8 substances Japanese law requires to be declared on food
 * (特定原材料). Anything else is voluntary but recommended.
 */
export type Allergen =
  | "卵"
  | "乳"
  | "小麦"
  | "そば"
  | "落花生"
  | "えび"
  | "かに"
  | "くるみ";

export type Product = {
  /** URL-safe identifier. Also the filename used for its photo. */
  id: string;
  name: string;
  /** Latin subtitle shown under the name. */
  nameLatin: string;
  /** Short line used on catalog cards. */
  summary: string;
  /** Full description shown on the product page. */
  description: string;
  /** Tax-inclusive price in whole yen (総額表示). */
  price: number;
  category: "yakigashi" | "namagashi" | "gift";
  fulfillment: Fulfillment;
  allergens: Allergen[];
  /** Shelf life / storage guidance, legally expected on food listings. */
  storage: string;
  /** Path under /public, or null to render a placeholder. */
  image: string | null;
  /** Highlighted on the home page when true. */
  featured: boolean;
  /** Sold out when false — hides the add-to-cart button. */
  available: boolean;
};

/** Human labels for the category filter tabs. */
export const CATEGORY_LABELS: Record<Product["category"], string> = {
  yakigashi: "焼き菓子",
  namagashi: "生菓子",
  gift: "ギフト",
};

/** Human labels for the fulfillment badge. */
export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  shipping: "全国配送",
  pickup: "店頭お受け取り",
};

export const PRODUCTS: Product[] = [
  {
    id: "egg-tart-4",
    name: "エッグタルト 4個入",
    nameLatin: "Egg Tart",
    summary: "看板商品。層になった生地と、とろけるカスタード。",
    description:
      "レイヤーズの名前の由来でもある、何層にも折り込んだパイ生地。低温でじっくり焼き上げ、縁はほろりと崩れるほど軽く、中心は濃厚なカスタードのまま仕上げます。焼きたての香りをそのままお届けしたいので、店頭でのお受け取り限定です。",
    price: 1180,
    category: "namagashi",
    fulfillment: "pickup",
    allergens: ["卵", "乳", "小麦"],
    storage: "要冷蔵10℃以下。お受け取り当日中にお召し上がりください。",
    image: null,
    featured: true,
    available: true,
  },
  {
    id: "financier-8",
    name: "フィナンシェ 8個入",
    nameLatin: "Financier",
    summary: "焦がしバターの香りを重ねた、定番の焼き菓子。",
    description:
      "発酵バターをじっくり焦がし、アーモンドプードルとあわせて寝かせた生地を、高温で一気に焼き上げます。外は香ばしく、中はしっとり。日を追うごとに味がなじむので、贈りものにも向きます。",
    price: 2160,
    category: "yakigashi",
    fulfillment: "shipping",
    allergens: ["卵", "乳", "小麦"],
    storage: "直射日光・高温多湿を避けて常温保存。製造日より21日。",
    image: null,
    featured: true,
    available: true,
  },
  {
    id: "madeleine-8",
    name: "マドレーヌ 8個入",
    nameLatin: "Madeleine",
    summary: "レモンの皮を効かせた、軽やかな貝形の焼き菓子。",
    description:
      "国産レモンの皮をすりおろして生地に加え、一晩休ませてから焼きます。バターの厚みとレモンの軽さが同居する、後を引かない味わいです。",
    price: 2160,
    category: "yakigashi",
    fulfillment: "shipping",
    allergens: ["卵", "乳", "小麦"],
    storage: "直射日光・高温多湿を避けて常温保存。製造日より21日。",
    image: null,
    featured: false,
    available: true,
  },
  {
    id: "cookie-tin",
    name: "クッキー缶",
    nameLatin: "Biscuit Tin",
    summary: "9種類のクッキーを敷き詰めた、贈りものの定番。",
    description:
      "サブレ・ディアマン、絞り出し、ナッツのフロランタンなど9種類を、隙間なく詰め合わせた缶入り。食べ終えたあとも使っていただけるよう、オリジナルの缶をあつらえました。",
    price: 3980,
    category: "gift",
    fulfillment: "shipping",
    allergens: ["卵", "乳", "小麦", "くるみ", "落花生"],
    storage: "直射日光・高温多湿を避けて常温保存。製造日より30日。",
    image: null,
    featured: true,
    available: true,
  },
  {
    id: "gateau-chocolat",
    name: "ガトーショコラ",
    nameLatin: "Gâteau au Chocolat",
    summary: "カカオ70%。密度のある、大人のためのチョコレートケーキ。",
    description:
      "カカオ分70%のクーベルチュールを使い、粉を最小限にとどめた密度の高い生地。冷やすと生チョコのように、室温に戻すとふんわりと、二通りの表情を楽しめます。",
    price: 2700,
    category: "yakigashi",
    fulfillment: "shipping",
    allergens: ["卵", "乳", "小麦"],
    storage: "要冷蔵10℃以下。お届け後7日以内にお召し上がりください。",
    image: null,
    featured: false,
    available: true,
  },
  {
    id: "sable-diamant",
    name: "サブレ・ディアマン 2種",
    nameLatin: "Sablé Diamant",
    summary: "バニラとカカオ。ざらめをまとった、ほろほろのサブレ。",
    description:
      "縁にグラニュー糖をまとわせて焼く、フランスの定番サブレ。バニラとカカオの2種類を詰め合わせました。口に入れた瞬間にほどける食感を目指しています。",
    price: 1620,
    category: "yakigashi",
    fulfillment: "shipping",
    allergens: ["卵", "乳", "小麦"],
    storage: "直射日光・高温多湿を避けて常温保存。製造日より30日。",
    image: null,
    featured: false,
    available: true,
  },
  {
    id: "gift-box-assort",
    name: "焼き菓子詰め合わせ ギフトボックス",
    nameLatin: "Assorted Gift Box",
    summary: "フィナンシェ・マドレーヌ・サブレを一箱に。熨斗承ります。",
    description:
      "定番の焼き菓子を組み合わせた、贈答用の詰め合わせ。リボンをかけてお届けします。熨斗・メッセージカードをご希望の場合は、ご注文時の備考欄にご記入ください。",
    price: 4320,
    category: "gift",
    fulfillment: "shipping",
    allergens: ["卵", "乳", "小麦", "くるみ"],
    storage: "直射日光・高温多湿を避けて常温保存。製造日より21日。",
    image: null,
    featured: true,
    available: true,
  },
  {
    id: "shortcake-whole",
    name: "ショートケーキ（ホール5号）",
    nameLatin: "Strawberry Shortcake",
    summary: "季節の苺と、しっかり泡立てた生クリームを重ねて。",
    description:
      "きめの細かいスポンジに、乳脂肪分の高い生クリームと季節の苺を重ねた5号（直径15cm・4〜6名様分）のホールケーキ。ご予約は受け取り希望日の3日前まで承ります。",
    price: 5400,
    category: "namagashi",
    fulfillment: "pickup",
    allergens: ["卵", "乳", "小麦"],
    storage: "要冷蔵10℃以下。お受け取り当日中にお召し上がりください。",
    image: null,
    featured: false,
    available: true,
  },
  {
    id: "mont-blanc",
    name: "モンブラン",
    nameLatin: "Mont Blanc",
    summary: "和栗のペーストを、注文のたびに絞り出します。",
    description:
      "国産の和栗を裏ごししたペーストを、ご注文をいただいてから絞ります。土台のメレンゲの軽さと、栗の密度の対比が持ち味です。",
    price: 780,
    category: "namagashi",
    fulfillment: "pickup",
    allergens: ["卵", "乳", "小麦"],
    storage: "要冷蔵10℃以下。お受け取り当日中にお召し上がりください。",
    image: null,
    featured: false,
    available: true,
  },
  {
    id: "cheesecake-whole",
    name: "ベイクドチーズケーキ（ホール）",
    nameLatin: "Baked Cheesecake",
    summary: "二種類のチーズを重ねた、余韻の長い一台。",
    description:
      "クリームチーズにサワークリームを重ね、湯煎でゆっくり火を入れた一台。酸味を残して焼き上げるので、最後まで重たくなりません。",
    price: 3600,
    category: "namagashi",
    fulfillment: "pickup",
    allergens: ["卵", "乳", "小麦"],
    storage: "要冷蔵10℃以下。お受け取り後3日以内にお召し上がりください。",
    image: null,
    featured: false,
    available: true,
  },
];

/**
 * Looks up a single product by its ID.
 *
 * @param id - The product ID from a URL or a cart line.
 * @returns The product, or undefined if the ID is unknown (e.g. a stale cart
 *          referencing a product that has since been removed).
 */
export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Returns the products flagged for the home page, in catalog order. */
export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured && p.available);
}

/** Consumption tax rate that applies to products (all our items are food). */
export const PRODUCT_TAX_RATE = TAX_RATE.food;
