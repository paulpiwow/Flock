"use client";

import { useActionState, useState } from "react";
import { setVerseAction, type SaveState } from "@/lib/actions/notes";
import { cn } from "@/lib/cn";

const initial: SaveState = {};

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

export function RsVerseForm({
  weekId,
  reference,
  text,
}: {
  weekId: string;
  reference: string;
  text: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(setVerseAction, initial);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-flock-700 hover:bg-flock-50"
      >
        {reference ? "Edit memory verse" : "Set memory verse"}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-card border border-border bg-flock-50 p-3"
    >
      <input type="hidden" name="weekId" value={weekId} />
      <p className="text-xs font-semibold text-flock-800">Memory verse</p>
      <input
        name="reference"
        defaultValue={reference}
        placeholder="Reference, e.g. John 15:5"
        required
        className={inputCls}
      />
      <textarea
        name="text"
        defaultValue={text}
        rows={3}
        placeholder="Verse text — use a public-domain translation (WEB or KJV)."
        required
        className={cn(inputCls, "resize-y")}
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
          {pending ? "Saving…" : "Save verse"}
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
