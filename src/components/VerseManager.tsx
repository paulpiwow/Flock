"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Search, Trash2 } from "lucide-react";
import {
  deleteVerseAction,
  lookupVerse,
  type VerseState,
} from "@/lib/actions/verses";
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
  const [reference, setReference] = useState("");
  const [preview, setPreview] = useState<{ reference: string; text: string } | null>(
    null,
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looking, startLookup] = useTransition();

  const [state, formAction, pending] = useActionState(addAction, initial);
  const ref = useRef<HTMLFormElement>(null);

  function reset() {
    setOpen(false);
    setReference("");
    setPreview(null);
    setLookupError(null);
  }

  // Close + clear once a verse is saved.
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      reset();
    }
  }, [state.ok]);

  function doLookup() {
    const q = reference.trim();
    if (!q) {
      setLookupError("Enter a reference first.");
      return;
    }
    setLookupError(null);
    startLookup(async () => {
      const res = await lookupVerse(q);
      if (res.error) {
        setPreview(null);
        setLookupError(res.error);
      } else {
        setPreview({ reference: res.reference, text: res.text });
      }
    });
  }

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

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-dashed border-flock-300 bg-flock-50 px-4 py-2.5 text-sm font-medium text-flock-700 hover:bg-flock-100"
        >
          + Add a verse
        </button>
      ) : !preview ? (
        // Step 1 — look up a reference (WEB translation, fetched for you).
        <div className="space-y-2 rounded-card border border-border bg-surface p-4 shadow-sm">
          <label className="block text-xs font-medium text-muted">
            Find a verse
          </label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  doLookup();
                }
              }}
              placeholder="Reference, e.g. John 15:5"
              className={inputCls}
            />
            <button
              type="button"
              onClick={doLookup}
              disabled={looking}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg bg-flock-700 px-3 py-2 text-xs font-semibold text-white hover:bg-flock-800",
                looking && "opacity-70",
              )}
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              {looking ? "Looking…" : "Look up"}
            </button>
          </div>
          {lookupError && (
            <p className="text-xs font-medium text-absent">{lookupError}</p>
          )}
          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        // Step 2 — confirm the fetched verse (text is editable if they want).
        <form
          ref={ref}
          action={formAction}
          className="space-y-2 rounded-card border border-border bg-surface p-4 shadow-sm"
        >
          {groupId && <input type="hidden" name="groupId" value={groupId} />}
          <input type="hidden" name="reference" value={preview.reference} />
          <p className="text-sm font-semibold text-flock-700">
            {preview.reference}{" "}
            <span className="font-normal text-muted">· WEB</span>
          </p>
          <textarea
            name="text"
            rows={4}
            defaultValue={preview.text}
            required
            className={cn(inputCls, "resize-y leading-relaxed")}
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
              onClick={() => {
                setPreview(null);
                setLookupError(null);
              }}
              className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
            >
              Search again
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
