import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching to ensure fresh builds on Railway
  generateBuildId: async () => {
    // Use timestamp to force new build ID each time
    return `build-${Date.now()}`;
  },
  // Add custom webpack config to change output file names
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Force new chunk names by adding timestamp
      const timestamp = Date.now();
      config.output.filename = `static/chunks/[name]-${timestamp}.js`;
      config.output.chunkFilename = `static/chunks/[name]-${timestamp}.js`;
    }
    return config;
  },
};

export default nextConfig;