"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { normalizeCode } from "@/lib/codes";
import { siteOrigin } from "@/lib/site";

export type AuthState = { error?: string; message?: string };

const libertyEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email.")
  .refine((e) => e.endsWith("@liberty.edu"), {
    message: "Must be a @liberty.edu email.",
  });

const signInSchema = z.object({
  email: libertyEmail,
  password: z.string().min(1, "Enter your password."),
});

const signUpSchema = z
  .object({
    email: libertyEmail,
    username: z
      .string()
      .trim()
      .min(2, "Username must be at least 2 characters.")
      .max(30, "Username is too long."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string(),
    // Optional at signup: with a valid code you bind to that hall immediately;
    // without one you land pending and enter a code on /join.
    hallCode: z.string().trim().toUpperCase().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/home");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const codeInput = normalizeCode(formData.get("hallCode"));
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    hallCode: codeInput || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password, username, hallCode } = parsed.data;

  // If a code was entered, verify it up front so typos fail clearly. The code
  // itself is the credential that binds a hall (resolved again on first login).
  if (hallCode) {
    const hall = await prisma.hall.findUnique({
      where: { joinCode: hallCode },
    });
    if (!hall) {
      return { error: "That hall code isn't right — check with your RS." };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, hallCode: hallCode ?? null } },
  });
  if (error) return { error: error.message };

  // If "Confirm email" is off, a session is issued immediately -> go to app.
  if (data.session) redirect("/home");

  // Otherwise Supabase sent a confirmation email.
  return {
    message: "Check your Liberty email to confirm your account, then log in.",
  };
}

/** Single entry point for the auth form; branches on the hidden `mode` field. */
export async function authenticate(
  prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  switch (formData.get("mode")) {
    case "signup":
      return signUp(prev, formData);
    case "forgot":
      return requestPasswordReset(prev, formData);
    default:
      return signIn(prev, formData);
  }
}

const forgotSchema = z.object({ email: libertyEmail });

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

/**
 * "Forgot password" — email a reset link. The link lands on /auth/confirm,
 * which verifies the token and forwards to /reset-password. Always responds
 * with the same message so it can't be used to probe which emails exist.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password` },
  );
  // Rate-limit errors are worth surfacing; anything else stays generic.
  if (error && error.status === 429) {
    return { error: "Too many requests — wait a minute and try again." };
  }

  return {
    message:
      "If that email has an account, a reset link is on its way. Check your Liberty inbox (and spam).",
  };
}

/** Set a new password for the signed-in user (reached via the reset link). */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    // Session from the reset link has expired (or was never established).
    if (error.status === 401 || /session/i.test(error.message)) {
      return {
        error:
          "That reset link has expired. Go back to the login page and request a new one.",
      };
    }
    return { error: error.message };
  }

  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
