import type { OptionView, PollView } from "@/lib/types";
import { TALLY_BREAKPOINT } from "@/lib/poll-state";
import Avatar from "@/components/avatar";

/** 1 tick per voter while the poll is small; a hybrid share bar above 20.
 * Mirrors the prototype scoreboard: butter filled, tangerine-deep empty. */
function SegmentedTally({
  votes,
  totalVotes,
  onLight,
}: {
  votes: number;
  totalVotes: number;
  onLight: boolean;
}) {
  if (totalVotes === 0) {
    return (
      <span className="inline-flex rounded-full bg-scrim-on-tangerine px-2.5 py-1 text-xs font-bold text-cream-bright">
        No votes yet
      </span>
    );
  }

  if (totalVotes > TALLY_BREAKPOINT) {
    const percentage = Math.round((votes / totalVotes) * 100);
    return (
      <div className="flex h-4 w-full items-center overflow-hidden rounded-md border border-cocoa/40 bg-tangerine-deep p-0.5">
        <div
          className="h-full rounded bg-butter transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap gap-1 py-1">
      {Array.from({ length: totalVotes }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-5 min-w-1.5 max-w-7 flex-1 rounded-[3px] border transition-colors ${
            i < votes
              ? "border-cocoa/40 bg-butter"
              : onLight
                ? "border-cream-bright/20 bg-tangerine-deep"
                : "border-cocoa/30 bg-cream-deep"
          }`}
        />
      ))}
    </div>
  );
}

/** The front runner gets the one tangerine moment: a full leader card. */
function LeaderCard({
  option,
  totalVotes,
  isTied,
  showBackers,
}: {
  option: OptionView;
  totalVotes: number;
  isTied: boolean;
  showBackers: boolean;
}) {
  const settled = showBackers;
  const ribbon = settled ? "Winner" : isTied ? "Tied for the lead" : "In the lead";
  const backers = option.backers ?? [];

  return (
    <article
      aria-label={`${ribbon}: ${option.label}`}
      className="border-cocoa relative animate-tb-rise rounded-lg bg-tangerine p-4 text-cream-bright shadow-md transition-all sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border-cocoa-sm bg-butter px-3 py-1 text-xs font-bold tracking-wider text-cocoa uppercase">
          {ribbon}
        </span>
        {option.source === "suggestion" && option.suggestedBy && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cocoa/40 px-2.5 py-1 text-xs font-bold text-cream-bright">
            <Avatar
              name={option.suggestedBy.name}
              seed={option.suggestedBy.seed}
              tint={option.suggestedBy.tint}
              size={20}
              className="border-2 border-cream-bright/40"
            />
            Suggested by {option.suggestedBy.name}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-2xl font-black tracking-tight text-cream-bright sm:text-3xl">
        {option.label}
      </h3>

      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="font-display text-3xl font-black leading-none tabular-nums text-cream-bright sm:text-4xl">
            {totalVotes > 0 ? `${option.percentage}%` : "0%"}
          </span>
          <span className="rounded-full bg-cocoa/45 px-2.5 py-1 text-xs font-bold tabular-nums text-cream-bright">
            {option.votesCount} of {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
          </span>
        </div>
        <SegmentedTally votes={option.votesCount} totalVotes={totalVotes} onLight={true} />
      </div>

      {showBackers && backers.length > 0 && (
        <div className="mt-3 border-t border-cream-bright/20 pt-3">
          <div className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full bg-scrim-on-tangerine px-3 py-1.5">
            <span className="text-xs font-bold tracking-wide text-cream-bright uppercase">
              Backed by
            </span>
            <div className="flex -space-x-2">
              {backers.slice(0, 5).map((b) => (
                <Avatar
                  key={b.seed}
                  name={b.name}
                  seed={b.seed}
                  tint={b.tint}
                  size={28}
                  className="border-2 border-tangerine"
                />
              ))}
              {backers.length > 5 && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-cocoa-sm bg-cocoa text-[11px] font-extrabold text-cream-bright">
                  +{backers.length - 5}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-cream-bright">
              {backers.slice(0, 3).map((b) => b.name).join(", ")}
              {backers.length > 3 ? ` + ${backers.length - 3} more` : ""}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

/** Trailing options: one row each, bar relative to the leader. */
function PackList({
  options,
  totalVotes,
  showBackers,
}: {
  options: OptionView[];
  totalVotes: number;
  showBackers: boolean;
}) {
  if (options.length === 0) return null;

  const voteCounts = options.map((o) => o.votesCount);
  const duplicates = voteCounts.filter((item, index) => item > 0 && voteCounts.indexOf(item) !== index);
  const tieNote =
    duplicates.length > 0
      ? `Note: ${duplicates[0]} votes tie for runner-up position`
      : null;

  return (
    <section
      aria-label="Trailing options"
      className="border-cocoa rounded-lg bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-cream-deep pb-2">
        <h3 className="font-display text-sm font-bold tracking-wider text-cocoa-soft uppercase">
          The Pack
        </h3>
        {tieNote && <span className="text-xs font-semibold text-cocoa-soft">{tieNote}</span>}
      </div>

      {options.map((option, idx) => {
        const isLast = idx === options.length - 1;
        const backers = option.backers ?? [];
        return (
          <div
            key={option.id}
            className={`animate-tb-rise py-3.5 ${
              !isLast ? "border-b-2 border-dashed border-cream-deep" : ""
            }`}
            style={{ animationDelay: `${(idx + 1) * 60}ms` }}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate font-display text-base font-extrabold text-cocoa sm:text-lg">
                {option.label}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold tabular-nums text-cocoa sm:text-sm">
                {option.percentage}%
                <span className="text-cocoa-soft">·</span>
                <span className="text-cocoa-soft">
                  {option.votesCount} {option.votesCount === 1 ? "vote" : "votes"}
                </span>
              </span>
            </div>

            <div className="h-3.5 w-full rounded-full border border-cocoa/20 bg-cream-deep p-0.5">
              <div
                className="h-full rounded-full bg-teal transition-all duration-300"
                style={{ width: `${option.relativePercentageToLeader}%` }}
              />
            </div>

            {showBackers && backers.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-cocoa-soft">
                <span className="font-semibold">Backed by:</span>
                <div className="flex -space-x-1.5">
                  {backers.slice(0, 6).map((b) => (
                    <Avatar
                      key={b.seed}
                      name={b.name}
                      seed={b.seed}
                      tint={b.tint}
                      size={20}
                      className="border-2 border-card"
                    />
                  ))}
                </div>
                <span className="truncate">
                  {backers.map((b) => b.name).join(", ")}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

interface ResultsBoardProps {
  poll: PollView;
  /** Replaced by the reveal at close; suppressed here while the poll is open. */
  showBackers?: boolean;
}

export default function ResultsBoard({ poll, showBackers = false }: ResultsBoardProps) {
  const leader = poll.options.find((o) => o.isLeader);
  const pack = poll.options.filter((o) => !o.isLeader);
  const settled = showBackers;

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

      {poll.totalVotes === 0 && (
        <p className="mt-3 rounded-lg border-2 border-dashed border-cocoa/30 px-4 py-6 text-center text-cocoa-soft">
          No votes yet — first vote wins the table.
        </p>
      )}

      {poll.isTied && poll.totalVotes > 0 && (
        <p className="mt-3 rounded-lg border border-cocoa/20 bg-butter/50 px-4 py-2.5 text-sm font-bold text-cocoa">
          It&apos;s a {poll.leadingIds.length}-way tie — every one of those votes
          counts until the deadline.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-4">
        {leader && (
          <LeaderCard
            option={leader}
            totalVotes={poll.totalVotes}
            isTied={poll.isTied}
            showBackers={settled}
          />
        )}
        <PackList
          options={pack}
          totalVotes={poll.totalVotes}
          showBackers={settled}
        />
      </div>
    </section>
  );
}