// eslint is a valid Next.js config option but missing from some NextConfig type versions
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  turbopack: {},
};

module.exports = nextConfig;
