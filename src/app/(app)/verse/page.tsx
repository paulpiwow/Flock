import { Sparkles } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getWeekContext } from "@/lib/notes";
import { RsVerseForm } from "@/components/RsVerseForm";

export default async function VersePage() {
  const user = await requireActiveUser();
  const ctx = await getWeekContext(user);
  const verse = ctx?.verse ?? null;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Memory Verse</h1>
        {ctx && (
          <p className="text-sm text-muted">
            Week {ctx.week.index} · {ctx.week.semester}
          </p>
        )}
      </div>

      {verse ? (
        <div className="rounded-card border border-border bg-surface p-6 text-center shadow-sm">
          <Sparkles className="mx-auto h-6 w-6 text-flock-600" aria-hidden />
          <p className="mt-3 text-base leading-relaxed text-foreground">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="mt-3 text-sm font-semibold text-flock-700">
            {verse.reference}
          </p>
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
          No memory verse set for this week yet.
        </p>
      )}

      {user.role === "ADMIN" && ctx && (
        <RsVerseForm
          weekId={ctx.week.id}
          reference={verse?.reference ?? ""}
          text={verse?.text ?? ""}
        />
      )}
    </section>
  );
}
