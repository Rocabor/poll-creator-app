"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { restorePoll, deletePollForever } from "@/app/actions/lifecycle";
import { announce } from "@/lib/announce";
import ConfirmDialog from "@/components/ui/confirm-dialog";

export default function RetiredActions({ slug }: { slug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function act(
    action: () => Promise<{ ok: boolean; error?: string }>,
    okMsg: string
  ) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    announce(result.ok ? okMsg : result.error ?? "That didn't work.");
    if (result.ok) router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => act(() => restorePoll(slug), "Poll restored to your dashboard.")}
          className="inline-flex items-center gap-1 rounded-full border border-cocoa-sm bg-cream px-2.5 py-1 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep disabled:opacity-60"
        >
          <RotateCcw aria-hidden="true" size={13} />
          Restore
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1 rounded-full border border-cocoa-sm bg-cream px-2.5 py-1 text-xs font-bold text-tangerine-deep transition-colors hover:bg-cream-deep disabled:opacity-60"
          aria-label={`Delete “${slug}” forever`}
        >
          <Trash2 aria-hidden="true" size={16} />
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this poll forever?"
        tone="danger"
        body="This permanently removes the poll and its votes. There's no undo — the poll and its results will be gone for good."
        confirmLabel="Delete forever"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          act(() => deletePollForever(slug), "Poll deleted for good.");
        }}
        busy={busy}
      />
    </>
  );
}