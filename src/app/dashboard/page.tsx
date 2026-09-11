import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { settleIfDue } from "@/lib/poll-state";
import DashboardPollCard from "@/components/dashboard/poll-card";
import type { DashboardPoll } from "@/components/dashboard/poll-card";

export const metadata: Metadata = { title: "Your polls" };
export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

interface Grouped {
  open: DashboardPoll[];
  settled: DashboardPoll[];
  retired: DashboardPoll[];
}

async function loadDashboard(userId: string): Promise<Grouped> {
  const now = new Date();

  // Read-time settlement (auto-close at the deadline even with the page closed).
  const overdue = await prisma.poll.findMany({
    where: { creatorId: userId, deletedAt: null, status: "open" },
    select: { id: true, status: true, closesAt: true, settledAt: true },
  });
  await Promise.all(
    overdue
      .map((p) => settleIfDue(p))
      .filter((r) => r.changed)
      .map((r) =>
        prisma.poll.updateMany({
          where: { creatorId: userId, deletedAt: null, status: "open" },
          data: { status: "settled", settledAt: r.settledAt },
        })
      )
  );

  const polls = await prisma.poll.findMany({
    where: { creatorId: userId },
    include: {
      options: true,
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const grouped: Grouped = { open: [], settled: [], retired: [] };

  for (const poll of polls) {
    const voteCounts = new Map<string, number>();
    const votes = await prisma.vote.findMany({
      where: { pollId: poll.id },
      select: { optionId: true, voterToken: true },
    });
    for (const v of votes) {
      voteCounts.set(v.optionId, (voteCounts.get(v.optionId) ?? 0) + 1);
    }

    const pendingSuggestions = poll.options.filter(
      (o) => o.source === "suggestion" && o.suggestionStatus === "pending"
    ).length;

    const item: DashboardPoll = {
      slug: poll.slug,
      title: poll.title,
      status: poll.status,
      closesAt: poll.closesAt,
      settledAt: poll.settledAt,
      deletedAt: poll.deletedAt,
      voteCount: votes.length,
      voterTokens: new Set(votes.map((v) => v.voterToken)).size,
      pendingSuggestions,
      options: poll.options.map((o) => ({
        id: o.id,
        label: o.label,
        votesCount: voteCounts.get(o.id) ?? 0,
      })),
    };

    if (poll.deletedAt) grouped.retired.push(item);
    else if (poll.status === "settled") grouped.settled.push(item);
    else grouped.open.push(item);
  }

  return grouped;
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/landing");

  const { open, settled, retired } = await loadDashboard(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-cocoa">
            {user.name}&apos;s polls
          </h1>
          <p className="mt-1 text-cocoa-soft">
            {open.length + settled.length} poll
            {open.length + settled.length === 1 ? "" : "s"} running or wrapped
          </p>
        </div>
        <Link
          href="/create"
          className="btn-game-piece rounded-full bg-tangerine px-6 py-3 font-display text-lg font-bold text-cream"
        >
          + New poll
        </Link>
      </div>

      {user.isGuest && (
        <div className="mt-6 rounded-2xl border-cocoa bg-teal-soft p-4">
          <p className="font-display font-bold text-teal-deep">
            You&apos;re in the demo — this is Morgan&apos;s account.
          </p>
          <p className="mt-1 text-sm text-teal-deep">
            <Link href="/auth/signup" className="font-bold underline underline-offset-2">
              Create your own account
            </Link>{" "}
            to be the creator of your own polls.
          </p>
        </div>
      )}

      <section className="mt-8" aria-labelledby="open-heading">
        <h2 id="open-heading" className="font-display text-xl font-bold text-cocoa">
          Open
          <span className="ml-2 text-cocoa-faint">({open.length})</span>
        </h2>
        {open.length === 0 ? (
          <Empty label="Nothing open right now." />
        ) : (
          <ul className="mt-3 space-y-3">
            {open.map((poll) => (
              <DashboardPollCard
                key={poll.slug}
                poll={poll}
                shareUrl={`${APP_URL}/p/${poll.slug}`}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="settled-heading">
        <h2 id="settled-heading" className="font-display text-xl font-bold text-cocoa">
          Settled
          <span className="ml-2 text-cocoa-faint">({settled.length})</span>
        </h2>
        {settled.length === 0 ? (
          <Empty label="Nothing wrapped yet." />
        ) : (
          <ul className="mt-3 space-y-3">
            {settled.map((poll) => (
              <DashboardPollCard
                key={poll.slug}
                poll={poll}
                shareUrl={`${APP_URL}/p/${poll.slug}`}
              />
            ))}
          </ul>
        )}
      </section>

      {retired.length > 0 && (
        <section className="mt-10" aria-labelledby="retired-heading">
          <h2 id="retired-heading" className="font-display text-xl font-bold text-cocoa">
            Retired
            <span className="ml-2 text-cocoa-faint">({retired.length})</span>
          </h2>
          <ul className="mt-3 space-y-3">
            {retired.map((poll) => (
              <DashboardPollCard
                key={poll.slug}
                poll={poll}
                shareUrl={`${APP_URL}/p/${poll.slug}`}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="mt-3 rounded-xl border-2 border-dashed border-cocoa/30 px-4 py-6 text-center text-cocoa-soft">
      {label}
    </p>
  );
}