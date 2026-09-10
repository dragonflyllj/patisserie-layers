import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/shop";

/**
 * Generates /robots.txt.
 *
 * Blocks the transactional and API routes: they contain per-customer data,
 * and crawling them would be pointless at best.
 *
 * @returns The robots.txt rules.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/cart", "/checkout"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
