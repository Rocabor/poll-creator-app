import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { loadPollView } from "@/lib/poll-state";
import { relativeTime, closesInCompact } from "@/lib/time";
import VoteBooth from "@/components/vote/vote-booth";
import Reveal from "@/components/vote/reveal";
import ShareCardButton from "@/components/share-card";

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
  return {
    title: poll.title,
    description:
      "A group poll that lives in the chat. Tap to vote — no account needed, names land with the results.",
    openGraph: {
      title: poll.title,
      type: "website",
      url: new URL(`/p/${slug}`, APP_URL).toString(),
      images: [
        {
          url: new URL(`/api/og/${slug}`, APP_URL).toString(),
          width: 1200,
          height: 630,
          alt: `Tiebreak poll: ${poll.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: poll.title,
      description: "Group votes that live in the chat.",
      images: [new URL(`/api/og/${slug}`, APP_URL).toString()],
    },
  };
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
      {/* Back button & quick link */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-md p-1 text-xs font-bold text-cocoa-soft transition-colors hover:text-cocoa"
        >
          ← Back to polls
        </Link>

        {poll.isMine && (
          <ShareCardButton
            poll={poll}
            url={`${APP_URL}/p/${poll.slug}`}
            label="Share card"
          />
        )}
      </div>

      {/* Status Pill & Live Indicator */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {opensStill ? (
          <span className="inline-flex items-center gap-2 rounded-full border-cocoa-sm bg-teal-soft px-3 py-1 text-xs font-extrabold text-teal-deep">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-teal" aria-hidden="true" />
            Voting open · Live updates
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border-cocoa-sm bg-cream-deep px-3 py-1 text-xs font-extrabold text-cocoa-soft">
            <CheckCircle2 size={13} strokeWidth={2.5} aria-hidden="true" />
            Decision Settled
          </span>
        )}

        <span className="flex items-center gap-1 text-xs font-semibold text-cocoa-soft">
          <Clock size={13} className="text-tangerine" aria-hidden="true" />
          {opensStill
            ? `Closes ${closesInCompact(closesAt)} (${relativeTime(closesAt)})`
            : poll.settledAt
              ? `Closed ${relativeTime(new Date(poll.settledAt))}`
              : "Closed"}
        </span>

        {poll.maxChoices > 1 && (
          <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[11px] font-extrabold text-teal-deep">
            Pick up to {poll.maxChoices}
          </span>
        )}
      </div>

      {/* Main Poll Title */}
      <h1 className="mb-5 font-display text-2xl font-black leading-tight tracking-tight text-cocoa sm:text-3xl lg:text-4xl">
        {poll.title}
      </h1>

      {opensStill ? (
        <VoteBooth poll={poll} isMine={Boolean(poll.isMine)} />
      ) : (
        <Reveal poll={poll} isMine={Boolean(poll.isMine)} />
      )}
    </div>
  );
}