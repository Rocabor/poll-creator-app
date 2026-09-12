import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import CopyLink from "@/components/copy-link";
import RetiredActions from "@/components/dashboard/retired-actions";
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

function statusChip(poll: DashboardPoll): React.ReactNode {
  if (poll.deletedAt) {
    return (
      <span className="rounded-full bg-cocoa/10 px-2.5 py-0.5 text-[11px] font-extrabold text-cocoa-soft">
        Retired
      </span>
    );
  }
  if (poll.status === "settled") {
    return (
      <span className="rounded-full bg-cream-deep px-2.5 py-0.5 text-[11px] font-extrabold text-cocoa-soft">
        Settled
      </span>
    );
  }
  return (
    <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-extrabold text-teal-deep">
      Voting open
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
    <li className="group flex flex-col gap-2 rounded-[20px] border-cocoa bg-card p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {statusChip(poll)}
            {!retired && poll.pendingSuggestions > 0 && (
              <span className="animate-pulse rounded-full border border-cocoa/30 bg-butter px-2 py-0.5 text-[11px] font-bold text-cocoa">
                {poll.pendingSuggestions} pending suggestion
                {poll.pendingSuggestions === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <h3 className="truncate font-display text-lg font-extrabold text-cocoa">
            {retired ? (
              poll.title
            ) : (
              <Link
                href={`/p/${poll.slug}`}
                className="rounded-sm transition-colors group-hover:text-teal"
              >
                {poll.title}
              </Link>
            )}
          </h3>
        </div>
        {!retired && (
          <CopyLink
            url={shareUrl}
            label={`Copy link for ${poll.title}`}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-cream-deep pt-2 text-xs font-semibold text-cocoa-soft">
        <span className="truncate">
          {poll.voteCount === 0
            ? "No votes yet"
            : `${poll.voteCount} vote${poll.voteCount === 1 ? "" : "s"} · ${poll.voterTokens} voter${poll.voterTokens === 1 ? "" : "s"}`}
          {!retired && poll.status === "settled" && poll.settledAt
            ? ` · ${relativeTime(poll.settledAt)}`
            : ""}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          {poll.status === "settled" && !retired && (
            <span className="hidden font-bold text-teal-deep sm:inline">
              {winner ? `${winner} won` : "Ended in a tie"}
            </span>
          )}
          {!retired && poll.status === "settled" && (
            <Link
              href={`/create?from=${poll.slug}`}
              className="rounded-full border border-cocoa-sm bg-cream px-2.5 py-1 text-xs font-bold text-teal transition-colors hover:bg-cream-deep"
              title="Pre-fill a new poll from this one"
            >
              Run again
            </Link>
          )}
          {retired && <RetiredActions slug={poll.slug} />}
          {!retired && (
            <Link
              href={`/p/${poll.slug}`}
              className="rounded-full border border-cocoa-sm bg-cream px-2.5 py-1 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep"
            >
              {poll.status === "open" ? "Vote" : "View"}
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}