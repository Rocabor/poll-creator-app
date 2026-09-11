"use client";

import { useState } from "react";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
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

  return (
    <section aria-labelledby="moderation-heading" className="mt-6 border-cocoa rounded-2xl bg-card p-5">
      <h2 id="moderation-heading" className="font-display text-lg font-bold text-cocoa">
        Suggested options
      </h2>
      {pending.length === 0 && (
        <p className="mt-2 text-sm text-cocoa-soft">
          Nothing waiting. Voters pitch options here once enabled.
        </p>
      )}

      {pending.length > 0 && (
        <ul className="mt-3 space-y-2">
          {pending.map((s: PendingSuggestionView) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-cream-deep/70 px-3 py-2.5">
              <Avatar name={s.suggestedBy.name} seed={s.suggestedBy.seed} tint={s.suggestedBy.tint} size={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-bold text-cocoa">{s.label}</p>
                <p className="text-xs text-cocoa-soft">Suggested by {s.suggestedBy.name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => run(s.id, () => approveSuggestion(s.id), `“${s.label}” is on the ballot.`)}
                  className="inline-flex items-center gap-1 rounded-full bg-teal px-3 py-2 text-sm font-bold text-cream disabled:opacity-60"
                >
                  <Check aria-hidden="true" size={16} /> Add
                </button>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => run(s.id, () => declineSuggestion(s.id), `“${s.label}” declined.`)}
                  className="inline-flex items-center gap-1 rounded-full border-cocoa-sm bg-card px-4 py-2 text-sm font-bold text-cocoa disabled:opacity-60"
                  aria-label={`Decline “${s.label}”`}
                >
                  <X aria-hidden="true" size={16} /> No
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