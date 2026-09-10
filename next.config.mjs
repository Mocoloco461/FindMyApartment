/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.yad2.co.il' },
      { protocol: 'https', hostname: '**.madlan.co.il' },
      { protocol: 'https', hostname: '**.komo.co.il' },
      { protocol: 'https', hostname: '**.homeless.co.il' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'realta.co.il' },
    ],
  },
};

export default nextConfig;
