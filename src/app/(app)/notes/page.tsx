import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getWeekContext, getArchiveWeeks } from "@/lib/notes";
import { WeeklyNoteEditor } from "@/components/WeeklyNoteEditor";
import { RsPassageForm } from "@/components/RsPassageForm";
import { cn } from "@/lib/cn";

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireActiveUser();
  const { week: weekParam } = await searchParams;

  const [ctx, weeks] = await Promise.all([
    getWeekContext(user, weekParam),
    getArchiveWeeks(user),
  ]);

  if (!ctx) {
    return (
      <section className="space-y-2">
        <h1 className="text-xl font-bold text-flock-800">Weekly Notes</h1>
        <p className="text-sm text-muted">
          No week is set up yet.
          {user.role === "ADMIN" ? " Start one below." : " Check back soon."}
        </p>
      </section>
    );
  }

  const { week, note } = ctx;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-flock-600">
          Week {week.index} · {week.semester}
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-flock-800">
          <BookOpen className="h-5 w-5" aria-hidden /> {week.passageRef}
        </h1>
      </div>

      {week.enduringUrl && (
        <a
          href={week.enduringUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-sm active:bg-flock-50"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              Enduring Word
            </p>
            <p className="text-xs text-muted">
              David Guzik&apos;s commentary — dig deeper.
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-flock-700" aria-hidden />
        </a>
      )}

      {user.role === "ADMIN" && (
        <RsPassageForm
          weekId={week.id}
          passageRef={week.passageRef}
          enduringUrl={week.enduringUrl ?? ""}
        />
      )}

      <WeeklyNoteEditor weekId={week.id} initialBody={note?.body ?? ""} />

      {/* Archive */}
      {weeks.length > 1 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Archive</h2>
          <ul className="flex flex-wrap gap-2">
            {weeks.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/notes?week=${w.id}`}
                  className={cn(
                    "block rounded-lg border px-3 py-1.5 text-xs transition-colors",
                    w.id === week.id
                      ? "border-flock-600 bg-flock-100 text-flock-800"
                      : "border-border bg-surface text-muted hover:bg-flock-50",
                  )}
                >
                  <span className="font-medium">W{w.index}</span> · {w.passageRef}
                  <span className="ml-1 text-muted/70">{fmt(w.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
