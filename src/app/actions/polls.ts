"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type CreatePollState = { error?: string } | null;

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;

const deadlineSchema = z.object({
  closesAt: z.coerce.date(),
});

const createSchema = z.object({
  title: z.string().trim().min(1, "Give the poll a title").max(90),
  type: z.enum(["single", "multi"]),
  maxChoices: z.coerce
    .number()
    .int()
    .min(1)
    .max(4, "Pick-ups above 4 get unwieldy"),
  suggestions: z.coerce.boolean(),
});

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export async function createPollAction(
  _prev: CreatePollState,
  formData: FormData
): Promise<CreatePollState> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    maxChoices: formData.get("maxChoices") ?? 1,
    suggestions: formData.get("suggestions") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, type, maxChoices, suggestions } = parsed.data;

  const rawOptions = (formData.getAll("option") as string[])
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => o.slice(0, 80));

  if (rawOptions.length < MIN_OPTIONS) {
    return { error: `Add at least ${MIN_OPTIONS} options.` };
  }
  if (rawOptions.length > MAX_OPTIONS) {
    return { error: `Keep it to ${MAX_OPTIONS} options.` };
  }
  const seen = new Set<string>();
  for (const o of rawOptions) {
    const key = o.toLowerCase();
    if (seen.has(key)) return { error: `“${o}” appears twice.` };
    seen.add(key);
  }
  if (type === "multi" && maxChoices > rawOptions.length) {
    return { error: "You can't pick more than the total number of options." };
  }

  const closesAtValue = formData.get("closesAt");
  if (!closesAtValue) return { error: "Pick a closing time." };
  const closesAt = deadlineSchema.shape.closesAt.safeParse(closesAtValue);
  if (!closesAt.success) return { error: "That closing time isn't valid." };
  const closes = closesAt.data;
  if (closes.getTime() <= Date.now() + 60_000) {
    return { error: "Closing time must be at least a minute from now." };
  }
  if (closes.getTime() > Date.now() + 365 * 86_400_000) {
    return { error: "A poll can't run longer than a year." };
  }

  const baseSlug = slugify(title) || "poll";
  let slug = `${baseSlug}-${randomSuffix()}`;
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.poll.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${randomSuffix()}`;
  }

  const poll = await prisma.poll.create({
    data: {
      slug,
      creatorId: user.id,
      title,
      type,
      maxChoices: type === "single" ? 1 : maxChoices,
      suggestions,
      status: "open",
      closesAt: closes,
      options: {
        create: rawOptions.map((label, index) => ({
          label,
          displayOrder: index,
          source: "creator",
        })),
      },
    },
  });

  redirect(`/p/${poll.slug}`);
}