import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getTrends } from "@/lib/trends";
import { AttendanceChart } from "@/components/AttendanceChart";
import { cn } from "@/lib/cn";

export default async function TrendsPage() {
  const user = await requireActiveUser();
  if (user.role !== "ADMIN") redirect("/home");

  const { weekly, groups, needsAttention, totalMembers } = await getTrends(user);
  const latestPct = weekly.length ? weekly[weekly.length - 1].pct : 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Attendance Trends</h1>
        <p className="text-sm text-muted">
          {totalMembers} men · latest week {latestPct}% present
        </p>
      </div>

      {/* Overall over time */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Overall attendance
        </h2>
        <AttendanceChart data={weekly.map((w) => ({ label: w.label, pct: w.pct }))} />
      </div>

      {/* Per-group, latest week */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          By group (latest week)
        </h2>
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.id} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-medium text-foreground">
                {g.name}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-flock-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    g.pct < 50
                      ? "bg-absent"
                      : g.pct < 70
                        ? "bg-warn"
                        : "bg-flock-600",
                  )}
                  style={{ width: `${g.pct}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs text-muted">
                {g.present}/{g.total} · {g.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Needs attention — rule-based, not AI */}
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <AlertTriangle className="h-4 w-4 text-warn" aria-hidden />
          Needs attention
        </h2>
        <p className="mb-2 text-xs text-muted">
          Haven&apos;t attended in the last 3 weeks.
        </p>
        {needsAttention.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-5 text-center text-sm text-muted">
            Everyone&apos;s been around lately. 🙌
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {needsAttention.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/care/${s.id}`}
                  className="flex items-center justify-between px-4 py-2.5 active:bg-flock-50"
                >
                  <span className="text-sm text-foreground">{s.username}</span>
                  <span className="text-xs text-muted">
                    {s.groupName ?? "No group"} ·{" "}
                    {s.lastSeenWeek
                      ? `last seen W${s.lastSeenWeek}`
                      : "never seen"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
