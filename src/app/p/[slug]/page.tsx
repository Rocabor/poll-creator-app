import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { loadPollView } from "@/lib/poll-state";
import { relativeTime, closesInCompact } from "@/lib/time";
import VoteBooth from "@/components/vote/vote-booth";
import Reveal from "@/components/vote/reveal";
import CopyLink from "@/components/copy-link";

export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const poll = await prisma.poll.findUnique({
    where: { slug },
    select: { title: true, deletedAt: true },
  });
  if (!poll || poll.deletedAt) return { title: "Poll not found" };
  return { title: poll.title };
}

export default async function PollPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  const poll = await loadPollView(slug, { userId: user?.id });

  if (!poll) notFound();

  const opensStill = poll.status === "open";
  const closesAt = new Date(poll.closesAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="text-sm font-bold text-teal underline underline-offset-2 hover:text-teal-deep"
      >
        ← back
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              opensStill ? "bg-teal-soft text-teal-deep" : "bg-butter-deep text-cocoa"
            }`}
          >
            {opensStill ? "Open for votes" : "Poll closed"}
          </span>
          {poll.isMine && (
            <span className="rounded-full bg-cream-deep px-3 py-1 text-xs font-bold uppercase tracking-wide text-cocoa-soft">
              Your poll
            </span>
          )}
        </div>

        <h1 className="riso-title mt-3 font-display text-4xl font-black text-cocoa sm:text-5xl">
          {poll.title}
        </h1>

        <p className="mt-3 text-cocoa-soft">
          {opensStill ? (
            <>
              Closes {closesInCompact(closesAt)} ({relativeTime(closesAt)})
            </>
          ) : poll.settledAt ? (
            <>Closed {relativeTime(new Date(poll.settledAt))}</>
          ) : (
            <>Closed</>
          )}
          {" · "}pick up to {poll.maxChoices === 1 ? "1 option" : `${poll.maxChoices} options`}
        </p>
      </header>

      {poll.isMine && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border-cocoa bg-card p-3">
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-cocoa">
            Share this link in the group chat:
          </p>
          <code className="hidden truncate rounded-lg bg-cream-deep px-3 py-1.5 text-xs text-cocoa-soft sm:block">
            {APP_URL}/p/{poll.slug}
          </code>
          <CopyLink
            url={`${APP_URL}/p/${poll.slug}`}
            label={`Share “${poll.title}”`}
          />
        </div>
      )}

      {opensStill ? (
        <VoteBooth poll={poll} isMine={Boolean(poll.isMine)} />
      ) : (
        <Reveal poll={poll} isMine={Boolean(poll.isMine)} />
      )}
    </div>
  );
}