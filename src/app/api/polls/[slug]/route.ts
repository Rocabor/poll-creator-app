import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadPollView } from "@/lib/poll-state";

export const dynamic = "force-dynamic";

/**
 * Read view of a poll for live results. Backers are runtime-attached only
 * once the poll is settled — the API never reveals who voted while it's open.
 * An optional ?token= reveals that token's own locked-in votes (the voter's
 * own device) — that's the voter seeing their own ballot, not attribution.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = request.nextUrl.searchParams.get("token");

  const view = await loadPollView(slug);
  if (!view) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let myVotes: string[] = [];
  let myName: string | null = null;

  if (token) {
    const my = await prisma.vote.findMany({
      where: { pollId: view.id, voterToken: token },
      select: { optionId: true, name: true },
    });
    myVotes = my.map((v) => v.optionId);
    myName = my[0]?.name ?? null;
  }

  return NextResponse.json({ poll: { ...view, myVotes, myName } });
}