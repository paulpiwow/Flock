"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import {
  confirmAttendanceAction,
  type ConfirmState,
} from "@/lib/actions/attendance";
import { cn } from "@/lib/cn";

export type RosterItem = {
  id: string;
  username: string;
  selfReported: boolean;
  present: boolean; // pre-fill: confirmed-present or self-reported
};

const initial: ConfirmState = {};

export function RosterConfirm({
  groupId,
  weekLabel,
  roster,
  alreadyConfirmed,
}: {
  groupId: string;
  weekLabel: string;
  roster: RosterItem[];
  alreadyConfirmed: boolean;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(roster.map((r) => [r.id, r.present])),
  );
  const [state, formAction, pending] = useActionState(
    confirmAttendanceAction,
    initial,
  );

  const presentCount = Object.values(checked).filter(Boolean).length;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="groupId" value={groupId} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{weekLabel}</p>
        <p className="text-sm font-semibold text-flock-700">
          {presentCount}/{roster.length} here
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
        {roster.map((r) => {
          const on = checked[r.id];
          return (
            <li key={r.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3 active:bg-flock-50">
                {/* hidden checkbox drives the form value */}
                <input
                  type="checkbox"
                  name="present"
                  value={r.id}
                  checked={on}
                  onChange={(e) =>
                    setChecked((c) => ({ ...c, [r.id]: e.target.checked }))
                  }
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                    on
                      ? "border-flock-700 bg-flock-700 text-white"
                      : "border-border bg-white",
                  )}
                >
                  {on && <Check className="h-4 w-4" aria-hidden />}
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {r.username}
                </span>
                {r.selfReported && (
                  <span className="rounded-full bg-flock-100 px-2 py-0.5 text-[10px] font-medium text-flock-700">
                    self-checked in
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>

      {state.error && (
        <p role="alert" className="text-xs font-medium text-absent">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-xs font-medium text-flock-700">
          Saved ✓ — sent to your RS.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-flock-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-flock-800 disabled:opacity-70"
      >
        {pending
          ? "Saving…"
          : alreadyConfirmed
            ? "Update attendance"
            : "Confirm attendance"}
      </button>
    </form>
  );
}
