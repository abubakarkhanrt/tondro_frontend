import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_TIMEOUT: process.env.REACT_APP_TIMEOUT || process.env.NEXT_PUBLIC_TIMEOUT,
    NEXT_PUBLIC_DEBUG: process.env.REACT_APP_DEBUG || process.env.NEXT_PUBLIC_DEBUG,
    NEXT_PUBLIC_ENABLE_AUDIT_LOG: process.env.REACT_APP_ENABLE_AUDIT_LOG || process.env.NEXT_PUBLIC_ENABLE_AUDIT_LOG,
    NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT: process.env.REACT_APP_ENABLE_DOMAIN_MANAGEMENT || process.env.NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
