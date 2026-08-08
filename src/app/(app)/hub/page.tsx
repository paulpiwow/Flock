import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getRsHubOverview } from "@/lib/hub";
import { cn } from "@/lib/cn";

export default async function HubPage() {
  const user = await requireActiveUser();
  // RS-only (the CGL Hub was retired — its items live in Attendance, Spiritual
  // Summaries, and 1-on-1s). This route is the RS "CGL Status" overview.
  if (user.role !== "ADMIN") redirect("/home");

  const rows = await getRsHubOverview(user);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">CGL Status</h1>
        <p className="text-sm text-muted">Who&apos;s on track this week.</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
        {rows.map((r) => (
          <li
            key={r.groupId}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {r.groupName}
                <span className="ml-1 font-normal text-muted">
                  · {r.leaderName ?? "No CGL"}
                </span>
              </p>
              <p className="text-xs text-muted">
                {r.careGapCount > 0
                  ? `${r.careGapCount} guy${r.careGapCount === 1 ? "" : "s"} need a summary`
                  : "Summaries up to date"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                r.submitted
                  ? "bg-flock-100 text-flock-700"
                  : "bg-warn/10 text-warn",
              )}
            >
              {r.submitted ? "Attendance ✓" : "No attendance"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
