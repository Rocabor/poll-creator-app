import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="border-cocoa rounded-2xl bg-card p-6">
        <h1 className="font-display text-3xl font-black text-cocoa">
          Welcome back
        </h1>
        <p className="mt-1 text-cocoa-soft">
          Log in to keep running your polls.
        </p>

        <div className="mt-6">
          <LoginForm />
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