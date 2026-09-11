import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import PollForm from "@/components/create/poll-form";

export const metadata: Metadata = { title: "Create a poll" };

export default async function CreatePollPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.isGuest) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-black text-cocoa">
        Start the poll
      </h1>
      <p className="mt-1 text-cocoa-soft">
        Ask the question, drop options, share the link. You&apos;re the only one
        with an account.
      </p>

      <PollForm />
    </div>
  );
}