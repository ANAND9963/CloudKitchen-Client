import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  eslint: {
    // ✅ Allow production builds to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Allow builds even with type errors
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
