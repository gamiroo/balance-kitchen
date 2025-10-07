import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  // Edge runtime is default; override per route if needed
  // experimental: { serverActions: true }, // not required in v15
  images: {
    remotePatterns: [
      { hostname: 'res.cloudinary.com', protocol: 'https' },
    ],
    domains: [
      'images.unsplash.com',
      'localhost', // for local development
      'your-domain.com', // add your production domain
    ],
  },
  // Optional: configure image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
};

export default nextConfig;
