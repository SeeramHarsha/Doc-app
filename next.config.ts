import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["localhost:3000", "192.168.1.34:3000"],
  output: "standalone",
  reactCompiler: true,
  images: { unoptimized: true },
};

export default nextConfig;
