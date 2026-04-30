/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `docx` ships ESM that should run on the server runtime when used inside
  // a route handler; client-side usage works through the regular bundler.
  experimental: {
    serverComponentsExternalPackages: ["docx"],
  },
};

module.exports = nextConfig;
