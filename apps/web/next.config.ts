import { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'packages');
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
