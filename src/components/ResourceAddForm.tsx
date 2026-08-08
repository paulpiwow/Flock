"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addResourceAction, type ResourceState } from "@/lib/actions/resources";
import { cn } from "@/lib/cn";

const initial: ResourceState = {};
const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300";

export function ResourceAddForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addResourceAction,
    initial,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-flock-300 bg-flock-50 px-4 py-2.5 text-sm font-medium text-flock-700 hover:bg-flock-100"
      >
        + Add a resource
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="space-y-2 rounded-card border border-border bg-surface p-4 shadow-sm"
    >
      <input name="label" placeholder="Label, e.g. Late-night sign-out" required className={inputCls} />
      <input name="url" type="url" placeholder="https://…" required className={inputCls} />
      {state.error && <p className="text-xs font-medium text-absent">{state.error}</p>}
      {state.ok && <p className="text-xs font-medium text-flock-700">Added ✓</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "rounded-lg bg-flock-700 px-4 py-2 text-xs font-semibold text-white hover:bg-flock-800",
            pending && "opacity-70",
          )}
        >
          {pending ? "Adding…" : "Add"}
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
