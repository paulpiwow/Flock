"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";

const initialState: AuthState = {};

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-medium text-muted"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className={inputClass}
        />
        <p className="mt-1 text-[11px] text-muted">At least 8 characters.</p>
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="mb-1 block text-xs font-medium text-muted"
        >
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-absent/10 px-3 py-2 text-xs font-medium text-absent"
        >
          {state.error}
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
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
