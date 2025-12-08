// import { fileURLToPath } from "url";
// import path from 'path';
// import { NextConfig } from "next";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const nextConfig: NextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   outputFileTracingRoot: path.join(__dirname, '../../'),
//   webpack: (config) => {
//     config.resolve.alias["@packages"] = path.resolve(__dirname, "../../packages");
//     return config;
//   },
//   experimental: {
//     esmExternals: "loose",
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "ceocmvtxpdqgmremuqgb.supabase.co",
//         port: "",
//         pathname: "/storage/v1/object/**",
//       },
//     ],
//   },
//   async rewrites() {
//     return [
//       {
//         source: "/api/:path*",
//         destination: "https://kltn2025-nhom39-solienlacdientu.onrender.com/api/:path*", // ← BE Render
//       },
//     ];
//   },
// };

// export default nextConfig;

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),

  experimental: {
    turbo: {
      resolveAlias: {
        "@packages": path.resolve(__dirname, "../../packages"),
      },
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ceocmvtxpdqgmremuqgb.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },

  rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://kltn2025-nhom39-solienlacdientu.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;