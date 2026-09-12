"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crown, RotateCcw, Zap } from "lucide-react";
import { usePoll } from "@/lib/use-poll";
import { announce } from "@/lib/announce";
import {
  reopenPoll,
  retirePoll,
  startSuddenDeath,
} from "@/app/actions/lifecycle";
import { REOPEN_WINDOW_MS, attributionsText } from "@/lib/poll-state";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Avatar from "@/components/avatar";
import ResultsBoard from "@/components/vote/results-board";
import type { PollView, VoterRef } from "@/lib/types";

function timeFmt(iso: string): string {
  return new Date(iso).toLocaleString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Reveal({
  poll,
  isMine,
}: {
  poll: PollView;
  isMine: boolean;
}) {
  const router = useRouter();
  const { data } = usePoll(poll.slug, null, 7000);
  const live = data?.poll ?? poll;
  const [reopenOpen, setReopenOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const leaders = live.options.filter((o) => o.isLeader);
  const tie = live.isTied && leaders.length > 1;
  const leader = leaders[0];

  async function act(
    action: () => Promise<
      { ok: boolean; error?: string; redirectTo?: string } | { ok: boolean; error?: string }
    >,
    okMsg: string
  ) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      announce(result.error ?? "That didn't work.");
      return;
    }
    if ("redirectTo" in result && result.redirectTo) {
      router.push(result.redirectTo);
      return;
    }
    announce(okMsg);
    router.refresh();
  }

  const reopenClosesAt = new Date(
    new Date(live.closesAt).getTime() + REOPEN_WINDOW_MS
  );

  return (
    <div className="mt-8">
      <section
        aria-labelledby="reveal-heading"
        className="border-cocoa animate-tb-rise rounded-lg bg-card p-6"
      >
        <p className="font-display text-sm font-bold tracking-widest text-cocoa-soft uppercase">
          Poll closed
        </p>
        <h2 id="reveal-heading" className="mt-1 font-display text-3xl font-black text-cocoa">
          {tie ? "It ends in a tie" : "The winner"}
        </h2>

        {tie ? (
          <div className="mt-4">
            <p className="text-cocoa-soft">
              {leaders.length} options finished level on {leader?.votesCount}{" "}
              votes each. Exact dead heat — nobody can claim it yet.
            </p>
            <ul className="mt-3 space-y-2">
              {leaders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-cocoa/20 bg-butter/40 px-4 py-3 font-display font-bold text-cocoa"
                >
                  <span className="min-w-0">{o.label}</span>
                  <span className="tabular-nums shrink-0 text-sm">
                    {o.votesCount} votes
                  </span>
                </li>
              ))}
            </ul>
            {isMine && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  act(
                    () => startSuddenDeath(live.slug),
                    ""
                  )
                }
                className="btn-game-piece mt-4 inline-flex items-center gap-2 rounded-xl border-cocoa-sm bg-butter px-5 py-3 font-display font-bold text-cocoa transition-colors hover:bg-butter-deep disabled:opacity-60 sm:rounded-full"
              >
                <Zap aria-hidden="true" size={18} />
                Sudden death — settle it now
              </button>
            )}
            {!isMine && live.suddenDeathChild && (
              <p className="mt-3 text-sm font-bold text-teal">
                <Link href={`/p/${live.suddenDeathChild.slug}`} className="underline underline-offset-2">
                  Jump to the sudden-death vote →
                </Link>
              </p>
            )}
          </div>
        ) : leader && leader.backers ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tangerine-deep text-cream"
            >
              <Crown size={28} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl font-black text-tangerine-deep">
                {leader.label}
              </p>
              <p className="tabular-nums text-sm font-bold text-cocoa">
                {leader.votesCount} vote{leader.votesCount === 1 ? "" : "s"}
                {leader.percentage > 0 &&
                  leader.percentage < 100 &&
                  ` · ${leader.percentage}% of the vote`}
              </p>
              {leader.backers.length > 0 && (
                <p className="mt-1 text-sm text-cocoa-soft">
                  {attributionsText(leader.backers)}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              {leader.backers.slice(0, 4).map((b: VoterRef) => (
                <Avatar
                  key={b.seed}
                  name={b.name}
                  seed={b.seed}
                  tint={b.tint}
                  size={38}
                  className="border-2"
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-cocoa-soft">
            Nobody voted before the deadline — the board is empty.
          </p>
        )}
      </section>

      <div className="mt-8">
        <ResultsBoard poll={live} showBackers />
      </div>

      {isMine && (
        <div className="mt-8 border-cocoa rounded-lg bg-cream-deep p-4 sm:p-5">
          <h3 className="font-display text-xs font-bold tracking-wider text-cocoa-soft uppercase">
            Organizer actions
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setReopenOpen(true)}
              className="btn-game-piece shadow-press-teal inline-flex items-center gap-2 rounded-xl border-cocoa-sm bg-teal px-4 py-2.5 font-display font-bold text-cream transition-colors hover:bg-teal-deep disabled:opacity-60 sm:rounded-full"
            >
              <RotateCcw aria-hidden="true" size={16} />
              Reopen for votes
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRetireOpen(true)}
              className="rounded-xl border-cocoa-sm bg-cream px-4 py-2.5 font-display font-bold text-tangerine-deep transition-colors hover:bg-cream-deep disabled:opacity-60 sm:rounded-full"
            >
              Retire this poll
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={reopenOpen}
        title="Reopen this poll?"
        body={`Voting opens again and closes ${timeFmt(
          reopenClosesAt.toISOString()
        )} (the original deadline + 24 hours). Votes already cast stay on the board.`}
        confirmLabel="Reopen"
        onClose={() => setReopenOpen(false)}
        onConfirm={() => {
          setReopenOpen(false);
          act(() => reopenPoll(live.slug), "The poll is open for voting again.");
        }}
        busy={busy}
      />

      <ConfirmDialog
        open={retireOpen}
        title="Retire this poll?"
        tone="danger"
        body="It leaves your dashboard but stays recoverable — you can bring it back any time. To remove it for good, retire it first, then delete it from the dashboard."
        confirmLabel="Retire"
        onClose={() => setRetireOpen(false)}
        onConfirm={() => {
          setRetireOpen(false);
          act(() => retirePoll(live.slug), "Poll retired.");
        }}
        busy={busy}
      />
    </div>
  );
}