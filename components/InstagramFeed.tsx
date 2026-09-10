/**
 * Instagram feed section for the home page.
 *
 * An async server component: the API token is read on the server and never
 * shipped to the browser, and the fetched posts arrive as part of the HTML,
 * so there is no client-side loading spinner.
 *
 * When no token is configured — or Instagram is unreachable — this degrades
 * to a card linking to the profile, so the section is never empty or broken.
 */

import Image from "next/image";
import { fetchInstagramMedia, displayImageUrl } from "@/lib/instagram";
import { SHOP } from "@/lib/shop";

/**
 * Trims a caption down to a single readable line for the hover overlay.
 *
 * @param caption - The raw caption, which may contain newlines and hashtags.
 * @param maxLength - Character budget before truncation.
 * @returns A one-line summary, or an empty string when there is no caption.
 */
function summariseCaption(caption: string | undefined, maxLength = 60): string {
  if (!caption) return "";
  const firstLine = caption.split("\n")[0].trim();
  return firstLine.length > maxLength
    ? `${firstLine.slice(0, maxLength)}…`
    : firstLine;
}

export async function InstagramFeed() {
  const posts = await fetchInstagramMedia(8);
  const profileUrl = `https://www.instagram.com/${SHOP.instagram}/`;

  return (
    <section id="instagram" className="mx-auto max-w-6xl px-5 py-20 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="eyebrow">Instagram</p>
          <h2 className="font-display text-2xl sm:text-3xl mt-3">
            日々の焼き上がり
          </h2>
          <p className="text-sm text-muted mt-3 max-w-md leading-relaxed">
            その日の焼き菓子や、季節のケーキの入荷はInstagramでお知らせしています。
          </p>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:text-accent-deep border-b border-accent/40 pb-0.5"
        >
          @{SHOP.instagram} をフォロー ↗
        </a>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-sm bg-line/40"
            >
              <Image
                src={displayImageUrl(post)}
                alt={summariseCaption(post.caption) || "Instagramの投稿"}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                // Instagram CDN URLs are signed and short-lived; letting Next
                // optimise them would cache a URL that expires. Serving them
                // as-is keeps the feed working.
                unoptimized
              />
              {post.media_type === "VIDEO" && (
                <span
                  className="absolute top-2 right-2 text-paper text-xs drop-shadow"
                  aria-hidden
                >
                  ▶
                </span>
              )}
              <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/45 transition-colors flex items-end p-3">
                <span className="text-paper text-[11px] leading-snug opacity-0 group-hover:opacity-100 transition-opacity">
                  {summariseCaption(post.caption)}
                </span>
              </span>
            </a>
          ))}
        </div>
      ) : (
        /*
          Fallback shown when INSTAGRAM_ACCESS_TOKEN is unset or the API call
          failed. See lib/instagram.ts for the token setup steps.
        */
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-sm border border-dashed border-line bg-paper px-6 py-16 text-center hover:border-accent transition-colors"
        >
          <p className="font-display text-lg">@{SHOP.instagram}</p>
          <p className="text-sm text-muted mt-3">
            最新の投稿はInstagramでご覧いただけます。
          </p>
          <p className="text-xs text-accent mt-5">Instagramを開く ↗</p>
        </a>
      )}
    </section>
  );
}
