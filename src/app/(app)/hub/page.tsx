import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Check,
  ChevronRight,
  ClipboardList,
  HeartHandshake,
  UserRound,
} from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getCglHub, getRsHubOverview } from "@/lib/hub";
import { getMyOneOnOnes } from "@/lib/oneonone";
import { cn } from "@/lib/cn";

export default async function HubPage() {
  const user = await requireActiveUser();
  if (user.role === "MEMBER") redirect("/home");

  // --- RS: cross-CGL overview ---
  if (user.role === "ADMIN") {
    const rows = await getRsHubOverview(user);
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-flock-800">CGL Status</h1>
          <p className="text-sm text-muted">Who&apos;s on track this week.</p>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {rows.map((r) => (
            <li key={r.groupId} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {r.groupName}
                  <span className="ml-1 font-normal text-muted">
                    · {r.leaderName ?? "No CGL"}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  {r.careGapCount > 0
                    ? `${r.careGapCount} guy${r.careGapCount === 1 ? "" : "s"} need a care note`
                    : "Care notes up to date"}
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

  // --- CGL: my checklist ---
  const [{ group, week, submitted, needNote }, oneOnOnes] = await Promise.all([
    getCglHub(user),
    getMyOneOnOnes(user),
  ]);
  const owed1on1 = oneOnOnes.guys.filter((g) => g.needsNudge).length;

  if (!group) {
    return (
      <section className="space-y-2">
        <h1 className="text-xl font-bold text-flock-800">Hub</h1>
        <p className="text-sm text-muted">
          You&apos;re not leading a group yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Hub</h1>
        <p className="text-sm text-muted">
          {group.name} · your checklist{week ? ` · week ${week.index}` : ""}
        </p>
      </div>

      {/* Submit attendance */}
      <Link
        href="/group"
        className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-sm active:bg-flock-50"
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              submitted ? "bg-flock-100 text-flock-700" : "bg-warn/10 text-warn",
            )}
          >
            {submitted ? (
              <Check className="h-5 w-5" aria-hidden />
            ) : (
              <ClipboardList className="h-5 w-5" aria-hidden />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Submit attendance
            </p>
            <p className="text-xs text-muted">
              {submitted ? "Done for this week ✓" : "Not submitted yet"}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
      </Link>

      {/* Care notes owed */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              needNote.length === 0
                ? "bg-flock-100 text-flock-700"
                : "bg-warn/10 text-warn",
            )}
          >
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Care notes</p>
            <p className="text-xs text-muted">
              {needNote.length === 0
                ? "Every guy has a note this semester ✓"
                : `${needNote.length} guy${needNote.length === 1 ? "" : "s"} still need one`}
            </p>
          </div>
        </div>
        {needNote.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {needNote.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/care/${g.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-flock-300 bg-flock-50 px-3 py-1.5 text-xs text-flock-800 hover:bg-flock-100"
                >
                  {g.username}
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 1-on-1s owed */}
      <Link
        href="/one-on-ones"
        className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-sm active:bg-flock-50"
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              owed1on1 === 0
                ? "bg-flock-100 text-flock-700"
                : "bg-warn/10 text-warn",
            )}
          >
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">1-on-1s</p>
            <p className="text-xs text-muted">
              {owed1on1 === 0
                ? "Everyone met with recently ✓"
                : `${owed1on1} guy${owed1on1 === 1 ? "" : "s"} to catch up with`}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
      </Link>

      <p className="text-center text-[11px] text-muted">
        LEAD group & Connect Class tracking coming soon.
      </p>
    </section>
  );
}
