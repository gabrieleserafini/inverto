import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
