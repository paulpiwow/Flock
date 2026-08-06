"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import {
  assignStudentAction,
  unassignStudentAction,
} from "@/lib/actions/groups";
import { cn } from "@/lib/cn";

type Student = { id: string; username: string };
type Group = {
  id: string;
  name: string;
  leaderName: string | null;
  members: Student[];
};

export function DraftBoard({
  groups,
  pool,
}: {
  groups: Group[];
  pool: Student[];
}) {
  const [activeId, setActiveId] = useState(groups[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const activeGroup = groups.find((g) => g.id === activeId) ?? groups[0];

  const assign = (studentId: string) => {
    if (!activeGroup) return;
    startTransition(() => assignStudentAction(studentId, activeGroup.id));
  };
  const unassign = (studentId: string) => {
    startTransition(() => unassignStudentAction(studentId));
  };

  return (
    <div className={cn("space-y-5", pending && "opacity-70")}>
      {/* Which CGL is picking */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Drafting into
        </p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveId(g.id)}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-left transition-colors",
                g.id === activeGroup?.id
                  ? "border-flock-600 bg-flock-100"
                  : "border-border bg-surface hover:bg-flock-50",
              )}
            >
              <span className="block text-sm font-semibold text-foreground">
                {g.name}
              </span>
              <span className="block text-[11px] text-muted">
                {g.leaderName ?? "No CGL"} · {g.members.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Unassigned pool — tap to draft into the active group */}
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">
          Unassigned ({pool.length})
        </p>
        {pool.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
            Everyone&apos;s in a group. 🎉
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pool.map((s) => (
              <button
                key={s.id}
                onClick={() => assign(s.id)}
                disabled={pending || !activeGroup}
                className="flex items-center gap-1 rounded-full border border-flock-300 bg-flock-50 px-3 py-1.5 text-sm text-flock-800 transition-colors hover:bg-flock-100 disabled:opacity-50"
                title={`Add to ${activeGroup?.name ?? ""}`}
              >
                {s.username}
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Every group's roster */}
      <div className="space-y-3">
        {groups.map((g) => (
          <div
            key={g.id}
            className={cn(
              "rounded-card border bg-surface p-4 shadow-sm",
              g.id === activeGroup?.id ? "border-flock-300" : "border-border",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{g.name}</p>
                <p className="text-[11px] text-muted">
                  {g.leaderName ?? "No CGL"}
                </p>
              </div>
              <span className="rounded-full bg-flock-100 px-2 py-0.5 text-xs font-bold text-flock-700">
                {g.members.length}
              </span>
            </div>
            {g.members.length === 0 ? (
              <p className="text-xs text-muted">No one yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {g.members.map((m) => (
                  <li key={m.id}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-flock-50 py-1 pl-2.5 pr-1 text-xs text-foreground">
                      {m.username}
                      <button
                        onClick={() => unassign(m.id)}
                        disabled={pending}
                        aria-label={`Remove ${m.username}`}
                        className="rounded-full p-0.5 text-muted hover:bg-absent/10 hover:text-absent"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
