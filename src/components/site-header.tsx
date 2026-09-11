import Link from "next/link";
import { Check } from "lucide-react";
import type { SafeUser } from "@/lib/auth";
import SiteHeaderActions from "@/components/site-header-actions";

export default function SiteHeader({ user }: { user: SafeUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-cocoa/10 bg-cream/95 px-4 py-2.5 backdrop-blur-sm sm:py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg p-1 -ml-1"
          aria-label="Tiebreak — home"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-cocoa bg-tangerine shadow-sm transition-transform group-hover:scale-105">
            <Check
              aria-hidden="true"
              className="text-cream-bright"
              size={16}
              strokeWidth={3.2}
            />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-cocoa leading-none sm:text-2xl">
            Tiebreak
          </span>
        </Link>

        <SiteHeaderActions user={user} />
      </div>
    </header>
  );
}