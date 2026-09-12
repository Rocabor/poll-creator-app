import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// DB-backed sliding counters. In-memory only works on a single serverless
// instance; Supabase/Vercel scale horizontally, so the window lives in the
// same Postgres the app already uses. Keys are constructed by the callers
// (e.g. `login:${ip}:${email}`, `vote:${pollId}:${ip}`).

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return ip.slice(0, 64);
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowEnd = new Date(now + windowSeconds * 1000);

  const row = await prisma.rateLimit.findUnique({ where: { key } });
  if (!row) {
    await prisma.rateLimit.create({ data: { key, count: 1, windowEnd } });
    return { ok: true };
  }

  if (row.windowEnd.getTime() <= now) {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, windowEnd },
    });
    return { ok: true };
  }

  if (row.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((row.windowEnd.getTime() - now) / 1000)),
    };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { ok: true };
}

/** Drop a counter on success (e.g. a successful login resets its window). */
export async function clearRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}