"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { settleIfDue } from "@/lib/poll-state";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export interface CastVoteResult {
  ok: boolean;
  error?: string;
  myVotes?: string[];
  optionCounts?: Record<string, number>;
  totalVotes?: number;
  settled?: boolean;
}

const castSchema = z.object({
  slug: z.string().max(120),
  optionIds: z.array(z.string().max(120)).min(1).max(4),
  name: z.string().trim().min(1, "Add your name").max(40),
  seed: z.string().trim().min(1).max(80),
  tint: z.string().trim().min(1).max(32),
  token: z.string().trim().min(8).max(64),
});

export async function castVote(input: unknown): Promise<CastVoteResult> {
  const parsed = castSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid vote." };
  }

  const { slug, optionIds, name, seed, tint, token } = parsed.data;

  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: { options: true },
  });

  if (!poll || poll.deletedAt) return { ok: false, error: "This poll doesn't exist." };

  // Per-poll, per-IP ceiling for cast attempts (a phone circulating a table
  // casts a handful of votes; 60/hour stops ballot-stuffing scripts).
  const ip = await clientIp();
  const throttle = await rateLimit(`vote:${poll.id}:${ip}`, 60, 60 * 60);
  if (!throttle.ok) {
    return { ok: false, error: "Too many votes from this device. Try again later." };
  }

  // Re-check the deadline server-side right now (read-time settlement).
  const settle = settleIfDue(poll);
  if (settle.changed) {
    await prisma.poll.update({
      where: { id: poll.id },
      data: { status: "settled", settledAt: settle.settledAt },
    });
    poll.status = "settled";
  }

  if (poll.status === "settled") {
    return { ok: false, error: "This poll has closed for voting.", settled: true };
  }

  if (optionIds.length > poll.maxChoices) {
    return { ok: false, error: `Pick up to ${poll.maxChoices} options.` };
  }

  const byId = new Map(poll.options.map((o) => [o.id, o]));
  const onBallot = (o: { source: string; suggestionStatus: string | null }) =>
    o.source === "creator" || o.suggestionStatus === "approved";

  const valid = optionIds.every((id) => {
    const opt = byId.get(id);
    return opt && onBallot(opt);
  });
  if (!valid) {
    return { ok: false, error: "One of those options isn't on the ballot." };
  }

  const existing = await prisma.vote.findFirst({
    where: { pollId: poll.id, voterToken: token },
  });

  // Votes are final. If this token already voted with different options, reject
  // the change; re-sending the exact same ballot is idempotent (no double count).
  if (existing) {
    const existingVotes = await prisma.vote.findMany({
      where: { pollId: poll.id, voterToken: token },
      select: { optionId: true },
    });
    const already = existingVotes.map((v) => v.optionId).sort();
    const incoming = [...optionIds].sort();
    if (already.length !== incoming.length || already.some((id, i) => id !== incoming[i])) {
      return { ok: false, error: "You've already voted — votes are final." };
    }
    return existingBallotFact(poll.id, token, poll.maxChoices);
  }

  await prisma.$transaction(
    optionIds.map((optionId) =>
      prisma.vote.create({
        data: {
          pollId: poll.id,
          optionId,
          name,
          seed,
          tint,
          voterToken: token,
        },
      })
    )
  );

  return existingBallotFact(poll.id, token, poll.maxChoices);
}

async function existingBallotFact(
  pollId: string,
  token: string,
  maxChoices: number
): Promise<CastVoteResult> {
  const [votes, optionCounts] = await Promise.all([
    prisma.vote.findMany({
      where: { pollId, voterToken: token },
      select: { optionId: true },
    }),
    prisma.vote.groupBy({
      by: ["optionId"],
      where: { pollId },
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  let totalVotes = 0;
  for (const row of optionCounts) {
    counts[row.optionId] = row._count._all;
    totalVotes += row._count._all;
  }

  return {
    ok: true,
    myVotes: votes.map((v) => v.optionId),
    optionCounts: counts,
    totalVotes,
  };
}