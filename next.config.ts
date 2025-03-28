import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "picsum.photos",
      },
    ],
  },
  experimental: {
    nodeMiddleware: true,
  }
};

export default nextConfig;
