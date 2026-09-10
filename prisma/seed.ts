import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_EMAIL = "morgan@tiebreak.test";
const DEMO_PASSWORD = "guest1234";

// Reference instant in the challenge dataset. Everything is shifted onto real
// "now" so the demo stays alive: open polls close in the near future,
// settled polls stay in the past (perfectly ordered).
const SAMPLE = JSON.parse(
  readFileSync(path.join(__dirname, "..", "data", "sample-polls.json"), "utf8")
) as {
  creator: { name: string; avatar: { seed: string; tint: string } };
  polls: {
    id: string;
    title: string;
    type: string;
    maxChoices: number;
    suggestionsEnabled: boolean;
    status: string;
    createdAt: string;
    closesAt: string;
    settledAt: string | null;
    options: {
      id: string;
      label: string;
      source: string;
      suggestionStatus?: string;
      suggestedBy?: { name: string; avatar: { seed: string; tint: string } };
    }[];
    votes: {
      optionId: string;
      voter: { name: string; avatar: { seed: string; tint: string } };
      voterToken: string;
      castAt: string;
    }[];
  }[];
};

const BASE = SAMPLE.polls.reduce((earliest, p) => {
  for (const ts of [p.createdAt, p.closesAt, ...(p.settledAt ? [p.settledAt] : []), ...p.votes.map((v) => v.castAt)]) {
    const t = new Date(ts).getTime();
    if (t < earliest) earliest = t;
  }
  return earliest;
}, Infinity);

const SHIFT = Date.now() - BASE;

function ts(iso: string): Date {
  return new Date(new Date(iso).getTime() + SHIFT);
}

async function main() {
  console.log("Seeding Tiebreak with the guest dataset (Morgan + 5 polls, 32 votes)…");

  const demoUser = await prisma.user.upsert({
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
  console.log(`  creator: ${demoUser.name} (${demoUser.email})`);

  for (const p of SAMPLE.polls) {
    const poll = await prisma.poll.upsert({
      where: { slug: p.id },
      update: {},
      create: {
        slug: p.id,
        creatorId: demoUser.id,
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
      p.options.map((o) => [
        o.id,
        `opt-${p.id}-${o.id}`,
      ])
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

    console.log(
      `  poll: ${p.id} — ${p.status}, ${p.votes.length} vote(s)`
    );
  }

  await prisma.$disconnect();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});