# PATISSERIE LAYERS — website & online shop

The website for PATISSERIE LAYERS (パティスリー レイヤーズ), a patisserie in
Toritsu-Kasei, Nakano-ku, Tokyo. Japanese-language, with an online shop that
takes credit card, QR-wallet and konbini payments through KOMOJU, and a live
Instagram feed on the home page.

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.

---

## ⚠️ Before you take real money — read this first

This is a complete, working shop, but **it is not yet ready to charge real
customers.** Three things must happen first. They are listed in full in
[Launch checklist](#launch-checklist) below; the short version:

1. **Fill in the highlighted legal fields.** `/legal/tokushoho` renders unfilled
   required fields in red. Japanese law requires them.
2. **Replace the order storage.** Orders currently live in memory and the server
   log (`lib/orders.ts`). Payments are taken correctly regardless — KOMOJU is
   the record for money — but you cannot run a shop off log lines.
3. **Run one real test-mode purchase.** The KOMOJU and Instagram integrations
   were written against the documented APIs and type-check, but **no live call
   was ever made from the build environment**, which blocks outbound requests to
   `komoju.com` and `graph.instagram.com`. They are unproven until you try them.

---

## Running it locally

You need [Node.js](https://nodejs.org/) (LTS) and [Git](https://git-scm.com/).
After installing either on Windows, open a **new** terminal — PATH only
updates in new windows.

**macOS / Linux**

```bash
git clone https://github.com/dragonflyllj/patisserie-layers.git
cd patisserie-layers
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

**Windows**

Works in both PowerShell and Command Prompt:

```powershell
cd $HOME\Documents          # Command Prompt: cd %USERPROFILE%\Documents
git clone https://github.com/dragonflyllj/patisserie-layers.git
cd patisserie-layers
npm install
copy .env.example .env.local
npm run dev
```

Then open <http://localhost:3000>.

Three Windows notes. `copy` is the equivalent of `cp`. `#` does not start a
comment in Command Prompt, so paste commands without any trailing notes. And
work in your own folder (Documents, say), never in `C:\Windows\System32`.

PowerShell and Command Prompt are **not** interchangeable — a `PS >` prompt
means PowerShell, where cmd-style switches such as `/s /q` are rejected. Where
the two differ, both are given below.

To edit the environment file on Windows: `notepad .env.local`

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Unit tests for the pricing engine |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

The site runs with **no environment variables at all** — the Instagram section
falls back to a link card, and checkout fails at the payment step with a clear
message. That is deliberate, so you can work on the design without credentials.

---

## Setting up payments (KOMOJU)

KOMOJU is a Japanese payment provider covering cards, the local QR wallets and
konbini. We use its **hosted payment page**: the customer is redirected to
KOMOJU to pay and returns afterwards.

**Card numbers never touch this server.** That keeps the shop in the lightest
PCI-DSS category (SAQ A). Do not later replace this with your own card fields —
it would change your compliance obligations substantially.

### Steps

1. Sign up at [komoju.com](https://komoju.com) and complete merchant review.
2. **Settings → API keys** → copy the **test** secret key (`sk_test_…`) into
   `KOMOJU_SECRET_KEY` in `.env.local`.
3. **Settings → Payment methods** → enable the methods you want. Anything not
   enabled simply will not appear at checkout. The site offers, in order:
   credit card, PayPay, LINE Pay, Merpay, au PAY, Rakuten Pay, konbini —
   see `PAYMENT_TYPES` in `lib/komoju.ts`.
4. **Webhooks** → add `https://<your-domain>/api/webhooks/komoju` and copy the
   signing secret into `KOMOJU_WEBHOOK_SECRET`.
   For local testing, expose your dev server with a tunnel (`ngrok http 3000`)
   and register that URL instead.
5. **Run a full test purchase**, then check that:
   - the redirect to KOMOJU works and shows your enabled payment methods;
   - the amount on KOMOJU's page matches the site's total exactly;
   - after paying, you land back on `/checkout/complete` with an order number;
   - the server log shows `[order:paid]` — this proves the webhook arrived
     **and** its signature verified.
6. Only then swap in the live key (`sk_live_…`) and the live webhook secret.

### If the API shape has drifted

Everything KOMOJU-specific lives in **`lib/komoju.ts`** and nowhere else. If a
request fails, compare that one file against the current
[KOMOJU docs](https://docs.komoju.com/) — the session-creation body and the
webhook signature header are the two things most worth checking.

### A note on konbini

Konbini payments settle *later* — the customer pays at a convenience store
hours or days after checking out. Those orders stay `pending` until the webhook
fires. That is correct behaviour, not a bug.

---

## Setting up the Instagram feed

The home page pulls recent posts from
[@patisserielayers](https://www.instagram.com/patisserielayers/) at request time
and caches them for 30 minutes. No images are copied into this repository — the
photos stay on Instagram's CDN and the feed always reflects the live account.

Meta **retired the Instagram Basic Display API in December 2024**. This uses its
replacement, the *Instagram API with Instagram Login*, which requires the
account to be a **Business or Creator** account.

1. In the Instagram app: **Settings → Account type** → switch to Business or
   Creator.
2. At [developers.facebook.com](https://developers.facebook.com), create an app
   and add **Instagram → API setup with Instagram login**.
3. Generate a long-lived Instagram User Access Token for the account.
4. Put it in `.env.local` as `INSTAGRAM_ACCESS_TOKEN`.

**⚠️ The token expires after 60 days.** `lib/instagram.ts` exports
`refreshAccessToken()` for this; call it from a monthly scheduled job and write
the new token back to your secret store. If the token lapses, the feed quietly
falls back to the "view on Instagram" card — the shop keeps working, but the
photos stop updating and nothing will alert you.

---

## How the money is kept honest

The one property worth understanding before changing any of this:

> **The browser never sends a price. Not once.**

The cart in the customer's browser holds only product IDs and quantities
(`lib/cart.tsx`). At checkout, `/api/checkout` re-reads every price from
`lib/products.ts` and every shipping fee from `lib/shipping.ts`, computes the
total itself, and sends *that* figure to KOMOJU. A customer editing
localStorage, or POSTing a forged payload directly, can change what they order
but never what it costs.

Two rules follow, and both are load-bearing:

- **Never accept a price, subtotal or total from the client.** If you add a
  discount code or a gift-wrap fee, compute it server-side in `lib/order.ts`.
- **Never process a webhook without verifying its signature.**
  `/api/webhooks/komoju` is a public URL; the HMAC is the only thing separating
  a genuine KOMOJU callback from anyone on the internet claiming an order was
  paid.

`npm test` covers the pricing engine, including price tampering, forged
shipping regions and invalid quantities. If you change prices or shipping
rates, those tests will fail until you update the expected values — that is
intentional.

---

## Project layout

```
app/
  page.tsx                     Home: hero, concept, featured, Instagram, access
  shop/                        Catalog and per-product pages
  cart/  checkout/             Cart, customer details, order completion
  access/  about/              Store information, shop story
  legal/                       特定商取引法 / privacy / terms
  api/checkout/                Creates the KOMOJU session  ← trust boundary
  api/webhooks/komoju/         Payment notifications        ← trust boundary
components/                    Header, footer, product cards, Instagram feed
lib/
  shop.ts                      Address, hours, phone — edit once, used everywhere
  products.ts                  THE CATALOG. Source of truth for prices.
  shipping.ts                  Regional shipping fees
  order.ts                     Pricing engine (shared by browser and server)
  customer.ts                  Checkout field validation
  komoju.ts                    All KOMOJU API code, isolated here
  instagram.ts                 Instagram Graph API client
  orders.ts                    Order records — ⚠️ replace before launch
tests/                         Pricing engine tests (`npm test`)
```

## Everyday edits

| To change… | Edit |
| --- | --- |
| Address, phone, opening hours | `lib/shop.ts` |
| Products, prices, allergens | `lib/products.ts` |
| Shipping fees, free-shipping threshold | `lib/shipping.ts` |
| Accepted payment methods | `PAYMENT_TYPES` in `lib/komoju.ts` |
| Colours and fonts | `@theme` block in `app/globals.css` |

### Adding photos

Adding a photo is one action: **drop the file in the right folder.** There is
no code to edit.

| Folder | Filename | Result |
| --- | --- | --- |
| `public/products/` | the product's ID, e.g. `egg-tart-4.jpg` | Shown for that product |
| `public/site/` | `hero.jpg` | Home page hero background |
| `public/site/` | `about-layers.jpg`, `about-interior.jpg` | Images on the about page |

Each folder has a README listing every filename it accepts. `scripts/scan-images.mjs`
scans both folders before `npm run dev` and `npm run build` and writes
`lib/images.generated.ts`, which the components read.

Anything without a file keeps its placeholder, so a partial set is fine — you
can add photos one at a time as they are shot.

Product images are displayed in a square frame and cropped to fill, so square
originals work best. Around 1200×1200 is plenty; Next.js resizes per screen.

**⚠️ Replacing a photo with the same filename:** Next.js caches the *optimised*
version of each image on disk, keyed by its path. Overwrite `egg-tart-4.jpg`
with a different picture and the old one will keep appearing until you clear
that cache:

```powershell
Remove-Item -Recurse -Force .next\cache\images    # Windows PowerShell
```
```bat
rmdir /s /q .next\cache\images                    :: Windows Command Prompt
```
```bash
rm -rf .next/cache/images                          # macOS / Linux
```

Then restart. This bites exactly when swapping placeholder photos for real
ones, which is the most likely time you'll hit it.

---

## Deploying

Any host that runs Next.js works. Vercel and Netlify both deploy this from the
repository with no configuration.

Set these in the host's environment settings:

- `NEXT_PUBLIC_SITE_URL` — **must match the live domain exactly.** It builds the
  return URL KOMOJU redirects to after payment; a wrong value sends paying
  customers to the wrong place.
- `KOMOJU_SECRET_KEY`, `KOMOJU_WEBHOOK_SECRET`
- `INSTAGRAM_ACCESS_TOKEN`

Then update the webhook URL in the KOMOJU dashboard to the live domain.

**On serverless hosts** (Vercel, Netlify Functions), note that the checkout
request and the webhook may run in different instances, so the in-memory order
store in `lib/orders.ts` will usually not find the order the checkout just
wrote. It logs a warning saying exactly that. Replacing that module with real
storage fixes it.

---

## Launch checklist

**Legal — required**
- [ ] `/legal/tokushoho` — fill every field shown in red (representative's name)
- [ ] Confirm the return/refund and cancellation terms match how you operate
- [ ] Add the effective dates on the privacy policy and terms pages
- [ ] Set `SHOP.email` in `lib/shop.ts` to an address you actually monitor

**Shop details — pre-filled from public listings, please verify**
- [ ] Postal code and address (`lib/shop.ts`)
- [ ] Phone number
- [ ] Opening hours and closed days — the listing showed Wed–Sat only
- [ ] Map coordinates (`SHOP.geo`) — approximate, derived from the address
- [ ] Walking directions on `/access` — **these were invented to fit the
      address, not walked.** Rewrite or delete them.
- [ ] `/about` page copy — plausible but written, not reported. Replace it.

**Shop setup**
- [ ] Replace the catalog in `lib/products.ts` with your real lineup and prices
- [ ] Check allergen declarations on every product against your recipes
- [ ] Replace shipping rates in `lib/shipping.ts` with your courier's actual rates
- [ ] Replace the AI-generated placeholder photos with real photography of
      your actual products (see [Adding photos](#adding-photos)) — **required
      before taking real orders**, since photos of items customers receive
      must show the real thing (景品表示法)

**Technical**
- [ ] Replace the order store in `lib/orders.ts` with a database
- [ ] Add order-confirmation email (see the `TODO` in `markOrderPaid`)
- [ ] Complete one KOMOJU test purchase end to end, then switch to live keys
- [ ] Verify the Instagram feed renders with a real token
- [ ] Schedule the monthly Instagram token refresh

---

## What was and was not verified

Built and checked in a sandbox with no outbound access to `komoju.com`,
`graph.instagram.com`, `tabelog.com` or `instagram.com`.

**Verified:** production build; TypeScript; ESLint; 14 pricing-engine unit
tests; every page renders (200) and unknown products 404; the checkout API
rejects empty carts, unknown products, invalid quantities, forged shipping
regions, missing regions, invalid emails and phone numbers, past pickup dates
and malformed JSON; the webhook rejects unsigned, wrongly-signed and
tampered-body requests (401) and accepts a correctly-signed one (200); the full
shopping flow in a real browser — add to cart, badge count, persistence across
reload, live shipping recalculation by region, and a valid order reaching the
payment step; no horizontal overflow at 320/390/640px.

The image pipeline was exercised end to end with temporary stand-in files
(added, picked up by the scan, rendered on every page, then removed), so
dropping real photos in is a proven path.

**Not verified:** any live KOMOJU API call; any live Instagram API call; the
shop's real address, hours and phone number, which came from public listings
rather than from the business.

**Note on the placeholder photos:** the generated pastry images are stand-ins
for design purposes. They are not photographs of this shop's products and must
be replaced before the shop takes real orders.
