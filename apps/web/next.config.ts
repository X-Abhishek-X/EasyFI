import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@easyfi/contracts',
    '@easyfi/core',
    '@easyfi/data-sources',
    '@easyfi/db',
    '@easyfi/services',
  ],
};

export default nextConfig;
