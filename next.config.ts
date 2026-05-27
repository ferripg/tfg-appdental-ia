import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // 5 MB de PDF + headers + overhead; pugem el límit per defecte (1 MB).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
