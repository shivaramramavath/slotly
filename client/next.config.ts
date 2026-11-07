import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/library/subject',
        destination: '/library/subjects',
        permanent: true,
      },
      {
        source: '/library/room',
        destination: '/library/rooms',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
