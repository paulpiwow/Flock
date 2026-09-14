"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";
import { renameUserAction, type RenameState } from "@/lib/actions/people";
import { cn } from "@/lib/cn";

const initialState: RenameState = {};

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

/**
 * RS-side "Edit name": small pencil button that opens a sheet with first +
 * last name prefilled from the real-name columns (blank if they haven't
 * answered yet — a username like "bean" is never suggested). Saving rewrites
 * the name everywhere in the app.
 */
export function EditNameButton({
  id,
  name,
  firstName,
  lastName,
}: {
  id: string;
  /** Current display name (real name, or the username fallback). */
  name: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    renameUserAction,
    initialState,
  );
  const [open, setOpen] = useState(false);
  // Close automatically after a successful save; a new `saved` stamp means a
  // fresh result we haven't reacted to yet.
  const [seenSave, setSeenSave] = useState<number | undefined>(undefined);
  if (state.saved && state.saved !== seenSave) {
    setSeenSave(state.saved);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit name for ${name}`}
        title="Edit name"
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-flock-100 hover:text-flock-800"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Name
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-name-title-${id}`}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-card border border-border bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                id={`edit-name-title-${id}`}
                className="text-base font-semibold text-foreground"
              >
                Edit name
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-muted hover:bg-flock-100 hover:text-flock-800"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Currently shown as <span className="font-medium">{name}</span>.
            </p>

            <form action={formAction} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={id} />
              <div>
                <label
                  htmlFor={`firstName-${id}`}
                  className="mb-1 block text-xs font-medium text-muted"
                >
                  First name
                </label>
                <input
                  id={`firstName-${id}`}
                  name="firstName"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="words"
                  required
                  maxLength={40}
                  defaultValue={firstName ?? ""}
                  autoFocus
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor={`lastName-${id}`}
                  className="mb-1 block text-xs font-medium text-muted"
                >
                  Last name
                </label>
                <input
                  id={`lastName-${id}`}
                  name="lastName"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="words"
                  required
                  maxLength={40}
                  defaultValue={lastName ?? ""}
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
                {pending ? "Saving…" : "Save name"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
