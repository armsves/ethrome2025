import type { NextConfig } from "next";
import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Remove mini-css-extract-plugin if present and let Next.js handle CSS
    config.plugins = config.plugins?.filter(
      (plugin: any) => plugin?.constructor?.name !== 'MiniCssExtractPlugin'
    );

    // Ignore optional peer dependencies that cause warnings
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
      },
    };

    // Suppress warnings for optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@solana\/wallet-adapter-react/ },
      { module: /node_modules\/@react-native-async-storage/ },
      { module: /node_modules\/pino-pretty/ },
    ];

    return config;
  },
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: "0b237c82-2283-43b1-84b1-1edb63f82038"
});

export default withCivicAuth(nextConfig);
