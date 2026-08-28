#!/usr/bin/env node
/**
 * Builds for Cloudflare with runtime secrets withheld.
 *
 * The OpenNext adapter writes .env.local into
 * .open-next/cloudflare/next-env.mjs so the Worker can read it. That file ships
 * with the deployment, so any secret present at build time becomes readable by
 * anyone who requests it. This happened once already: the admin token was
 * served at a guessable URL and was live.
 *
 * Secrets belong in `wrangler secret put` / `wrangler pages secret put`, which
 * inject at runtime and never enter the bundle. This script removes them from
 * .env.local for the duration of the build, restores it afterwards, and then
 * greps the output to prove none of them made it in. It exits non zero if any
 * did, so a leak fails the build instead of shipping.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SECRETS = ["RATIO_ADMIN_TOKEN"];
const ENV = ".env.local";
const BACKUP = ".env.local.build-backup";

const values = [];
let restored = false;

function restore() {
  if (restored) return;
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, ENV);
    unlinkSync(BACKUP);
  }
  restored = true;
}
process.on("exit", restore);
process.on("SIGINT", () => { restore(); process.exit(130); });

if (existsSync(ENV)) {
  const original = readFileSync(ENV, "utf8");
  copyFileSync(ENV, BACKUP);
  const kept = [];
  for (const line of original.split("\n")) {
    const key = line.split("=")[0]?.trim();
    if (SECRETS.includes(key)) {
      const v = line.slice(line.indexOf("=") + 1).trim();
      if (v) values.push(v);
      continue;
    }
    kept.push(line);
  }
  writeFileSync(ENV, kept.join("\n"));
  console.log(`withheld ${values.length} secret(s) from the build`);
}

execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
restore();

// Prove it rather than trust it.
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const leaked = [];
if (values.length && existsSync(".open-next")) {
  for (const file of walk(".open-next")) {
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    if (values.some((v) => text.includes(v))) leaked.push(file);
  }
}

if (leaked.length) {
  console.error("\nBUILD FAILED: a runtime secret is present in the build output:");
  for (const f of leaked) console.error("  " + f);
  console.error("These files ship with the deployment and are publicly readable.");
  process.exit(1);
}
console.log("verified: no runtime secret is present in .open-next");
