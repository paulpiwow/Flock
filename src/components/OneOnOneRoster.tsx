"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarCheck, ChevronRight } from "lucide-react";
import {
  logOneOnOneAction,
  type OneOnOneState,
} from "@/lib/actions/oneonone";
import { cn } from "@/lib/cn";

export type Guy = {
  id: string;
  username: string;
  lastMetLabel: string;
  needsNudge: boolean;
};

const initial: OneOnOneState = {};

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function OneOnOneRoster({ guys }: { guys: Guy[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    logOneOnOneAction,
    initial,
  );

  useEffect(() => {
    if (state.ok) setOpenId(null);
  }, [state.ok]);

  return (
    <ul className="space-y-2">
      {guys.map((g) => {
        const open = openId === g.id;
        return (
          <li
            key={g.id}
            className={cn(
              "rounded-card border bg-surface shadow-sm",
              g.needsNudge ? "border-warn/40" : "border-border",
            )}
          >
            <button
              onClick={() => setOpenId(open ? null : g.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-flock-50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {g.username}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    g.needsNudge ? "text-warn" : "text-muted",
                  )}
                >
                  {g.lastMetLabel}
                </p>
              </div>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted transition-transform",
                  open && "rotate-90",
                )}
                aria-hidden
              />
            </button>

            {open && (
              <form
                action={formAction}
                className="space-y-2 border-t border-border px-4 py-3"
              >
                <input type="hidden" name="studentId" value={g.id} />
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted">
                    Met on
                  </label>
                  <input
                    type="date"
                    name="metAt"
                    defaultValue={todayISO()}
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground outline-none focus:border-flock-600"
                  />
                </div>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Optional note (saved as a care note)"
                  className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
                />
                {state.error && (
                  <p className="text-xs font-medium text-absent">
                    {state.error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg bg-flock-700 px-4 py-2 text-xs font-semibold text-white hover:bg-flock-800",
                    pending && "opacity-70",
                  )}
                >
                  <CalendarCheck className="h-4 w-4" aria-hidden />
                  {pending ? "Saving…" : "Log 1-on-1"}
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
