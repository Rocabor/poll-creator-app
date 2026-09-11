import type { OptionView, PollView } from "@/lib/types";
import { TALLY_BREAKPOINT } from "@/lib/poll-state";
import Avatar from "@/components/avatar";

/** Horizontal bar with width relative to the leader, count next to the % —
 * honest results at small vote counts. Good for voting pages and dashboards. */
function ResultBar({ option, totalVotes }: { option: OptionView; totalVotes: number }) {
  return (
    <li
      className={`overflow-hidden rounded-xl bg-card ${
        option.isLeader ? "border-2 border-tangerine" : "border-cocoa-sm"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {option.isLeader && (
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full bg-tangerine"
            />
          )}
          <span className={`truncate font-display font-bold ${option.isLeader ? "text-tangerine-deep" : "text-cocoa"}`}>
            {option.label}
          </span>
        </div>
        <span className="tabular-nums shrink-0 text-sm font-bold text-cocoa">
          {option.votesCount} {option.votesCount === 1 ? "vote" : "votes"}
          <span className="text-cocoa-soft"> · {option.percentage}%</span>
        </span>
      </div>
      <div
        className="h-3 w-full bg-cream-deep"
        role="presentation"
        aria-hidden="true"
      >
        <div
          className={`h-full ${option.isLeader ? "bg-tangerine" : "bg-teal"}`}
          style={{ width: `${option.relativePercentageToLeader}%` }}
        />
      </div>
      {totalVotes > TALLY_BREAKPOINT && (
        <p className="px-4 py-2 text-xs text-cocoa-soft">
          Long tallies: votes shown at a rate of{" "}
          {option.votesCount} per person — see the counts above.
        </p>
      )}
    </li>
  );
}

interface ResultsBoardProps {
  poll: PollView;
  /** Replaced by the reveal at close; suppressed here while the poll is open. */
  showBackers?: boolean;
}

export default function ResultsBoard({ poll, showBackers = false }: ResultsBoardProps) {
  const hasVotes = poll.totalVotes > 0;

  return (
    <section aria-labelledby="results-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="results-heading" className="font-display text-xl font-bold text-cocoa">
          Results
        </h2>
        <p className="tabular-nums text-sm text-cocoa-soft">
          {poll.totalVotes} vote{poll.totalVotes === 1 ? "" : "s"} ·{" "}
          {poll.uniqueVoters} voter{poll.uniqueVoters === 1 ? "" : "s"}
        </p>
      </div>

      {!hasVotes && (
        <p className="mt-3 rounded-xl border-2 border-dashed border-cocoa/30 px-4 py-6 text-center text-cocoa-soft">
          No votes yet — first vote wins the table.
        </p>
      )}

      {poll.isTied && hasVotes && (
        <p className="mt-3 rounded-lg bg-butter/50 px-4 py-2.5 text-sm font-bold text-cocoa">
          It&apos;s a {poll.leadingIds.length}-way tie — every one of those votes
          counts until the deadline.
        </p>
      )}

      <ul className="mt-3 space-y-2.5">
        {poll.options.map((option: OptionView) => (
          <ResultBar key={option.id} option={option} totalVotes={poll.totalVotes} />
        ))}
      </ul>

      {showBackers &&
        poll.options.some((o) => (o.backers?.length ?? 0) > 0) && (
          <div className="mt-5">
            <h3 className="font-display text-sm font-bold tracking-wide text-cocoa-soft uppercase">
              Who backed what
            </h3>
            <ul className="mt-3 space-y-2">
              {poll.options
                .filter((o) => (o.backers?.length ?? 0) > 0)
                .map((o) => (
                  <li key={o.id} className="flex items-center gap-3 rounded-xl bg-cream-deep/60 px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-cocoa">
                      {o.label}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {o.backers?.slice(0, 5).map((b) => (
                        <Avatar
                          key={b.seed}
                          name={b.name}
                          seed={b.seed}
                          tint={b.tint}
                          size={26}
                          className="border-[1.5px]"
                        />
                      ))}
                      {o.backers && o.backers.length > 5 && (
                        <span className="ml-1 text-xs font-bold text-cocoa-soft">
                          +{o.backers.length - 5}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
    </section>
  );
}