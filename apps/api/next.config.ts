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
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // 👇 alias đến thư mục packages trong monorepo
    config.resolve.alias["@packages"] = path.resolve(__dirname, "../../packages");
    return config;
  },
  // 👇 phần cực quan trọng cho monorepo
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    esmExternals: "loose",
    serverComponentsExternalPackages: ["@packages", "@packages/core", "@packages/utils", "@packages/data"],
  },
};

export default nextConfig;
