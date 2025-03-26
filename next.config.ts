import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public-cdn.bblmw.cn',
      },
    ],
  },
};

export default nextConfig;
