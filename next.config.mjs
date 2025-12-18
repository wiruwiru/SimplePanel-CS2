/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "build",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      }
    ],
  },
  env: {
    version: process.env.npm_package_version,
  },
  reactCompiler: true,
};

export default nextConfig;