/** @type {import('next').NextConfig} */
const basePath = process.env.SINGLE_SERVICE === 'true' ? '/web' : undefined;

const nextConfig = {
  basePath,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return [
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
