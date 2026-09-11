import Link from "next/link";
import CopyLink from "@/components/copy-link";
import { closesInCompact, relativeTime } from "@/lib/time";

export interface DashboardPoll {
  slug: string;
  title: string;
  status: string;
  closesAt: Date;
  settledAt: Date | null;
  deletedAt: Date | null;
  voteCount: number;
  voterTokens: number;
  pendingSuggestions: number;
  options: { id: string; votesCount: number; label: string }[];
}

function winnerOf(poll: DashboardPoll): string | null {
  let best = 0;
  let winnerLabel: string | null = null;
  let tied = false;
  for (const o of poll.options) {
    if (o.votesCount === best && best > 0) tied = true;
    if (o.votesCount > best) {
      best = o.votesCount;
      winnerLabel = o.label;
      tied = false;
    }
  }
  if (best === 0 || tied) return null;
  return winnerLabel;
}

function statusChip(poll: DashboardPoll, pending: number): React.ReactNode {
  if (poll.deletedAt) {
    return (
      <span className="rounded-full bg-cocoa/10 px-3 py-1 text-xs font-bold text-cocoa-soft uppercase tracking-wide">
        Retired
      </span>
    );
  }
  if (poll.status === "settled") {
    return (
      <span className="rounded-full bg-butter-deep px-3 py-1 text-xs font-bold text-cocoa uppercase tracking-wide">
        Settled
      </span>
    );
  }
  return (
    <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-teal-deep uppercase tracking-wide">
      Open — closes {closesInCompact(poll.closesAt)}
    </span>
  );
}

export default function DashboardPollCard({
  poll,
  shareUrl,
}: {
  poll: DashboardPoll;
  shareUrl: string;
}) {
  const winner = winnerOf(poll);
  const retired = Boolean(poll.deletedAt);

  return (
    <li className="border-cocoa flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-card p-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-lg font-bold text-cocoa">
          <Link
            href={`/p/${poll.slug}`}
            className="rounded-sm hover:underline hover:decoration-tangerine hover:decoration-2"
          >
            {poll.title}
          </Link>
        </h3>

        <p className="mt-1 text-sm text-cocoa-soft">
          {poll.voteCount === 0
            ? "No votes yet"
            : `${poll.voteCount} vote${poll.voteCount === 1 ? "" : "s"} · ${poll.voterTokens} voter${poll.voterTokens === 1 ? "" : "s"}`}
          {!retired && poll.status === "settled" && poll.settledAt
            ? ` · closed ${relativeTime(poll.settledAt)}`
            : ""}
        </p>

        {poll.status === "settled" && !retired && (
          <p className="mt-1 text-sm font-bold text-teal-deep">
            {winner ? `${winner} won` : "Ended in a tie"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!retired && poll.pendingSuggestions > 0 && (
          <span className="rounded-full bg-tangerine px-3 py-1 text-xs font-bold text-cream">
            {poll.pendingSuggestions} suggestion{poll.pendingSuggestions === 1 ? "" : "s"}
          </span>
        )}
        {statusChip(poll, poll.pendingSuggestions)}
        {!retired && (
          <CopyLink url={shareUrl} label={`Share “${poll.title}”`} />
        )}
      </div>
    </li>
  );
}