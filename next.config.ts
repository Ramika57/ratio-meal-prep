import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, Next walks up to /Users/ramika and picks up an unrelated
  // package-lock.json as the workspace root.
  turbopack: { root: __dirname },
  // The floating dev badge sits on top of the builder's fixed footer bar.
  devIndicators: false,
};

export default nextConfig;
