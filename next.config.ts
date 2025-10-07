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
  },
};

export default nextConfig;
