import { prisma } from "@/lib/prisma";
import type {
  OptionView,
  PendingSuggestionView,
  PollView,
  SuggestionStatus,
  VoterRef,
} from "@/lib/types";

export const TALLY_BREAKPOINT = 20;

function byDisplayOrder(
  a: { displayOrder: number },
  b: { displayOrder: number }
) {
  return a.displayOrder - b.displayOrder;
}

/**
 * The poll state machine, evaluated at read time: an open poll whose closing
 * time has passed settles now (open → settled) whether or not anyone has the
 * page open. The caller persists the change.
 */
export function settleIfDue(poll: {
  id: string;
  status: string;
  closesAt: Date;
  settledAt: Date | null;
}): { changed: boolean; settledAt: Date | null } {
  if (poll.status === "open" && poll.closesAt.getTime() <= Date.now()) {
    return { changed: true, settledAt: poll.closesAt };
  }
  return { changed: false, settledAt: poll.settledAt };
}

export function optionIsOnBallot(option: {
  source: string;
  suggestionStatus: string | null;
}): boolean {
  return option.source === "creator" || option.suggestionStatus === "approved";
}

/** "Priya, Ada, Kai + 2 more backed it" */
export function attributionsText(backers: VoterRef[]): string {
  if (backers.length === 0) return "";
  const names = backers.map((b) => b.name).slice(0, 3);
  if (backers.length > 3) {
    return `${names.join(", ")} + ${backers.length - 3} more backed it`;
  }
  return `${names.join(", ")} backed it`;
}

type PollRow = {
  id: string;
  slug: string;
  title: string;
  type: string;
  maxChoices: number;
  suggestions: boolean;
  status: string;
  createdAt: Date;
  closesAt: Date;
  settledAt: Date | null;
  creatorId: string;
  tieResolved: boolean;
  options: {
    id: string;
    label: string;
    source: string;
    suggestionStatus: string | null;
    suggestedByName: string | null;
    suggestedSeed: string | null;
    suggestedTint: string | null;
    displayOrder: number;
    votesCount?: number;
  }[];
  votes: {
    optionId: string;
    name: string;
    seed: string;
    tint: string;
    voterToken: string;
  }[];
};

function voterRef(v: { name: string; seed: string; tint: string }): VoterRef {
  return { name: v.name, seed: v.seed, tint: v.tint };
}

/**
 * Build the public PollView. Counts are always derived from the votes rows —
 * never stored — and attribution is only attached once the poll is settled.
 */
export function toPollView(
  poll: PollRow,
  opts: { userId?: string; includePending: boolean }
): PollView {
  const sortedOptions = [...poll.options].sort(byDisplayOrder);
  const active = sortedOptions.filter(optionIsOnBallot);

  const counts = new Map<string, number>();
  const backersByOption = new Map<string, VoterRef[]>();
  const uniqueTokens = new Set<string>();

  for (const v of poll.votes) {
    uniqueTokens.add(v.voterToken);
    const key = v.optionId;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const list = backersByOption.get(key) ?? [];
    if (!list.some((b) => b.name === v.name)) {
      list.push(voterRef(v));
    }
    backersByOption.set(key, list);
  }

  let maxVotes = 0;
  for (const opt of active) {
    maxVotes = Math.max(maxVotes, counts.get(opt.id) ?? 0);
  }

  const totalVotes = poll.votes.length;
  const leaders = active.filter((o) => (counts.get(o.id) ?? 0) === maxVotes && maxVotes > 0);
  const isTied = leaders.length > 1;

  const options: OptionView[] = active.map((opt) => {
    const count = counts.get(opt.id) ?? 0;
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const relativePercentageToLeader =
      maxVotes > 0 ? Math.round((count / maxVotes) * 100) : 0;

    const view: OptionView = {
      id: opt.id,
      label: opt.label,
      source: opt.source as OptionView["source"],
      votesCount: count,
      percentage,
      relativePercentageToLeader,
      isLeader: maxVotes > 0 && count === maxVotes,
    };

    if (opt.source === "suggestion" && opt.suggestedByName) {
      view.suggestedBy = {
        name: opt.suggestedByName,
        seed: opt.suggestedSeed ?? opt.suggestedByName,
        tint: opt.suggestedTint ?? "cbe2d8",
      };
    }

    // Attribution is revealed only at close. While open, no voter lists.
    if (poll.status === "settled") {
      view.backers = backersByOption.get(opt.id) ?? [];
    }

    return view;
  });

  // Leader card ordering: leaders first, then by count desc, then ballot order.
  const sortedView = [...options].sort((a, b) => {
    if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
    if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
    return 0;
  });

  const pendingSuggestions: PendingSuggestionView[] | undefined = opts.includePending
    ? sortedOptions
        .filter(
          (o) =>
            o.source === "suggestion" && o.suggestionStatus === "pending"
        )
        .map((o) => ({
          id: o.id,
          label: o.label,
          suggestedBy: {
            name: o.suggestedByName ?? "A friend",
            seed: o.suggestedSeed ?? "friend",
            tint: o.suggestedTint ?? "cbe2d8",
          },
        }))
    : undefined;

  const winner = leaders[0];
  const winnerAttribution =
    poll.status === "settled" && winner
      ? attributionsText(backersByOption.get(winner.id) ?? [])
      : undefined;

  const isMine = opts.userId ? poll.creatorId === opts.userId : false;

  return {
    id: poll.id,
    slug: poll.slug,
    title: poll.title,
    type: poll.type as PollView["type"],
    maxChoices: poll.maxChoices,
    suggestionsEnabled: poll.suggestions,
    status: poll.status as PollView["status"],
    createdAt: poll.createdAt.toISOString(),
    closesAt: poll.closesAt.toISOString(),
    settledAt: poll.settledAt?.toISOString() ?? null,
    totalVotes,
    uniqueVoters: uniqueTokens.size,
    isTied,
    leadingIds: leaders.map((l) => l.id),
    options: sortedView,
    isMine,
    pendingSuggestions,
    winnerAttribution,
    tieBrokenOptionId: poll.tieResolved && winner ? winner.id : undefined,
  };
}

export async function loadPollView(
  slug: string,
  opts: { userId?: string } = {}
): Promise<PollView | null> {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      options: true,
      votes: { select: { optionId: true, name: true, seed: true, tint: true, voterToken: true } },
    },
  });

  if (!poll || poll.deletedAt) return null;

  // Read-time settlement: if the deadline passed, persist open → settled.
  const { changed, settledAt } = settleIfDue(poll);
  if (changed) {
    await prisma.poll.update({
      where: { id: poll.id },
      data: { status: "settled", settledAt },
    });
    poll.status = "settled";
    poll.settledAt = settledAt;
  }

  return toPollView(poll, { userId: opts.userId, includePending: opts.userId === poll.creatorId });
}

export function suggestionStatusFromString(
  s: string | null
): SuggestionStatus {
  if (s === "approved" || s === "declined" || s === "pending") return s;
  return "pending";
}