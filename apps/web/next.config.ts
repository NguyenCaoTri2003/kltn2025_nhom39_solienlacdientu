// import { NextConfig } from 'next';
// import path from 'path';

// const nextConfig: NextConfig = {
//   webpack: (config) => {
//     config.resolve.alias['@packages'] = path.resolve(__dirname, 'packages');
//     return config;
//   },
//   eslint: {
//     ignoreDuringBuilds: true
//   }
// };

// export default nextConfig;
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
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://kltn2025-nhom39-solienlacdientu.onrender.com/api/:path*", // ← BE Render
      },
    ];
  },
};

export default nextConfig;