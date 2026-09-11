import type { Metadata } from "next";
import { ArrowRight, MessageSquare, Sparkles, Trophy, Users } from "lucide-react";
import { guestAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Group votes that live in the chat",
  description:
    "Create a poll, drop the link in the group chat. Friends tap to vote with no account — and the reveal shows who backed the winner.",
};

const PILLARS = [
  {
    icon: Users,
    iconClass: "bg-teal-soft text-teal-deep",
    title: "Zero sign-up walls",
    body: "Voters tap the link on their phone, pick an avatar face, and vote in seconds. No apps, no passwords.",
  },
  {
    icon: MessageSquare,
    iconClass: "bg-butter text-cocoa",
    title: "Voter suggestions",
    body: "Friends can suggest places you didn't think of. You approve or decline — your call, house rules.",
  },
  {
    icon: Trophy,
    iconClass: "bg-tangerine text-cream-bright",
    title: "Honest live tallies",
    body: "No misleading percentage bars at 7 votes. Per-voter scoreboard tallies keep the race crystal clear.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="mb-10 text-center sm:mb-14">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3.5 py-1.5 text-xs font-extrabold text-teal-deep sm:text-sm">
          <Sparkles size={14} strokeWidth={2.8} aria-hidden="true" />
          Settle group decisions without the endless chat loop
        </span>

        <h1 className="riso-title mb-4 font-display text-4xl font-black leading-[1.05] tracking-tight text-cocoa sm:text-5xl lg:text-6xl">
          Decisions made for real group chats.
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-base font-medium leading-relaxed text-cocoa-soft sm:text-lg">
          Twenty messages about pizza and still no dinner? Tiebreak puts the
          vote right into WhatsApp or Discord. No voter accounts, honest live
          scoreboards, and a reveal that feels like the end of a good game.
        </p>

        <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
          <form action={guestAction} className="w-full sm:w-auto">
            <button
              type="submit"
              className="btn-game-piece flex w-full items-center justify-center gap-2 rounded-xl border-cocoa-sm bg-tangerine-deep px-5 py-2.5 font-display text-sm font-bold text-cream transition-colors hover:bg-tangerine sm:rounded-full sm:px-6 sm:py-3 sm:text-base"
            >
              Try as Guest (Explore Demo)
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </form>
          <a
            href="/auth/signup"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-cocoa-sm bg-card px-5 py-2.5 font-display text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep sm:w-auto sm:rounded-full sm:px-6 sm:py-3 sm:text-base"
          >
            Create a poll
          </a>
        </div>
      </section>

      {/* Product Pillars / Why Tiebreak */}
      <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="border-cocoa rounded-lg bg-card p-5 shadow-xs"
          >
            <span
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border-cocoa-sm ${pillar.iconClass}`}
            >
              <pillar.icon size={20} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <h2 className="mb-1 font-display text-lg font-extrabold text-cocoa">
              {pillar.title}
            </h2>
            <p className="text-xs text-cocoa-soft sm:text-sm">{pillar.body}</p>
          </div>
        ))}
      </section>

      {/* Guest Mode Callout */}
      <section className="border-cocoa relative overflow-hidden rounded-lg bg-cream-deep p-6 text-center sm:p-8">
        <div className="mx-auto max-w-md">
          <span className="mb-1 block font-display text-xs font-bold tracking-wider text-cocoa-soft uppercase">
            Pre-loaded with real group data
          </span>
          <h2 className="mb-3 font-display text-2xl font-extrabold text-cocoa sm:text-3xl">
            Step right into Morgan&apos;s dashboard
          </h2>
          <p className="mb-6 text-sm text-cocoa-soft">
            Explore 5 realistic friend polls: Pizza night (close live race),
            Friday film club, Airbnb picker, dinner date, and brunch booking.
          </p>
          <form action={guestAction}>
            <button
              type="submit"
              className="btn-game-piece shadow-press-teal rounded-xl border-cocoa-sm bg-teal px-5 py-2.5 font-display text-xs font-bold text-cream transition-colors hover:bg-teal-deep sm:rounded-full sm:px-6 sm:text-sm"
            >
              Launch Guest Dashboard
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}