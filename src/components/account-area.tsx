"use client";

import { useEffect, useState } from "react";
import type { SafeUser } from "@/lib/auth";
import SiteHeaderActions from "@/components/site-header-actions";

/**
 * Account area that resolves the session on the client. Keeping cookie reads
 * out of the root layout lets public pages (like /p/[slug]) stay cacheable
 * instead of being forced per-request by a session read in the shell.
 */
export default function AccountArea({
  initialUser = null,
}: {
  initialUser?: SafeUser | null;
}) {
  const [user, setUser] = useState<SafeUser | null>(initialUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { user: SafeUser | null }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return <SiteHeaderActions user={ready ? user : initialUser} />;
}