import Link from "next/link";
import { Check } from "lucide-react";
import type { SafeUser } from "@/lib/auth";
import Avatar from "@/components/avatar";
import { logoutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/auth/login", label: "Log in" },
  { href: "/auth/signup", label: "Create an account" },
];

export default function SiteHeader({ user }: { user: SafeUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#38261A]/10 bg-cream/95 px-4 py-2.5 backdrop-blur-sm sm:py-3">
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

        <nav aria-label="Account" className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              <span className="flex items-center gap-2">
                <Avatar
                  name={user.name}
                  seed={user.avatarSeed}
                  tint={user.avatarTint}
                  size={32}
                />
                <span className="hidden text-sm font-bold text-cocoa sm:inline">
                  {user.name}
                  {user.isGuest ? " (demo)" : ""}
                </span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border-cocoa-sm bg-cream px-3 py-1.5 text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border-cocoa-sm bg-cream px-3 py-1.5 text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep"
              >
                {link.label}
              </Link>
            ))
          )}
        </nav>
      </div>
    </header>
  );
}