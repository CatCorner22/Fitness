import type { NextConfig } from "next";
import { allowedPreviewOrigins, isReplitRuntime } from "./src/lib/runtime";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: allowedPreviewOrigins(),
};

if (isReplitRuntime()) {
  // Next 16 still honors this at runtime for request.url behind a TLS proxy.
  nextConfig.experimental = {
    ...nextConfig.experimental,
    trustHostHeader: true,
  } as NextConfig["experimental"];
}

export default nextConfig;
