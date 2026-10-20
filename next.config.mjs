/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // For direct high-FPS animation frames and WebGL/Canvas state
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
