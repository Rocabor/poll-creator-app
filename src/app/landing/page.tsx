import type { Metadata } from "next";
import { guestAction } from "@/app/actions/auth";
import Avatar from "@/components/avatar";

export const metadata: Metadata = {
  title: "Group votes that live in the chat",
  description:
    "Create a poll, drop the link in the group chat. Friends tap to vote with no account — and the reveal shows who backed the winner.",
};

const STEPS = [
  {
    n: "1",
    title: "Start the poll",
    body: "Tell the gang what's up: pizza, a film, a date night. Tap the link — done.",
  },
  {
    n: "2",
    title: "They tap to vote",
    body: "No accounts, no downloads. Name, avatar, done. They can even pitch options.",
  },
  {
    n: "3",
    title: "Reveal who backed it",
    body: "When it closes, everyone sees the winner — and exactly who carried it over the line.",
  },
];

const DEMO_VOTERS = [
  { name: "Priya", seed: "Priya", tint: "f8c9b9" },
  { name: "Ada", seed: "Ada", tint: "f6e0a4" },
  { name: "Jonah", seed: "Jonah", tint: "cbe2d8" },
  { name: "Kai", seed: "Kai", tint: "e3d2f2" },
  { name: "Lena", seed: "Lena", tint: "e3d2f2" },
  { name: "Sam", seed: "Sam", tint: "f6e0a4" },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b-2 border-cocoa bg-cream-deep/60">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="font-display text-sm font-bold tracking-widest text-tangerine-deep uppercase">
            Group votes for the group chat
          </p>
          <h1 className="riso-title mt-4 font-display text-5xl font-black text-cocoa sm:text-6xl">
            One vote flips it.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cocoa-soft">
            Create a poll, drop the link in the chat. Friends tap to vote on
            their phones with no account — and when the poll closes, the reveal
            shows who backed the winner.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/auth/signup"
              className="btn-game-piece rounded-full bg-tangerine px-7 py-3.5 font-display text-lg font-bold text-cream"
            >
              Create a poll
            </a>
            <a
              href="/auth/login"
              className="rounded-full border-2 border-cocoa bg-card px-7 py-3.5 font-display text-lg font-bold text-cocoa transition-colors hover:bg-cream-deep"
            >
              Log in
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center gap-1">
            {DEMO_VOTERS.map((v) => (
              <Avatar
                key={v.name}
                name={v.name}
                seed={v.seed}
                tint={v.tint}
                size={38}
                className="border-2"
              />
            ))}
            <span className="ml-3 rounded-full border-cocoa-sm bg-card px-3 py-1 text-sm font-bold text-cocoa-soft">
              No accounts. Just votes.
            </span>
          </div>
        </div>
      </section>

      {/* Guest / how-it-works */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-black text-cocoa">
              How it works
            </h2>
            <ol className="mt-6 space-y-6">
              {STEPS.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-cocoa bg-butter font-display text-xl font-black text-cocoa"
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cocoa">
                      {step.title}
                    </h3>
                    <p className="mt-1 max-w-md text-cocoa-soft">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="border-cocoa flex flex-col justify-center rounded-2xl bg-card p-6">
            <h2 className="font-display text-2xl font-black text-cocoa">
              See it with real votes
            </h2>
            <p className="mt-2 text-cocoa-soft">
              Jump straight into a demo account with 5 polls and 32 real votes —
              an order in the works, a film pick, and a reveal you can reopen.
            </p>

            <form
              action={guestAction}
              className="mt-6 flex flex-col items-start gap-3"
            >
              <button
                type="submit"
                className="btn-game-piece w-full rounded-full bg-teal px-7 py-3.5 font-display text-lg font-bold text-cream"
              >
                Try the demo
              </button>
              <p className="text-xs text-cocoa-soft">
                No sign-up. You get Morgan&apos;s dashboard instantly.
              </p>
            </form>
          </aside>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t-2 border-cocoa/20 bg-cream-deep/40">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-bold text-cocoa">
              Honest results
            </h3>
            <p className="mt-1 text-sm text-cocoa-soft">
              Every bar shows its count and sits relative to the leader. Ties
              are called out in words — no fake noise at 7 votes.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-cocoa">
              Friends pitch in
            </h3>
            <p className="mt-1 text-sm text-cocoa-soft">
              Voters can suggest options. You approve or decline them from the
              same page.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-cocoa">
              Reveal at close
            </h3>
            <p className="mt-1 text-sm text-cocoa-soft">
              Votes are private while it&apos;s open. When it closes, the winner&apos;s
              backers are named.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}