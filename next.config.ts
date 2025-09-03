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
};

export default nextConfig;
