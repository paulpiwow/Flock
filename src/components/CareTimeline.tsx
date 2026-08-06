import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

type Note = {
  id: string;
  body: string;
  tag: "PRAYER" | "FOLLOW_UP" | "POSSIBLE_IR" | null;
  possibleIR: boolean;
  createdAt: Date;
  author: { username: string } | null;
};

const TAG_LABEL: Record<string, string> = {
  PRAYER: "Prayer",
  FOLLOW_UP: "Follow-up",
  POSSIBLE_IR: "Possible IR",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CareTimeline({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
        No care notes yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((n) => (
        <li
          key={n.id}
          className={cn(
            "rounded-card border bg-surface p-4 shadow-sm",
            n.possibleIR ? "border-absent/40" : "border-border",
          )}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {fmtDate(n.createdAt)}
              {n.author ? ` · ${n.author.username}` : ""}
            </span>
            <div className="flex items-center gap-1.5">
              {n.possibleIR && (
                <span className="flex items-center gap-1 rounded-full bg-absent/10 px-2 py-0.5 text-[10px] font-semibold text-absent">
                  <AlertTriangle className="h-3 w-3" aria-hidden /> Possible IR
                </span>
              )}
              {n.tag && n.tag !== "POSSIBLE_IR" && (
                <span className="rounded-full bg-flock-100 px-2 py-0.5 text-[10px] font-medium text-flock-700">
                  {TAG_LABEL[n.tag]}
                </span>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
        </li>
      ))}
    </ul>
  );
}
