"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { closeNow } from "@/app/actions/lifecycle";
import { announce } from "@/lib/announce";
import ConfirmDialog from "@/components/ui/confirm-dialog";

/** Compact creator-only control: close an open poll early, with confirmation. */
export default function EndVotingButton({
  slug,
  disabled = false,
}: {
  slug: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border-cocoa-sm bg-cream px-3 py-1.5 text-xs font-bold text-tangerine-deep transition-colors hover:bg-cream-deep disabled:opacity-60"
      >
        <Lock size={13} strokeWidth={2.4} aria-hidden="true" />
        <span>End voting early</span>
      </button>

      <ConfirmDialog
        open={open}
        title="End voting now?"
        body="This locks the race, crowns the winner, and reveals the backers to the group. Votes already cast stay on the board."
        confirmLabel="End voting"
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          const result = await closeNow(slug);
          setBusy(false);
          setOpen(false);
          announce(
            result.ok ? "Poll closed — results are in." : result.error ?? "Couldn't close it."
          );
          if (result.ok) router.refresh();
        }}
        busy={busy}
      />
    </>
  );
}