"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { settleIfDue } from "@/lib/poll-state";
import { getSessionUser } from "@/lib/auth";

export interface SuggestionResult {
  ok: boolean;
  error?: string;
}

const suggestSchema = z.object({
  slug: z.string().max(120),
  label: z.string().trim().min(2, "Keep it short and sweet").max(60),
  name: z.string().trim().min(1).max(40),
  seed: z.string().trim().min(1).max(80),
  tint: z.string().trim().min(1).max(32),
  token: z.string().trim().min(8).max(64),
});

export async function suggestOption(input: unknown): Promise<SuggestionResult> {
  const parsed = suggestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid suggestion." };
  }
  const { slug, label, name, seed, tint, token } = parsed.data;

  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: { options: true },
  });
  if (!poll || poll.deletedAt) return { ok: false, error: "This poll doesn't exist." };

  if (!poll.suggestions) return { ok: false, error: "Suggestions are off for this poll." };
  if (poll.status !== "open") return { ok: false, error: "This poll is closed." };

  const duplicates = poll.options.some(
    (o) => o.label.toLowerCase() === label.toLowerCase()
  );
  if (duplicates) return { ok: false, error: "That option is already on the ballot." };

  await prisma.option.create({
    data: {
      pollId: poll.id,
      label,
      displayOrder: poll.options.length,
      source: "suggestion",
      suggestionStatus: "pending",
      suggestedByName: name,
      suggestedSeed: seed,
      suggestedTint: tint,
    },
  });

  revalidatePath(`/p/${slug}`);
  return { ok: true };
}

async function requireCreator(option: { poll: { creatorId: string } }) {
  const user = await getSessionUser();
  if (!user || option.poll.creatorId !== user.id) {
    return "Only the poll creator can do that.";
  }
  return null;
}

export async function approveSuggestion(optionId: string): Promise<SuggestionResult> {
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { poll: { select: { creatorId: true, slug: true, status: true } } },
  });
  if (!option) return { ok: false, error: "That option is gone." };
  if (option.poll.status !== "open") return { ok: false, error: "This poll is closed." };

  const denied = await requireCreator(option);
  if (denied) return { ok: false, error: denied };

  await prisma.option.update({
    where: { id: optionId },
    data: { suggestionStatus: "approved" },
  });
  revalidatePath(`/p/${option.poll.slug}`);
  return { ok: true };
}

export async function declineSuggestion(optionId: string): Promise<SuggestionResult> {
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { poll: { select: { creatorId: true, slug: true, status: true } } },
  });
  if (!option) return { ok: false, error: "That option is gone." };
  if (option.poll.status !== "open") return { ok: false, error: "This poll is closed." };

  const denied = await requireCreator(option);
  if (denied) return { ok: false, error: denied };

  await prisma.option.update({
    where: { id: optionId },
    data: { suggestionStatus: "declined" },
  });
  revalidatePath(`/p/${option.poll.slug}`);
  return { ok: true };
}

/** Undo a decline — the suggestion returns to the pending queue. */
export async function undoDecline(optionId: string): Promise<SuggestionResult> {
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { poll: { select: { creatorId: true, slug: true, status: true } } },
  });
  if (!option) return { ok: false, error: "That option is gone." };
  if (option.poll.status !== "open") return { ok: false, error: "This poll is closed." };

  const denied = await requireCreator(option);
  if (denied) return { ok: false, error: denied };

  await prisma.option.update({
    where: { id: optionId },
    data: { suggestionStatus: "pending" },
  });
  revalidatePath(`/p/${option.poll.slug}`);
  return { ok: true };
}

/** Permanently remove a declined suggestion (it never had votes). */
export async function removeDeclined(optionId: string): Promise<SuggestionResult> {
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { poll: { select: { creatorId: true, slug: true } }, _count: { select: { votes: true } } },
  });
  if (!option) return { ok: false, error: "That option is gone." };

  const denied = await requireCreator(option);
  if (denied) return { ok: false, error: denied };

  if (option._count.votes > 0) return { ok: false, error: "It already has votes — keep it." };

  await prisma.option.delete({ where: { id: optionId } });
  revalidatePath(`/p/${option.poll.slug}`);
  return { ok: true };
}