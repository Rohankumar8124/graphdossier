import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // kuzu is a native Node addon — keep it external to the server bundle.
  serverExternalPackages: ["kuzu"],
};

export default nextConfig;
