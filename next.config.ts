import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "picsum.photos",
      },
      {
        hostname: "picwall-webtech.s3.us-east-1.amazonaws.com",
      }
    ],
  },
  experimental: {
    nodeMiddleware: true,
  }
};

export default nextConfig;
