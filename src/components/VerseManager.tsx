"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteVerseAction, type VerseState } from "@/lib/actions/verses";
import { cn } from "@/lib/cn";

type Verse = {
  id: string;
  reference: string;
  text: string;
  author?: { username: string } | null;
};

type AddAction = (prev: VerseState, formData: FormData) => Promise<VerseState>;

const initial: VerseState = {};
const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

/** Editable verse list (RS for leaders, CGL for their group). */
export function VerseManager({
  verses,
  addAction,
  groupId,
  emptyText,
}: {
  verses: Verse[];
  addAction: AddAction;
  groupId?: string;
  emptyText: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addAction, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <div className="space-y-3">
      {verses.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2">
          {verses.map((v) => (
            <li
              key={v.id}
              className="flex items-start gap-2 rounded-card border border-border bg-surface p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{v.text}&rdquo;
                </p>
                <p className="mt-1 text-xs font-semibold text-flock-700">
                  {v.reference}
                </p>
              </div>
              <form action={deleteVerseAction}>
                <input type="hidden" name="id" value={v.id} />
                <button
                  type="submit"
                  aria-label="Delete verse"
                  className="rounded-lg p-1.5 text-muted hover:bg-absent/10 hover:text-absent"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form
          ref={ref}
          action={formAction}
          className="space-y-2 rounded-card border border-border bg-surface p-4 shadow-sm"
        >
          {groupId && <input type="hidden" name="groupId" value={groupId} />}
          <input
            name="reference"
            placeholder="Reference, e.g. John 15:5"
            required
            className={inputCls}
          />
          <textarea
            name="text"
            rows={3}
            placeholder="Verse text — use a public-domain translation (WEB or KJV)."
            required
            className={cn(inputCls, "resize-y")}
          />
          {state.error && (
            <p className="text-xs font-medium text-absent">{state.error}</p>
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
              {pending ? "Adding…" : "Add verse"}
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
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-dashed border-flock-300 bg-flock-50 px-4 py-2.5 text-sm font-medium text-flock-700 hover:bg-flock-100"
        >
          + Add a verse
        </button>
      )}
    </div>
  );
}
