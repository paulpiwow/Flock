"use client";

import { useActionState, useState } from "react";
import { setPassageAction, newWeekAction, type SaveState } from "@/lib/actions/notes";
import { cn } from "@/lib/cn";

const initial: SaveState = {};

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

/** RS controls under the passage: edit this week, or start a new week. */
export function RsPassageForm({
  weekId,
  passageRef,
  enduringUrl,
}: {
  weekId: string;
  passageRef: string;
  enduringUrl: string;
}) {
  const [mode, setMode] = useState<null | "edit" | "new">(null);
  const [editState, editAction, editPending] = useActionState(
    setPassageAction,
    initial,
  );
  const [newState, newAction, newPending] = useActionState(
    newWeekAction,
    initial,
  );

  if (mode === null) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setMode("edit")}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-flock-700 hover:bg-flock-50"
        >
          Edit passage
        </button>
        <button
          onClick={() => setMode("new")}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-flock-700 hover:bg-flock-50"
        >
          Start new week
        </button>
      </div>
    );
  }

  const isEdit = mode === "edit";
  const state = isEdit ? editState : newState;
  const pending = isEdit ? editPending : newPending;

  return (
    <form
      action={isEdit ? editAction : newAction}
      className="space-y-2 rounded-card border border-border bg-flock-50 p-3"
    >
      {isEdit && <input type="hidden" name="weekId" value={weekId} />}
      <p className="text-xs font-semibold text-flock-800">
        {isEdit ? "Edit this week" : "Start a new week"}
      </p>
      <input
        name="passageRef"
        defaultValue={isEdit ? passageRef : ""}
        placeholder="Passage, e.g. John 15:1-11"
        required
        className={inputCls}
      />
      <input
        name="enduringUrl"
        type="url"
        defaultValue={isEdit ? enduringUrl : ""}
        placeholder="Enduring Word URL (optional)"
        className={inputCls}
      />
      {state.error && (
        <p className="text-xs font-medium text-absent">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-xs font-medium text-flock-700">Saved ✓</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "rounded-lg bg-flock-700 px-4 py-2 text-xs font-semibold text-white hover:bg-flock-800",
            pending && "opacity-70",
          )}
        >
          {pending ? "Saving…" : isEdit ? "Save passage" : "Create week"}
        </button>
        <button
          type="button"
          onClick={() => setMode(null)}
          className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
