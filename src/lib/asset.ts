/**
 * Prefixes a public asset path with the deployment base path.
 *
 * next/image applies basePath through its loader, but `unoptimized` images
 * bypass the loader entirely and emit the raw src. On a GitHub project page
 * served from /<repo>/ that resolves to the domain root and 404s. Everything
 * that points at /public goes through here instead.
 *
 * Empty for a root deployment, so this is a no-op outside Pages.
 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}
