import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Enables static export
  allowedDevOrigins: [
    '3000-tondroai-rolus-abubakar.cluster-sjj3zsn3ffchivwccxsgsswqek.cloudworkstations.dev',
  ],
};

export default nextConfig;
