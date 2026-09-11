import type { Metadata } from "next";
import { ArrowRight, MessageSquare, Sparkles, Trophy, Users } from "lucide-react";
import { guestAction } from "@/app/actions/auth";
import Avatar from "@/components/avatar";

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
    body: "Friends pitch options you didn't think of. You approve or decline them — your call, house rules.",
  },
  {
    icon: Trophy,
    iconClass: "bg-tangerine text-cream-bright",
    title: "Honest live tallies",
    body: "Counts sit beside every percentage, bars stretch to the leader, and ties get called out in words.",
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
      <section className="border-b-2 border-[#38261A]/10 bg-cream-deep/60">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border-cocoa-sm bg-teal-soft px-3.5 py-1.5 text-xs font-bold text-teal-deep sm:text-sm">
            <Sparkles size={14} strokeWidth={2.8} aria-hidden="true" />
            Settle group decisions without the endless chat loop
          </span>

          <h1 className="riso-title mt-5 font-display text-4xl font-black leading-[1.05] tracking-tight text-cocoa sm:text-5xl lg:text-6xl">
            One vote flips it.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-cocoa-soft sm:text-lg">
            Twenty messages about pizza and still no dinner? Tiebreak puts the
            vote right into WhatsApp or Discord. No voter accounts, honest live
            scoreboards, and a reveal that feels like the end of a good game.
          </p>

          <form
            action={guestAction}
            className="mx-auto mt-8 flex max-w-md flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3"
          >
            <button
              type="submit"
              className="btn-game-piece flex w-full items-center justify-center gap-2 rounded-xl border-cocoa-sm bg-tangerine-deep px-6 py-2.5 font-display text-sm font-bold text-cream transition-colors hover:bg-tangerine sm:w-auto sm:rounded-full sm:px-6 sm:py-3 sm:text-base"
            >
              Try as Guest
            </button>
            <a
              href="/auth/signup"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-cocoa-sm bg-card px-6 py-2.5 font-display text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep sm:w-auto sm:rounded-full sm:px-6 sm:py-3 sm:text-base"
            >
              Create a poll
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </a>
          </form>

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

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="border-cocoa rounded-[22px] bg-card p-5 shadow-xs"
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
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="border-cocoa relative overflow-hidden rounded-[22px] bg-cream-deep p-6 text-center sm:p-8">
          <div className="mx-auto max-w-md">
            <span className="mb-1 block font-display text-xs font-bold tracking-wider text-cocoa-soft uppercase">
              Pre-loaded with real group data
            </span>
            <h2 className="mb-3 font-display text-2xl font-extrabold text-cocoa sm:text-3xl">
              Step right into Morgan&apos;s dashboard
            </h2>
            <p className="mb-6 text-sm text-cocoa-soft">
              Explore 5 realistic friend polls: a pizza night with a live race,
              Friday film club, an Airbnb picker, a dinner date, and a brunch
              booking.
            </p>
            <form action={guestAction}>
              <button
                type="submit"
                className="btn-game-piece shadow-press-teal rounded-xl border-cocoa-sm bg-teal px-6 py-2.5 font-display text-xs font-bold text-cream transition-colors hover:bg-teal-deep sm:rounded-full sm:px-6 sm:py-2.5 sm:text-sm"
              >
                Launch Guest Dashboard
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}