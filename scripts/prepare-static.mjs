#!/usr/bin/env node
/**
 * Rewrites the app for a static export.
 *
 * GitHub Pages serves files, not a Node runtime, so anything that needs a
 * server has to come out of the build. This script is destructive and is meant
 * to run only inside CI on a throwaway checkout, never against a working tree.
 *
 * Removed: the API routes, the insights dashboard and the order confirmation
 * page, all of which read or write the file database at request time.
 * Rewritten: force-dynamic pages become static, since their data (the menu, the
 * research file) is known at build time and only changes when the repo does.
 */
import { rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";

if (process.env.CI !== "true" && process.env.FORCE_STATIC_PREP !== "1") {
  console.error("refusing to run outside CI: this deletes source files.");
  process.exit(1);
}

const remove = [
  "src/app/api",
  "src/app/insights",
  "src/app/order",
];
for (const path of remove) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log("removed  " + path);
  }
}

const pages = ["src/app/page.tsx", "src/app/build/page.tsx"];
for (const path of pages) {
  if (!existsSync(path)) continue;
  let src = readFileSync(path, "utf8");
  src = src.replace(
    /\n\/\/ Reads data\/meals\.json per request[^\n]*\nexport const dynamic = "force-dynamic";\n/g,
    "\n",
  );
  src = src.replace(/\nexport const dynamic = "force-dynamic";\n/g, "\n");
  writeFileSync(path, src);
  console.log("made static  " + path);
}

// The footer links to /insights, which no longer exists in this build.
const footer = "src/components/site/Footer.tsx";
if (existsSync(footer)) {
  let src = readFileSync(footer, "utf8");
  src = src.replace(
    /<FooterCol title="Company" links=\{\[\{ href: "\/insights", label: "Live demand" \}\]\} \/>/,
    '<FooterCol title="Company" links={[{ href: "/#compare", label: "How we compare" }]} />',
  );
  writeFileSync(footer, src);
  console.log("relinked  " + footer);
}

console.log("static preparation complete");
