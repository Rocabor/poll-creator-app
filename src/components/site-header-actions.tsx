"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import type { SafeUser } from "@/lib/auth";
import Avatar from "@/components/avatar";
import { logoutAction } from "@/app/actions/auth";
import { reloadSampleDataAction } from "@/app/actions/sample";

const DEMO_EMAIL = "morgan@tiebreak.test";
const itemClass =
  "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep";

export default function SiteHeaderActions({
  user,
}: {
  user: SafeUser | null;
}) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && panelRef.current) {
      const first = panelRef.current.querySelector<HTMLElement>(
        '[role="menuitem"], button, a'
      );
      first?.focus();
    } else if (!open) {
      navRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav
      ref={navRef}
      aria-label="Account"
      className="relative flex items-center gap-1.5 sm:gap-2"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center rounded-full p-2 text-cocoa transition-colors hover:bg-cream-deep sm:hidden"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
      >
        {open ? (
          <X size={20} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Menu size={20} strokeWidth={2.4} aria-hidden="true" />
        )}
      </button>

      {user ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="hidden items-center gap-2 rounded-full p-1 transition-colors hover:bg-cream-deep sm:inline-flex"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Account menu for ${user.name}`}
        >
          <Avatar
            name={user.name}
            seed={user.avatarSeed}
            tint={user.avatarTint}
            size={32}
          />
          <span className="hidden text-sm font-bold text-cocoa lg:inline">
            {user.name}
            {user.isGuest ? " (demo)" : ""}
          </span>
        </button>
      ) : (
        <>
          <Link
            href="/auth/login"
            className="hidden rounded-full border-cocoa-sm bg-cream px-3 py-1.5 text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="hidden rounded-full border-cocoa-sm bg-cream px-3 py-1.5 text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep sm:inline-flex"
          >
            Create an account
          </Link>
        </>
      )}

      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-cocoa/45 sm:bg-cocoa/0"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-max min-w-35 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-cocoa bg-cream-bright p-1 shadow-xl"
          >
            {user ? (
              <>
                <div className="flex items-center gap-2.5 border-b border-cocoa/10 pb-3">
                  <Avatar
                    name={user.name}
                    seed={user.avatarSeed}
                    tint={user.avatarTint}
                    size={38}
                  />
                  <div className="flex min-w-0 max-w-48 flex-col">
                    <span className="truncate font-display text-sm font-bold text-cocoa">
                      {user.name}
                    </span>
                    <span className="text-xs font-semibold text-cocoa-soft">
                      {user.isGuest ||
                      user.email === DEMO_EMAIL
                        ? "Host · Guest Mode"
                        : user.email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 py-2">
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={itemClass}
                  >
                    <LayoutDashboard
                      size={14}
                      strokeWidth={2.4}
                      aria-hidden="true"
                    />
                    Dashboard & Polls
                  </Link>
                  <Link
                    href="/create"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={itemClass}
                  >
                    <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
                    New poll
                  </Link>
                  {(user.isGuest || user.email === DEMO_EMAIL) && (
                    <form action={reloadSampleDataAction} className="w-full">
                      <button
                        type="submit"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className={itemClass}
                      >
                        <span className="flex-1">Reload sample data</span>
                        <RotateCcw
                          size={12}
                          strokeWidth={2.4}
                          aria-hidden="true"
                        />
                      </button>
                    </form>
                  )}
                  <Link
                    href="/?about=1"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={itemClass}
                  >
                    About Tiebreak
                  </Link>
                  <div className="my-2 border-t border-cocoa/10" role="none" />
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={itemClass}
                    >
                      <LogOut size={14} strokeWidth={2.4} aria-hidden="true" />
                      Log out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1 py-1" role="none">
                <Link
                  href="/auth/login"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemClass}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemClass}
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
}