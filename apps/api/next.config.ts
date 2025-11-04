import { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias['@packages'] = path.resolve(__dirname, 'packages');
    return config;
  },
  eslint: {
    // Không fail build do ESLint warnings/errors
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
