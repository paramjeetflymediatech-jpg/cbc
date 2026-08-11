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
        source: '/hospitals/:service/india',
        destination: '/services/:service',
        permanent: true,
      },
      {
        source: '/hospitals/:service/india/',
        destination: '/services/:service',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
