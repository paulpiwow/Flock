"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCareNoteAction, type CareNoteState } from "@/lib/actions/care";
import { cn } from "@/lib/cn";

const initial: CareNoteState = {};

// Prompts the CGL to cover all six areas so summaries stay specific.
const PLACEHOLDER = `Worship — Church / Campcom engagement
Scripture — Quiet time habits
Prayer — Personal prayer habit
Community — CG attendance, hall relationships
Service — CSER
Other — Anything else`;

export function CareNoteForm({ studentId }: { studentId: string }) {
  const [state, formAction, pending] = useActionState(
    addCareNoteAction,
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
      <input type="hidden" name="studentId" value={studentId} />

      <label htmlFor="body" className="mb-1 block text-xs font-medium text-muted">
        New note
      </label>
      <textarea
        id="body"
        name="body"
        rows={8}
        required
        placeholder={PLACEHOLDER}
        className="w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
      />

      {state.error && (
        <p role="alert" className="mt-2 text-xs font-medium text-absent">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="mt-2 text-xs font-medium text-flock-700">
          Saved ✓ — your RS has been notified.
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
        {pending ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
