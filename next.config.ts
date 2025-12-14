import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ❌ Quita esto
  // output: "export",

  // ✅ Usa esto en su lugar
  output: "standalone",

  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
