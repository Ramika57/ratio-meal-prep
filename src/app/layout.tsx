import type { Metadata, Viewport } from "next";
import Analytics from "@/components/analytics/Analytics";
import RevealRoot from "@/components/ui/RevealRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "RATIO | Hit your macros without cooking",
  description:
    "High protein, low carb meal prep portioned to the calorie target you set. Choose your goal, your calories and your days. Cooked in Melbourne, delivered chilled.",
  openGraph: {
    title: "RATIO | Hit your macros without cooking",
    description:
      "High protein, low carb meal prep portioned to the calorie target you set. Cooked in Melbourne, delivered chilled.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0e10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-ink text-bone">
        {/* Runs before any content paints. Reveal animations only get to hide
            content when scripting is live to unhide it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-signal focus:px-5 focus:py-2.5 focus:text-ink"
        >
          Skip to content
        </a>
        {children}
        <RevealRoot />
        <Analytics />
      </body>
    </html>
  );
}
