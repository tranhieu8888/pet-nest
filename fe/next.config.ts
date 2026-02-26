const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  },
  webpack(config, options) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    // 👇 Disable overlay if using Webpack
    if (options.dev && !options.isServer) {
      config.devServer = {
        ...(config.devServer || {}),
        client: {
          overlay: false,
        },
      };
    }

    return config;
  },

  // 👇 Tắt Turbopack
  experimental: {
    turbo: false,
  },
  devIndicators: false,
};

module.exports = nextConfig;
