/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.cache = false;
    config.resolve.symlinks = false;
    config.snapshot = {
      managedPaths: [],
      immutablePaths: [],
    };
    return config;
  },
};

export default nextConfig;
