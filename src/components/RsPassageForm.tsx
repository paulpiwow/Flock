"use client";

import { useActionState, useState } from "react";
import { setPassageAction, type SaveState } from "@/lib/actions/notes";
import { cn } from "@/lib/cn";

const initial: SaveState = {};

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

/**
 * RS control: set this week's passage. Weeks themselves are created
 * automatically each week (Wednesday-anchored) — the RS just fills in the
 * passage, so there's no way to create duplicate weeks.
 */
export function RsPassageForm({
  weekId,
  passageRef,
  enduringUrl,
}: {
  weekId: string;
  passageRef: string;
  enduringUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(setPassageAction, initial);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-flock-700 hover:bg-flock-50"
      >
        Edit passage
      </button>
    );
  }

  return (
    <form
      action={action}
      className="space-y-2 rounded-card border border-border bg-flock-50 p-3"
    >
      <input type="hidden" name="weekId" value={weekId} />
      <p className="text-xs font-semibold text-flock-800">Edit this week</p>
      <input
        name="passageRef"
        defaultValue={passageRef}
        placeholder="Passage, e.g. John 15:1-11"
        required
        className={inputCls}
      />
      <input
        name="enduringUrl"
        type="url"
        defaultValue={enduringUrl}
        placeholder="Enduring Word URL (optional)"
        className={inputCls}
      />
      {state.error && (
        <p className="text-xs font-medium text-absent">{state.error}</p>
      )}
      {state.ok && <p className="text-xs font-medium text-flock-700">Saved ✓</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "rounded-lg bg-flock-700 px-4 py-2 text-xs font-semibold text-white hover:bg-flock-800",
            pending && "opacity-70",
          )}
        >
          {pending ? "Saving…" : "Save passage"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
