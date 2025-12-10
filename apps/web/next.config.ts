import { fileURLToPath } from "url";
import path from 'path';
import { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config) => {
    config.resolve.alias["@packages"] = path.resolve(__dirname, "../../packages");
    return config;
  },
  experimental: {
    esmExternals: "loose",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ceocmvtxpdqgmremuqgb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://kltn2025-nhom39-solienlacdientu.onrender.com/api/:path*", 
      },
    ];
  },
};

export default nextConfig;