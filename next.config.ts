import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * `images.remotePatterns` whitelists the CDN hosts we are allowed to render
 * through `next/image`. Instagram serves post media from rotating
 * `*.cdninstagram.com` / `*.fbcdn.net` subdomains, so both are listed —
 * without them the live Instagram feed would fail to render its thumbnails.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
};

export default nextConfig;
