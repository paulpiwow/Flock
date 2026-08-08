import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import {
  getMyGuysWithNotes,
  getRecentCareNotes,
  getHallStudentsWithNotes,
} from "@/lib/care";
import { BEACON_URL } from "@/lib/constants";
import { groupLabel } from "@/lib/names";

function fmtDate(d: Date | null) {
  if (!d) return "No notes yet";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function CarePage() {
  const user = await requireActiveUser();
  if (user.role === "MEMBER") notFound();

  // --- CGL: my guys ---
  if (user.role === "LEADER") {
    const { group, guys } = await getMyGuysWithNotes(user);
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-flock-800">
            Spiritual Summaries
          </h1>
          <p className="text-sm text-muted">
            {group ? groupLabel(user.username) : "Your group"} · tap a guy to
            add a note
          </p>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {guys.map((g) => (
            <li key={g.id}>
              <Link
                href={`/care/${g.id}`}
                className="flex items-center justify-between px-4 py-3 active:bg-flock-50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {g.username}
                  </p>
                  <p className="text-xs text-muted">
                    {g.noteCount} note{g.noteCount === 1 ? "" : "s"} · last{" "}
                    {fmtDate(g.lastNote)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // --- RS: activity feed + Beacon + browse all ---
  const [recent, students] = await Promise.all([
    getRecentCareNotes(user),
    getHallStudentsWithNotes(user),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-bold text-flock-800">Spiritual Summaries</h1>

      {/* Admin-only Beacon link */}
      <a
        href={BEACON_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-sm active:bg-flock-50"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            File an IR in Beacon
          </p>
          <p className="text-xs text-muted">
            IRs are officially recorded in Liberty&apos;s Beacon system.
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-flock-700" aria-hidden />
      </a>

      {/* Recent activity */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Recent activity
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No summaries yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/care/${n.student.id}`}
                  className="block rounded-card border border-border bg-surface p-3 shadow-sm active:bg-flock-50"
                >
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {n.student.username}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {n.author?.username ?? "—"} ·{" "}
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Browse all students */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          All students ({students.length})
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/care/${s.id}`}
                className="flex items-center justify-between px-4 py-2.5 active:bg-flock-50"
              >
                <span className="text-sm text-foreground">{s.username}</span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {s.noteCount} note{s.noteCount === 1 ? "" : "s"}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
