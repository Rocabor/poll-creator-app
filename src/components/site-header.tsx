import Link from "next/link";
import type { SafeUser } from "@/lib/auth";
import Avatar from "@/components/avatar";
import { logoutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/auth/login", label: "Log in" },
  { href: "/auth/signup", label: "Create an account" },
];

export default function SiteHeader({ user }: { user: SafeUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-cocoa bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-display text-2xl font-black tracking-tight text-cocoa"
          aria-label="Tiebreak — home"
        >
          <span className="riso-title">tiebreak</span>
        </Link>

        <nav aria-label="Account" className="flex items-center gap-2 sm:gap-3">
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
                  className="rounded-full border-cocoa-sm bg-card px-4 py-2 text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep"
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
                className="rounded-lg px-3 py-2 text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep"
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