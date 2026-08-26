"use client";

import type { EventName } from "./analytics";

const SESSION_KEY = "ratio.session";

/** Random per tab id. Not a cookie, not persisted, gone when the tab closes. */
export function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

function device(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1180) return "tablet";
  return "desktop";
}

function referrerHost(): string | undefined {
  if (typeof document === "undefined" || !document.referrer) return undefined;
  try {
    const host = new URL(document.referrer).host;
    return host === window.location.host ? undefined : host;
  } catch {
    return undefined;
  }
}

/**
 * Fire and forget. Uses sendBeacon so an event queued as the user closes the
 * tab still arrives, which is the whole point when measuring abandonment.
 */
export function track(name: EventName, props?: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    name,
    session: sessionId(),
    path: window.location.pathname,
    device: device(),
    source: referrerHost(),
    props,
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through to fetch
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
