"use client";

import { useActionState } from "react";
import { saveWeeklyNoteAction, type SaveState } from "@/lib/actions/notes";
import { cn } from "@/lib/cn";

const initial: SaveState = {};

export function WeeklyNoteEditor({
  weekId,
  initialBody,
}: {
  weekId: string;
  initialBody: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveWeeklyNoteAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="weekId" value={weekId} />
      <label htmlFor="body" className="block text-xs font-medium text-muted">
        Your private notes
      </label>
      <textarea
        id="body"
        name="body"
        rows={10}
        defaultValue={initialBody}
        placeholder="A blank page for your own study. Only you can see this."
        className="w-full resize-y rounded-card border border-border bg-surface px-3 py-3 text-sm leading-relaxed text-foreground shadow-sm outline-none placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">
          {state.ok ? "Saved ✓" : "Private to you"}
        </span>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "rounded-xl bg-flock-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-flock-800",
            pending && "opacity-70",
          )}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-xs font-medium text-absent">
          {state.error}
        </p>
      )}
    </form>
  );
}
