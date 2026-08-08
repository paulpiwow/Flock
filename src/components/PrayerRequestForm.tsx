"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  submitPrayerRequestAction,
  type PrayerState,
} from "@/lib/actions/prayer";
import { cn } from "@/lib/cn";

const initial: PrayerState = {};

export function PrayerRequestForm({ sendTo }: { sendTo: string }) {
  const [state, formAction, pending] = useActionState(
    submitPrayerRequestAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-card border border-border bg-surface p-4 shadow-sm"
    >
      <label htmlFor="body" className="mb-1 block text-xs font-medium text-muted">
        New prayer request
      </label>
      <textarea
        id="body"
        name="body"
        rows={3}
        required
        placeholder="What can we be praying for?"
        className="w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
      />

      {state.error && (
        <p role="alert" className="mt-2 text-xs font-medium text-absent">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="mt-2 text-xs font-medium text-flock-700">
          Sent ✓ — {sendTo} will see it.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mt-3 w-full rounded-xl bg-flock-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-flock-800",
          pending && "opacity-70",
        )}
      >
        {pending ? "Sending…" : `Send to ${sendTo}`}
      </button>
    </form>
  );
}
