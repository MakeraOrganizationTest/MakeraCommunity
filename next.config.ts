import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb'
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.auth0.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'public-cdn.bblmw.cn',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'pub-c6657a8ca5ae479391474fda6501e587.r2.dev',
        pathname: '/**'
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true
  }
}

export default nextConfig
