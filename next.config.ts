import type { NextConfig } from "next";
import { allowedPreviewOrigins } from "./src/lib/runtime";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: allowedPreviewOrigins(),
  poweredByHeader: false,
};

export default nextConfig;
