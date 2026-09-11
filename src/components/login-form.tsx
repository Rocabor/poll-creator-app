"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: undefined };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-2 space-y-4" noValidate>
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
          className="mt-1 w-full rounded-lg border-2 border-cocoa bg-card px-3 py-2.5 focus:border-teal"
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
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border-2 border-cocoa bg-card px-3 py-2.5 focus:border-teal"
        />
      </div>

      {state?.error && (
        <p
          id="login-error"
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
        {pending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-cocoa-soft">
        New here?{" "}
        <Link href="/auth/signup" className="font-bold text-teal underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </form>
  );
}