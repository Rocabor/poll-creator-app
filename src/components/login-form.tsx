"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: undefined };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.error) emailRef.current?.focus();
  }, [state]);

  const invalid = state?.error ? true : undefined;
  const describedBy = state?.error ? "login-error" : undefined;

  return (
    <form action={formAction} className="mt-2 space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-cocoa">
          Email
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={invalid}
          aria-describedby={describedBy}
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
          autoComplete="current-password"
          required
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="mt-1 w-full rounded-lg border-cocoa-sm bg-card px-3 py-2.5 focus:border-teal"
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
        className="btn-game-piece w-full rounded-xl border-cocoa-sm bg-tangerine-deep px-6 py-3 font-display text-lg font-bold text-cream transition-all hover:-translate-y-px hover:shadow-press-tangerine disabled:opacity-60 sm:rounded-full"
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