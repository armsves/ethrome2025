import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Remove mini-css-extract-plugin if present and let Next.js handle CSS
    config.plugins = config.plugins?.filter(
      (plugin: any) => plugin?.constructor?.name !== 'MiniCssExtractPlugin'
    );
    return config;
  },
};

export default nextConfig;
