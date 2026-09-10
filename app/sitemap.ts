import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/products";
import { SITE_URL } from "@/lib/shop";

/**
 * Generates /sitemap.xml.
 *
 * Every product page is included so search engines can find the whole
 * catalog. Cart, checkout and order-completion are deliberately excluded —
 * they are per-customer and have nothing to index.
 *
 * @returns The sitemap entries.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/shop",
    "/about",
    "/access",
    "/legal/tokushoho",
    "/legal/privacy",
    "/legal/terms",
  ];

  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...PRODUCTS.map((product) => ({
      url: `${SITE_URL}/shop/${product.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
