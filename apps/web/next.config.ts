// import { NextConfig } from 'next';
// import path from 'path';

// const nextConfig: NextConfig = {
//   webpack: (config) => {
//     config.resolve.alias['@'] = path.resolve(__dirname, 'packages');
//     return config;
//   },
//   eslint: {
//     ignoreDuringBuilds: true
//   }
// };

// export default nextConfig;
import path from 'path';
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    // alias @ -> packages (hoặc @packages)
    config.resolve.alias['@packages'] = path.resolve(__dirname, '../../packages');
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // rất quan trọng với monorepo pnpm
  transpilePackages: ['@packages/core'], // tất cả packages bạn import trong web
};

export default nextConfig;
