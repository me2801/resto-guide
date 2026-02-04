/** @type {import('next').NextConfig} */
const basePath = process.env.SINGLE_SERVICE === 'true' ? '/mobile' : undefined;

const nextConfig = {
  basePath,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return [
      // Proxy auth pages, static files, and API to backend
      {
        source: '/auth/:path*',
        destination: `${apiUrl}/auth/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${apiUrl}/static/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
