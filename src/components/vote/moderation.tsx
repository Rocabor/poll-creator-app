"use client";

import { useState } from "react";
import { Check, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  approveSuggestion,
  declineSuggestion,
  removeDeclined,
  undoDecline,
} from "@/app/actions/suggestions";
import { announce } from "@/lib/announce";
import Avatar from "@/components/avatar";
import type { DeclinedSuggestionView, PendingSuggestionView, PollView } from "@/lib/types";

/** Creator-only moderation queue. Rendering is driven by the live poll view so
 * a new suggestion (or its resolution) appears without a full-page reload. */
export default function Moderation({ poll }: { poll: PollView }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = poll.pendingSuggestions ?? [];
  const declined = poll.declinedSuggestions ?? [];

  async function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    setBusyId(id);
    const result = await action();
    setBusyId(null);
    announce(result.ok ? ok : result.error ?? "That didn't work.");
    if (result.ok) router.refresh();
  }

  if (poll.status !== "open") return null;
  if (pending.length === 0 && declined.length === 0) return null;

  return (
    <section
      aria-labelledby="moderation-heading"
      className="mt-6 border-cocoa rounded-[22px] bg-butter-deep p-4 shadow-sm sm:p-5"
    >
      <div className="mb-2 flex items-center gap-2 text-cocoa">
        <Sparkles size={18} strokeWidth={2.5} className="text-tangerine" aria-hidden="true" />
        <h2 id="moderation-heading" className="font-display text-base font-extrabold sm:text-lg">
          Pending Suggestions ({pending.length})
        </h2>
      </div>
      <p className="mb-3 text-xs text-cocoa-soft">
        Approve it and it joins the ballot with 0 votes. Your call, house rules.
      </p>

      {pending.length === 0 && (
        <p className="text-sm text-cocoa-soft">No pending suggestions right now.</p>
      )}

      {pending.length > 0 && (
        <ul className="space-y-2.5">
          {pending.map((s: PendingSuggestionView) => (
            <li
              key={s.id}
              className="flex flex-col justify-between gap-3 rounded-xl border-cocoa-sm bg-card p-3.5 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={s.suggestedBy.name} seed={s.suggestedBy.seed} tint={s.suggestedBy.tint} size={36} />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-extrabold text-cocoa">{s.label}</p>
                  <p className="text-xs font-semibold text-cocoa-soft">Suggested by {s.suggestedBy.name}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => run(s.id, () => declineSuggestion(s.id), `“${s.label}” declined.`)}
                  className="rounded-full border-cocoa-sm bg-cream px-3.5 py-1.5 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep disabled:opacity-60"
                  aria-label={`Decline “${s.label}”`}
                >
                  Not this time
                </button>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => run(s.id, () => approveSuggestion(s.id), `“${s.label}” is on the ballot.`)}
                  className="btn-game-piece inline-flex items-center gap-1 rounded-full border-cocoa-sm bg-teal px-4 py-1.5 text-xs font-bold text-cream transition-colors hover:bg-teal-deep disabled:opacity-60"
                >
                  <Check aria-hidden="true" size={14} strokeWidth={3} />
                  Add it (joins with 0 votes)
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {declined.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-bold tracking-wide text-cocoa-soft uppercase">
            Declined — recoverable
          </h3>
          <ul className="mt-2 space-y-1.5">
            {declined.map((s: DeclinedSuggestionView) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-cocoa/5 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-cocoa-soft line-through">{s.label}</p>
                  <p className="text-xs text-cocoa-soft">Suggested by {s.suggestedBy.name}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === s.id}
                    onClick={() => run(s.id, () => undoDecline(s.id), `“${s.label}” is back in the queue.`)}
                    className="inline-flex items-center gap-1 rounded-full border-cocoa-sm bg-card px-2.5 py-1.5 text-xs font-bold text-cocoa disabled:opacity-60"
                  >
                    <RotateCcw aria-hidden="true" size={14} /> Undo
                  </button>
                  <button
                    type="button"
                    disabled={busyId === s.id}
                    onClick={() => run(s.id, () => removeDeclined(s.id), `“${s.label}” removed for good.`)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-tangerine-deep hover:bg-tangerine/10 disabled:opacity-60"
                    aria-label={`Permanently remove “${s.label}”`}
                  >
                    <Trash2 aria-hidden="true" size={14} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}