"use client";

import { useActionState } from "react";
import { joinHall, type JoinState } from "@/lib/actions/hall";
import { cn } from "@/lib/cn";

const initialState: JoinState = {};

export function JoinForm() {
  const [state, formAction, pending] = useActionState(joinHall, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="hallCode"
          className="mb-1 block text-xs font-medium text-muted"
        >
          Hall code
        </label>
        <input
          id="hallCode"
          name="hallCode"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          required
          placeholder="e.g. HALL3-F26"
          className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm uppercase tracking-wide text-foreground outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
        />
        <p className="mt-1 text-[11px] text-muted">
          Your RS shares this with your hall.
        </p>
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
        {pending ? "Joining…" : "Join hall"}
      </button>
    </form>
  );
}
