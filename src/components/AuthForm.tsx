"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";

const initialState: AuthState = {};

type Mode = "login" | "signup" | "forgot";

export function AuthForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<Mode>("login");
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialError ? { error: initialError } : initialState,
  );

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <input type="hidden" name="mode" value={mode} />

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-xs font-medium text-muted"
        >
          Liberty email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="name@liberty.edu"
          pattern=".*@liberty\.edu$"
          className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
        />
        <p className="mt-1 text-[11px] text-muted">
          Must end in <span className="font-medium">@liberty.edu</span>
        </p>
      </div>

      {isSignup && (
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-xs font-medium text-muted"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="e.g. will"
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
          />
        </div>
      )}

      {isSignup && (
        <div>
          <label
            htmlFor="hallCode"
            className="mb-1 block text-xs font-medium text-muted"
          >
            Hall code{" "}
            <span className="font-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="hallCode"
            name="hallCode"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="e.g. HALL3-F26"
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm uppercase tracking-wide text-foreground outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
          />
          <p className="mt-1 text-[11px] text-muted">
            From your RS. No code yet? You can add it right after.
          </p>
        </div>
      )}

      {!isForgot && (
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-xs font-medium text-muted"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 8 : undefined}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
          />
          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="mt-1.5 text-[11px] font-medium text-flock-600 underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
      )}

      {isForgot && (
        <p className="text-xs text-muted">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-absent/10 px-3 py-2 text-xs font-medium text-absent"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="rounded-lg bg-flock-100 px-3 py-2 text-xs font-medium text-flock-800"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors",
          "bg-flock-700 hover:bg-flock-800 active:bg-flock-800",
          pending && "cursor-not-allowed opacity-70",
        )}
      >
        {pending
          ? isForgot
            ? "Sending…"
            : isSignup
              ? "Creating account…"
              : "Logging in…"
          : isForgot
            ? "Send reset link"
            : isSignup
              ? "Sign Up"
              : "Log In"}
      </button>

      {isForgot ? (
        <p className="text-center text-xs text-muted">
          Remembered it?{" "}
          <button
            type="button"
            onClick={() => setMode("login")}
            className="font-semibold text-flock-600 underline-offset-4 hover:underline"
          >
            Back to log in
          </button>
        </p>
      ) : (
        <p className="text-center text-xs text-muted">
          {isSignup ? "Already have an account?" : "New to Flock?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isSignup ? "login" : "signup")}
            className="font-semibold text-flock-600 underline-offset-4 hover:underline"
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      )}
    </form>
  );
}
