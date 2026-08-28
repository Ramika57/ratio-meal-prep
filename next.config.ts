import type { NextConfig } from "next";

/**
 * Two build targets from one source.
 *
 * Default: a normal server build, where the API routes and the file database
 * work. Set STATIC_EXPORT=1 (CI does, for GitHub Pages) and it emits a static
 * site instead: no Node runtime, so scripts/prepare-static.mjs strips the parts
 * that need one first.
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const repo = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Without this, Next walks up to /Users/ramika and picks up an unrelated
  // package-lock.json as the workspace root.
  turbopack: { root: __dirname },
  // The floating dev badge sits on top of the builder's fixed footer bar.
  devIndicators: false,

  ...(isStatic
    ? {
        output: "export" as const,
        // A project page is served from /<repo>, not the domain root.
        basePath: repo,
        assetPrefix: repo || undefined,
        // The image optimiser is a server feature; Pages has no server.
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
