"use client";

import { useActionState } from "react";
import { confirmName, type NameState } from "@/lib/actions/profile";
import { cn } from "@/lib/cn";

const initialState: NameState = {};

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

/**
 * Blocking one-time modal: asks for first + last name. No close button and no
 * backdrop dismiss — the layout renders it until the user saves, so the rest
 * of the app is unusable until they answer.
 */
export function NameGate() {
  const [state, formAction, pending] = useActionState(confirmName, initialState);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-gate-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-flock-900/60 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-xl">
        <h2
          id="name-gate-title"
          className="text-lg font-bold text-flock-800"
        >
          Enter your first and last name
        </h2>

        <form action={formAction} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1 block text-xs font-medium text-muted"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              autoCapitalize="words"
              required
              maxLength={40}
              autoFocus
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              autoCapitalize="words"
              required
              maxLength={40}
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
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
