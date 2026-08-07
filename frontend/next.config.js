/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  experimental: {
    // Disable segment explorer if enabled by default
  }
};

module.exports = nextConfig;
