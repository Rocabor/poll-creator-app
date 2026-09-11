import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import PollForm, { type InitialPoll } from "@/components/create/poll-form";

export const metadata: Metadata = { title: "Create a poll" };

export default async function CreatePollPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.isGuest) redirect("/auth/login");

  const { from } = await searchParams;
  let initial: InitialPoll | undefined;
  if (from) {
    const source = await prisma.poll.findFirst({
      where: { slug: from, creatorId: user.id, deletedAt: null },
      include: { options: { orderBy: { displayOrder: "asc" } } },
    });
    if (source) {
      initial = {
        title: source.title,
        type: source.type as "single" | "multi",
        maxChoices: source.maxChoices,
        suggestions: source.suggestions,
        options: source.options.map((o) => o.label),
      };
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-black text-cocoa">
        {initial ? "Run it again" : "Start the poll"}
      </h1>
      <p className="mt-1 text-cocoa-soft">
        {initial
          ? `“${initial.title}” is pre-filled from last time.`
          : "Ask the question, drop options, share the link. You’re the only one with an account."}
      </p>

      <PollForm initial={initial} />
    </div>
  );
}