import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  removeConsole: {
    exclude: ['error'],
  },
};

export default nextConfig;
