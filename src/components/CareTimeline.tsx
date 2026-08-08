type Note = {
  id: string;
  body: string;
  createdAt: Date;
  author: { username: string } | null;
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
        No notes yet.
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
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
        </li>
      ))}
    </ul>
  );
}
