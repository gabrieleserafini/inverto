import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        source: "/api/shopify/panel/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.APP_URL || "https://inverto-commerce.vercel.app" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization,X-Requested-With" },
        ],
      },
    ];
  },
};

export default nextConfig;
