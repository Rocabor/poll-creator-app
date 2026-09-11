import type { Metadata } from "next";
import Link from "next/link";
import SignupForm from "@/components/signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="border-cocoa rounded-2xl bg-card p-6">
        <h1 className="font-display text-3xl font-black text-cocoa">
          Make your own polls
        </h1>
        <p className="mt-1 text-cocoa-soft">
          One account per creator. Your voters never need one.
        </p>

        <div className="mt-6">
          <SignupForm />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-cocoa-soft">
        Just exploring?{" "}
        <Link href="/landing" className="font-bold text-teal underline underline-offset-2">
          Go to the landing
        </Link>
      </p>
    </div>
  );
}