/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['sequelize', 'mysql2'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/services/:service',
        destination: '/hospitals/:service/india',
        permanent: true,
      },
      {
        source: '/service/:service',
        destination: '/hospitals/:service/india',
        permanent: true,
      },
      {
        source: '/hospitals/:slug',
        destination: '/hospital/:slug',
        permanent: true,
      },
      {
        source: '/blogs',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blogs/:slug*',
        destination: '/blog/:slug*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
