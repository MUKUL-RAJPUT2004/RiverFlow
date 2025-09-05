import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io', 
        port: '',
        pathname: '/v1/storage/buckets/**',
      },
    ],
  },
  // Fix for Google Fonts compatibility with Turbopack
  experimental: {
    optimizePackageImports: ['@vercel/turbopack-next'],
  },
};

export default nextConfig;
