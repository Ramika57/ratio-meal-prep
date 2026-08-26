"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

/**
 * Records a page view on first paint and on every client side navigation.
 *
 * The first party pipeline always runs. Google Analytics and Plausible are
 * optional and only mount when their environment variable is present, so the
 * site works with no accounts configured and gains a second source of truth
 * the moment one is.
 */
export default function Analytics() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    track("page_view");
  }, [pathname]);

  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      {ga ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      ) : null}
      {plausible ? (
        <Script
          defer
          data-domain={plausible}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
