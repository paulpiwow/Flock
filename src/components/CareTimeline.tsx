type Note = {
  id: string;
  body: string;
  tag: "PRAYER" | "FOLLOW_UP" | "POSSIBLE_IR" | null;
  createdAt: Date;
  author: { username: string } | null;
};

const TAG_LABEL: Record<string, string> = {
  PRAYER: "Prayer",
  FOLLOW_UP: "Follow-up",
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
          className="rounded-card border border-border bg-surface p-4 shadow-sm"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {fmtDate(n.createdAt)}
              {n.author ? ` · ${n.author.username}` : ""}
            </span>
            {n.tag && TAG_LABEL[n.tag] && (
              <span className="rounded-full bg-flock-100 px-2 py-0.5 text-[10px] font-medium text-flock-700">
                {TAG_LABEL[n.tag]}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
        </li>
      ))}
    </ul>
  );
}
