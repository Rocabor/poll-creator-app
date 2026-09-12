import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Flame, Plus, Sparkles, Vote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { settleIfDue } from "@/lib/poll-state";
import { closesInCompact } from "@/lib/time";
import DashboardPollCard from "@/components/dashboard/poll-card";
import DashboardTabs from "@/components/dashboard/tabs";
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

function leadingLabel(p: DashboardPoll): string | null {
  let best = 0;
  let label: string | null = null;
  let tied = false;
  for (const o of p.options) {
    if (o.votesCount === best && best > 0) tied = true;
    if (o.votesCount > best) {
      best = o.votesCount;
      label = o.label;
      tied = false;
    }
  }
  if (best === 0 || tied) return null;
  return (label ?? "").split(" ")[0];
}

function EmptyList({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-cocoa rounded-lg bg-card p-8 text-center">
      <div className="border-cocoa-sm mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-deep text-cocoa">
        <Vote size={24} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <h2 className="mb-1 font-display text-xl font-extrabold text-cocoa">{title}</h2>
      <p className="mx-auto mb-4 max-w-sm text-xs text-cocoa-soft sm:text-sm">{body}</p>
      {action}
    </div>
  );
}

function PollList({
  polls,
  shareUrl,
  emptyTitle,
  emptyBody,
  emptyAction,
}: {
  polls: DashboardPoll[];
  shareUrl: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: React.ReactNode;
}) {
  if (polls.length === 0) {
    return <EmptyList title={emptyTitle} body={emptyBody} action={emptyAction} />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {polls.map((poll) => (
        <DashboardPollCard key={poll.slug} poll={poll} shareUrl={`${shareUrl}/${poll.slug}`} />
      ))}
    </ul>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/landing");

  const { open, settled, retired } = await loadDashboard(user.id);

  // Featured card: the open poll closing soonest.
  const featured = open.length > 0
    ? [...open].sort(
        (a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime()
      )[0]
    : null;
  const featuredLeader = featured ? leadingLabel(featured) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-0.5 text-xs font-bold tracking-wider text-cocoa-soft uppercase">
            Welcome back, {user.name.split(" ")[0]}
          </p>
          <h1 className="font-display text-2xl font-black tracking-tight text-cocoa sm:text-3xl">
            Your Group Decisions
          </h1>
        </div>
        <Link
          href="/create"
          className="btn-game-piece inline-flex items-center gap-1.5 rounded-xl border-cocoa-sm bg-tangerine-deep px-3.5 py-1.5 text-xs font-bold text-cream transition-all hover:-translate-y-px hover:shadow-press-tangerine sm:rounded-full sm:px-4 sm:py-2 sm:text-sm"
        >
          <Plus aria-hidden="true" size={15} strokeWidth={2.6} />
          <span className="hidden sm:inline">New poll</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {user.isGuest && (
        <div className="mb-6 border-cocoa rounded-lg bg-teal-soft p-4 shadow-sm">
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

      {featured && (
        <Link
          href={`/p/${featured.slug}`}
          className="group mb-6 block rounded-lg border-cocoa bg-cream-deep p-4 shadow-sm transition-all hover:border-tangerine sm:p-5"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tangerine px-3 py-0.5 text-xs font-extrabold tracking-wide text-cream">
              <Flame size={13} strokeWidth={2.5} aria-hidden="true" />
              Needs attention · closing soonest
            </span>
            {featured.pendingSuggestions > 0 && (
              <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-cocoa/30 bg-butter px-2.5 py-0.5 text-xs font-bold text-cocoa">
                <Sparkles size={12} strokeWidth={2.5} aria-hidden="true" />
                {featured.pendingSuggestions} pending suggestion
                {featured.pendingSuggestions === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <h2 className="mb-2 font-display text-xl font-black leading-snug text-cocoa transition-colors group-hover:text-tangerine sm:text-2xl">
            {featured.title}
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cocoa/10 pt-2 text-xs font-semibold text-cocoa-soft sm:text-sm">
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-tangerine" aria-hidden="true" />
              <span className="font-bold text-cocoa">
                Closes {closesInCompact(featured.closesAt)}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums font-bold text-cocoa">
                {featured.voteCount} vote{featured.voteCount === 1 ? "" : "s"}
              </span>
              {featured.voteCount > 0 && <span aria-hidden="true">·</span>}
              <span className="text-teal-deep">
                {featuredLeader
                  ? `${featuredLeader} in the lead`
                  : featured.voteCount > 0
                    ? "Too close to call"
                    : "No votes yet"}
              </span>
            </span>
          </div>
        </Link>
      )}

      <DashboardTabs
        defaultTab="open"
        tabs={[
          {
            key: "open",
            label: "Open Polls",
            count: open.length,
            children: (
              <PollList
                polls={open}
                shareUrl={`${APP_URL}/p`}
                emptyTitle="No open polls right now"
                emptyBody="Start a new decision for pizza, films, or weekend dates in under a minute."
                emptyAction={
                  <Link
                    href="/create"
                    className="btn-game-piece inline-flex rounded-full border-cocoa-sm bg-tangerine-deep px-5 py-2.5 text-sm font-bold text-cream transition-all hover:-translate-y-px hover:shadow-press-tangerine"
                  >
                    Create your first poll
                  </Link>
                }
              />
            ),
          },
          {
            key: "settled",
            label: "Settled",
            count: settled.length,
            children: (
              <PollList
                polls={settled}
                shareUrl={`${APP_URL}/p`}
                emptyTitle="No settled polls yet"
                emptyBody="Decided polls will appear here with final winner attribution."
              />
            ),
          },
          ...(retired.length > 0
            ? [
                {
                  key: "retired" as const,
                  label: "Retired",
                  count: retired.length,
                  children: (
                    <PollList
                      polls={retired}
                      shareUrl={`${APP_URL}/p`}
                      emptyTitle="No retired polls"
                      emptyBody="Retired polls land here where you can restore or permanently delete them."
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}