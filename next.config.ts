import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    REOWN_PROJECT_ID: process.env.REOWN_PROJECT_ID || "",
    PROJECT_ID: process.env.PROJECT_ID || "",
    NEXT_REOWN_PROJECT_ID: process.env.NEXT_REOWN_PROJECT_ID || "",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
  },
  webpack: (config) => {
    config.cache = false;
    config.devtool = false;
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      "@react-native-async-storage/async-storage": false,
    };
    config.externals = [...(config.externals || []), "pino-pretty", "lokijs", "encoding"];
    return config;
  },
};

export default nextConfig;
