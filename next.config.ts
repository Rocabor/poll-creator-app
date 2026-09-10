import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // ImageResponse (OG share card) runs on the edge runtime without
    // bundling of server-only Node code.
  },
};

export default nextConfig;