import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-display text-sm font-bold tracking-widest text-tangerine-deep uppercase">
        404
      </p>
      <h1 className="riso-title mt-3 font-display text-4xl font-black text-cocoa">
        This poll wandered off
      </h1>
      <p className="mt-4 text-cocoa-soft">
        The link may be wrong, or the poll was retired. Hop back to your
        dashboard and grab it again.
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          href="/"
          className="btn-game-piece rounded-full bg-tangerine-deep px-6 py-3 font-display text-lg font-bold text-cream"
        >
          Back to the app
        </Link>
      </div>
    </div>
  );
}