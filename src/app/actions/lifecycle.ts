"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { REOPEN_WINDOW_MS } from "@/lib/poll-state";

export interface LifecycleResult {
  ok: boolean;
  error?: string;
  redirectTo?: string;
}

async function creatorGate(pollId: string): Promise<string | null> {
  const user = await getSessionUser();
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { creatorId: true },
  });
  if (!poll) return "That poll is gone.";
  if (!user || poll.creatorId !== user.id) return "Only the creator can do that.";
  return null;
}

/** closeNow: settle an open poll immediately (end early). */
export async function closeNow(slug: string): Promise<LifecycleResult> {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    select: { id: true, creatorId: true, status: true, deletedAt: true },
  });
  if (!poll || poll.deletedAt) return { ok: false, error: "That poll is gone." };
  if (poll.status !== "open") return { ok: false, error: "It's already closed." };

  const user = await getSessionUser();
  if (!user || poll.creatorId !== user.id) {
    return { ok: false, error: "Only the creator can close it." };
  }

  await prisma.poll.update({
    where: { id: poll.id },
    data: { status: "settled", settledAt: new Date() },
  });

  return { ok: true };
}

/**
 * reopen: an explicit, confirmed act. The reopening closes at the original
 * deadline + 24h — a round number the group can wrap its head around.
 */
export async function reopenPoll(slug: string): Promise<LifecycleResult> {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    select: { id: true, creatorId: true, status: true, closesAt: true, deletedAt: true },
  });
  if (!poll || poll.deletedAt) return { ok: false, error: "That poll is gone." };
  if (poll.status !== "settled") return { ok: false, error: "It's still open." };

  const gate = await creatorGate(poll.id);
  if (gate) return { ok: false, error: gate };

  await prisma.poll.update({
    where: { id: poll.id },
    data: {
      status: "open",
      settledAt: null,
      closesAt: new Date(poll.closesAt.getTime() + REOPEN_WINDOW_MS),
    },
  });

  return { ok: true };
}

/** Retire: soft delete; the poll leaves the dashboard but stays recoverable. */
export async function retirePoll(slug: string): Promise<LifecycleResult> {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    select: { id: true, creatorId: true, deletedAt: true },
  });
  if (!poll) return { ok: false, error: "That poll is gone." };
  if (poll.deletedAt) return { ok: false, error: "Already retired." };

  const gate = await creatorGate(poll.id);
  if (gate) return { ok: false, error: gate };

  await prisma.poll.update({
    where: { id: poll.id },
    data: { deletedAt: new Date() },
  });

  return { ok: true };
}

export async function restorePoll(slug: string): Promise<LifecycleResult> {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    select: { id: true, creatorId: true, deletedAt: true },
  });
  if (!poll || !poll.deletedAt) return { ok: false, error: "Nothing to restore." };

  const gate = await creatorGate(poll.id);
  if (gate) return { ok: false, error: gate };

  await prisma.poll.update({ where: { id: poll.id }, data: { deletedAt: null } });
  return { ok: true };
}

/** Permanent delete — only reachable on already-retired polls. */
export async function deletePollForever(slug: string): Promise<LifecycleResult> {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    select: { id: true, creatorId: true, deletedAt: true },
  });
  if (!poll || !poll.deletedAt) {
    return { ok: false, error: "Retire it first — then you can delete it." };
  }

  const gate = await creatorGate(poll.id);
  if (gate) return { ok: false, error: gate };

  await prisma.poll.deleteMany({ where: { id: poll.id } });
  return { ok: true };
}

/**
 * Sudden death: the tie is broken with a fresh 10-minute ballot of just the
 * tied options. Honest, group-driven, and idempotent (one child per tie).
 */
export async function startSuddenDeath(slug: string): Promise<LifecycleResult> {
  const parent = await prisma.poll.findUnique({
    where: { slug },
    include: { options: true },
  });
  if (!parent || parent.deletedAt) return { ok: false, error: "That poll is gone." };
  if (parent.status !== "settled") return { ok: false, error: "The poll is still open." };
  if (parent.tieResolved) {
    const child = await prisma.poll.findFirst({
      where: { suddenDeathOfId: parent.id },
      select: { slug: true },
    });
    if (child) return { ok: true, redirectTo: `/p/${child.slug}` };
    // Reserved but orphaned mid-crash — give it one more go.
  }

  const gate = await creatorGate(parent.id);
  if (gate) return { ok: false, error: gate };

  const votes = await prisma.vote.findMany({
    where: { pollId: parent.id },
    select: { optionId: true },
  });
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.optionId, (counts.get(v.optionId) ?? 0) + 1);
  let max = 0;
  for (const c of counts.values()) max = Math.max(max, c);
  const tiedIds = [...counts.entries()]
    .filter(([, c]) => c === max && max > 0)
    .map(([id]) => id);
  const tiedOptions = parent.options.filter((o) => tiedIds.includes(o.id));
  if (tiedOptions.length < 2) {
    return { ok: false, error: "There's no real tie to break." };
  }

  // Reserve this tie with an atomic guard so only one sudden-death round starts.
  const reserved = await prisma.poll.updateMany({
    where: { id: parent.id, status: "settled", tieResolved: false, suddenDeathOfId: null },
    data: { tieResolved: true },
  });
  if (reserved.count !== 1) {
    return { ok: false, error: "A sudden-death round is already running." };
  }

  const slugBase = `${slug}-sudden-death`;
  let childSlug = slugBase;
  for (let i = 0; i < 4; i++) {
    const clash = await prisma.poll.findUnique({ where: { slug: childSlug } });
    if (!clash) break;
    childSlug = `${slugBase}-${Math.random().toString(36).slice(2, 5)}`;
  }

  const child = await prisma.poll.create({
    data: {
      slug: childSlug,
      creatorId: parent.creatorId,
      title: `${parent.title} — sudden death`,
      type: "single",
      maxChoices: 1,
      suggestions: false,
      status: "open",
      closesAt: new Date(Date.now() + 10 * 60 * 1000),
      suddenDeathOfId: parent.id,
      options: {
        create: tiedOptions.map((o, i) => ({
          label: o.label,
          displayOrder: i,
          source: "creator",
        })),
      },
    },
  });

  await prisma.poll.update({
    where: { id: parent.id },
    data: { suddenDeathOfId: child.id },
  });

  return { ok: true, redirectTo: `/p/${child.slug}` };
}