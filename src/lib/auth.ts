import { NextResponse } from "next/server";

/**
 * Guard for anything that reads back what customers submitted.
 *
 * The reservation store holds a name, an email and a postcode for every person
 * who fills in the form. Once this app is on a public URL, an unguarded
 * GET /api/orders is a one request dump of all of it, so the read endpoints and
 * the insights dashboard require a token.
 *
 * Fails closed: if RATIO_ADMIN_TOKEN is unset in production, access is denied
 * rather than allowed. A misconfigured deploy should lock you out, not expose
 * other people's details.
 */
export function adminToken(): string | null {
  const token = process.env.RATIO_ADMIN_TOKEN?.trim();
  return token ? token : null;
}

/** Constant time compare, so the token cannot be recovered by timing guesses. */
function matches(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAuthorised(supplied: string | null | undefined): boolean {
  const token = adminToken();
  // Local development without a token configured stays open for convenience.
  if (!token) return process.env.NODE_ENV !== "production";
  if (!supplied) return false;
  return matches(supplied, token);
}

/** Reads the token from either an Authorization header or a key query param. */
export function tokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  try {
    return new URL(request.url).searchParams.get("key");
  } catch {
    return null;
  }
}

export function deny() {
  return NextResponse.json(
    { error: "Not authorised. This endpoint returns customer details and requires a token." },
    { status: 401 },
  );
}
