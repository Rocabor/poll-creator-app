import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import rawSample from "../../data/sample-polls.json";

export const DEMO_EMAIL = "morgan@tiebreak.test";
const DEMO_PASSWORD = "guest1234";

interface SampleOption {
  id: string;
  label: string;
  source: string;
  suggestionStatus?: string;
  suggestedBy?: { name: string; avatar: { seed: string; tint: string } };
}

interface SamplePoll {
  id: string;
  title: string;
  type: string;
  maxChoices: number;
  suggestionsEnabled: boolean;
  status: string;
  createdAt: string;
  closesAt: string;
  settledAt: string | null;
  options: SampleOption[];
  votes: {
    optionId: string;
    voter: { name: string; avatar: { seed: string; tint: string } };
    voterToken: string;
    castAt: string;
  }[];
}

const SAMPLE = rawSample as {
  creator: { name: string; avatar: { seed: string; tint: string } };
  polls: SamplePoll[];
};

const ANCHOR_CLOSE_ISO = "2026-09-17T18:00:00Z";
const ANCHOR_BUFFER_MS = 5 * 3_600_000;
const SHIFT =
  Date.now() + ANCHOR_BUFFER_MS - new Date(ANCHOR_CLOSE_ISO).getTime();

function ts(iso: string): Date {
  return new Date(new Date(iso).getTime() + SHIFT);
}

export async function ensureDemoUser(prisma: PrismaClient) {
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: SAMPLE.creator.name,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      avatarSeed: SAMPLE.creator.avatar.seed,
      avatarTint: SAMPLE.creator.avatar.tint,
    },
  });
}

export async function resetDemoPolls(
  prisma: PrismaClient,
  creatorId: string
): Promise<void> {
  await prisma.poll.deleteMany({ where: { creatorId } });

  for (const p of SAMPLE.polls) {
    const poll = await prisma.poll.create({
      data: {
        slug: p.id,
        creatorId,
        title: p.title,
        type: p.type,
        maxChoices: p.maxChoices,
        suggestions: p.suggestionsEnabled,
        status: p.status,
        createdAt: ts(p.createdAt),
        closesAt: ts(p.closesAt),
        settledAt: p.settledAt ? ts(p.settledAt) : null,
        options: {
          create: p.options.map((o, index) => ({
            id: `opt-${p.id}-${o.id}`,
            label: o.label,
            displayOrder: index,
            source: o.source,
            suggestionStatus:
              o.source === "suggestion"
                ? (o.suggestionStatus ?? "pending")
                : null,
            suggestedByName: o.suggestedBy?.name ?? null,
            suggestedSeed: o.suggestedBy?.avatar.seed ?? null,
            suggestedTint: o.suggestedBy?.avatar.tint ?? null,
          })),
        },
      },
    });

    const optionIdMap = new Map(
      p.options.map((o) => [o.id, `opt-${p.id}-${o.id}`])
    );

    for (const v of p.votes) {
      await prisma.vote.create({
        data: {
          pollId: poll.id,
          optionId: optionIdMap.get(v.optionId)!,
          name: v.voter.name,
          seed: v.voter.avatar.seed,
          tint: v.voter.avatar.tint,
          voterToken: v.voterToken,
          castAt: ts(v.castAt),
        },
      });
    }
  }
}