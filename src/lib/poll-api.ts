import type { PollView } from "@/lib/types";

export interface PollApiResponse {
  poll: PollView & { myVotes: string[]; myName: string | null };
}

const tokenRegex = /^[A-Za-z0-9_-]{8,64}$/;

export async function fetchPoll(
  slug: string,
  token?: string | null
): Promise<PollApiResponse | null> {
  const query = token && tokenRegex.test(token) ? `?token=${encodeURIComponent(token)}` : "";
  const res = await fetch(`/api/polls/${encodeURIComponent(slug)}${query}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as PollApiResponse;
}