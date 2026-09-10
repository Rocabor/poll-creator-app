import type { Metadata, Viewport } from "next";
import { Gabarito, Karla } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import SiteHeader from "@/components/site-header";

const gabarito = Gabarito({
  subsets: ["latin"],
  variable: "--font-gabarito",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tiebreak — group votes that live in the chat",
    template: "%s · Tiebreak",
  },
  description:
    "Create a poll, drop the link in the group chat. Friends tap to vote — no accounts — and the results land with names attached.",
};

export const viewport: Viewport = {
  themeColor: "#faf2e3",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${gabarito.variable} ${karla.variable}`}>
      <body className="paper-grain min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-teal focus:px-4 focus:py-2 focus:font-bold focus:text-cream"
        >
          Skip to content
        </a>

        {/* Single polite live region for all status announcements. */}
        <div
          id="live-region"
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="sr-only"
        />

        <SiteHeader user={user} />

        <main id="main" className="min-h-[60dvh]">
          {children}
        </main>

        <footer className="mx-auto mt-16 max-w-5xl border-t-2 border-cocoa/20 px-4 py-8 text-sm text-cocoa-soft">
          <p>
            <span className="font-display font-bold text-cocoa">tiebreak</span>{" "}
            — group votes that live in the group chat.
          </p>
          <p className="mt-1">
            Made for the{" "}
            <Link
              href="https://www.frontendmentor.io"
              className="underline underline-offset-2 hover:text-teal"
            >
              Frontend Mentor
            </Link>{" "}
            Poll Creator App challenge.
          </p>
        </footer>
      </body>
    </html>
  );
}