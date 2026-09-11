"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { DEMO_EMAIL, resetDemoPolls } from "@/lib/sample-data";

export async function reloadSampleDataAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  } else if (user.email !== DEMO_EMAIL) {
    redirect("/dashboard");
  }
  await resetDemoPolls(prisma, user.id);
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/dashboard");
}