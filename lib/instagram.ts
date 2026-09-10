/**
 * Live Instagram feed.
 *
 * Pulls recent posts from @patisserielayers at request time and caches them,
 * so nothing is copied into the repository — the site always shows whatever
 * is currently on the account, and the photos stay on Instagram's CDN.
 *
 * ── WHICH API THIS USES ──────────────────────────────────────────────────
 * The old *Instagram Basic Display API* was retired by Meta in December 2024.
 * This uses its replacement, the **Instagram API with Instagram Login**
 * (host `graph.instagram.com`), which requires the account to be a
 * **Business or Creator** account, not a personal one.
 *
 * ── GETTING A TOKEN ──────────────────────────────────────────────────────
 *  1. Switch @patisserielayers to a Business or Creator account in the
 *     Instagram app (Settings → Account type).
 *  2. Create an app at developers.facebook.com and add the product
 *     "Instagram" → "API setup with Instagram login".
 *  3. Generate a long-lived Instagram User Access Token for the account.
 *  4. Put it in `.env.local` as INSTAGRAM_ACCESS_TOKEN.
 *
 * ⚠️ Long-lived tokens expire after 60 days. See `refreshAccessToken` below —
 * you must refresh it periodically or the feed will silently fall back to the
 * "view on Instagram" card. Set a calendar reminder, or run the refresh from
 * a monthly cron.
 *
 * NOTE: this integration could not be tested end-to-end from the build
 * environment, which blocks outbound requests to graph.instagram.com. The
 * request shape follows Meta's documented API; verify it with one real call
 * once you have a token (`npm run dev`, then load the home page).
 */

/** Graph API version pinned so Meta's rollouts cannot change behaviour under us. */
const GRAPH_VERSION = "v21.0";

/** How long (seconds) to cache the feed. 30 min keeps the account's rate limit safe. */
const CACHE_SECONDS = 1800;

/** A post as returned by the media endpoint. */
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  /** Full-size media. For VIDEO this is the video file, not an image. */
  media_url: string;
  /** Poster frame; present only on VIDEO items. */
  thumbnail_url?: string;
  /** Canonical instagram.com URL for the post. */
  permalink: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
};

/**
 * Chooses the correct still image to render for a post.
 *
 * Video posts have a `media_url` pointing at an MP4; rendering that in an
 * `<img>` would show nothing, so their `thumbnail_url` is used instead.
 *
 * @param media - A post from the feed.
 * @returns A URL that is safe to use as an image source.
 */
export function displayImageUrl(media: InstagramMedia): string {
  return media.media_type === "VIDEO" && media.thumbnail_url
    ? media.thumbnail_url
    : media.media_url;
}

/**
 * Fetches recent posts from the connected Instagram account.
 *
 * Designed never to throw: the Instagram feed is decoration, and an expired
 * token or a Meta outage must not take the shop offline. Every failure path
 * logs a diagnostic on the server and returns an empty array, which the feed
 * component renders as a link to the profile instead.
 *
 * @param limit - Maximum number of posts to return. Defaults to 8.
 * @returns Recent posts, newest first, or an empty array on any failure.
 */
export async function fetchInstagramMedia(
  limit = 8,
): Promise<InstagramMedia[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  // Not configured yet — expected during initial setup, so this is a quiet
  // no-op rather than an error.
  if (!token) return [];

  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
  ].join(",");

  const url =
    `https://graph.instagram.com/${GRAPH_VERSION}/me/media` +
    `?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(url, {
      // Next caches the response for CACHE_SECONDS, so a burst of visitors
      // results in one upstream call rather than one per page view.
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      // 190 = token expired or revoked; that is the common case here.
      const body = await response.text();
      console.error(
        `[instagram] feed request failed (${response.status}): ${body.slice(0, 300)}`,
      );
      return [];
    }

    const payload = (await response.json()) as { data?: InstagramMedia[] };
    const items = payload.data ?? [];

    // Defensive: drop anything without a usable image so the grid cannot
    // render a broken tile.
    return items.filter((item) => Boolean(displayImageUrl(item)));
  } catch (error) {
    console.error("[instagram] feed request threw:", error);
    return [];
  }
}

/**
 * Exchanges a long-lived token for a fresh one, resetting its 60-day clock.
 *
 * Meta only allows this for tokens that are at least 24 hours old and not yet
 * expired — once a token lapses there is no refresh path and you must
 * generate a new one by hand. Call this from a scheduled job roughly monthly
 * and write the result back to your environment/secret store.
 *
 * @param currentToken - The long-lived token to refresh.
 * @returns The new token and its lifetime in seconds, or null on failure.
 */
export async function refreshAccessToken(
  currentToken: string,
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const url =
    "https://graph.instagram.com/refresh_access_token" +
    `?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;

  try {
    // `cache: "no-store"` because a token refresh must never be served from
    // a cache — a stale response would hand back a token about to expire.
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      console.error(`[instagram] token refresh failed (${response.status})`);
      return null;
    }
    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  } catch (error) {
    console.error("[instagram] token refresh threw:", error);
    return null;
  }
}
