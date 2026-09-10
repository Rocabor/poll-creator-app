import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="font-display text-sm font-bold tracking-widest text-tangerine-deep uppercase">
        Group polls for the group chat
      </p>
      <h1 className="riso-title mt-4 font-display text-5xl font-black text-cocoa sm:text-6xl">
        One vote flips it.
      </h1>
      <p className="mt-6 text-lg text-cocoa-soft">
        Create a poll, drop the link in the chat. Friends tap to vote with no
        account — and when the poll closes, the winner reveals who backed it.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/auth/signup"
          className="btn-game-piece rounded-full bg-tangerine px-7 py-3.5 font-display text-lg font-bold text-cream"
        >
          Create a poll
        </Link>
        <Link
          href="/auth/login"
          className="rounded-full border-2 border-cocoa bg-card px-7 py-3.5 font-display text-lg font-bold text-cocoa transition-colors hover:bg-cream-deep"
        >
          Log in
        </Link>
      </div>
    </section>
  );
}