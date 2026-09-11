"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createGuestSession,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export type AuthState = { error?: string } | null;

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Your name needs at least 2 characters")
    .max(40, "Keep it under 40 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

function errorState(error: unknown): AuthState {
  if (error instanceof z.ZodError) return { error: error.issues[0].message };
  return { error: "Something went wrong. Try again." };
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return errorState(parsed.error);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Wrong email or password." };
  }

  await createSession(user.id, false);
  redirect("/dashboard");
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return errorState(parsed.error);

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return { error: "That email already has an account." };

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: await hashPassword(password),
      avatarSeed: name.trim(),
    },
  });

  await createSession(user.id, false);
  redirect("/dashboard");
}

export async function guestAction(): Promise<void> {
  const ok = await createGuestSession();
  redirect(ok ? "/dashboard" : "/landing?guest=unavailable");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}