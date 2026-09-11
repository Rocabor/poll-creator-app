"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: undefined };

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="mt-2 space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-cocoa">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="mt-1 w-full rounded-lg border-cocoa-sm bg-card px-3 py-2.5 focus:border-teal"
        />
        <p className="mt-1 text-xs text-cocoa-soft">
          Shown as the creator of your polls.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-cocoa">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border-cocoa-sm bg-card px-3 py-2.5 focus:border-teal"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-cocoa">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border-cocoa-sm bg-card px-3 py-2.5 focus:border-teal"
        />
        <p className="mt-1 text-xs text-cocoa-soft">At least 8 characters.</p>
      </div>

      {state?.error && (
        <p
          id="signup-error"
          role="alert"
          className="rounded-lg bg-tangerine/10 px-3 py-2 text-sm font-bold text-tangerine-deep"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-game-piece w-full rounded-full bg-tangerine-deep px-6 py-3 font-display text-lg font-bold text-cream disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create my account"}
      </button>

      <p className="text-center text-sm text-cocoa-soft">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-bold text-teal underline underline-offset-2">
          Log in
        </Link>
      </p>
    </form>
  );
}