import { Sparkles } from "lucide-react";

type Verse = {
  id: string;
  reference: string;
  text: string;
  author?: { username: string } | null;
};

export function VerseList({
  verses,
  emptyText,
}: {
  verses: Verse[];
  emptyText: string;
}) {
  if (verses.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {verses.map((v) => (
        <li
          key={v.id}
          className="rounded-card border border-border bg-surface p-5 text-center shadow-sm"
        >
          <Sparkles className="mx-auto h-5 w-5 text-flock-600" aria-hidden />
          <p className="mt-2 text-base leading-relaxed text-foreground">
            &ldquo;{v.text}&rdquo;
          </p>
          <p className="mt-2 text-sm font-semibold text-flock-700">
            {v.reference}
          </p>
        </li>
      ))}
    </ul>
  );
}
