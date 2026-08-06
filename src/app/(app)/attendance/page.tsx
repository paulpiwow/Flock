import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import {
  getAllHallAttendance,
  getHallGroups,
  getSelfAttendance,
} from "@/lib/attendance";
import { SelfCheckInCard } from "@/components/SelfCheckInCard";
import { cn } from "@/lib/cn";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const user = await requireActiveUser();

  // CGLs manage attendance from their group screen.
  if (user.role === "LEADER") redirect("/group");

  // --- Student: self-check-in ---
  if (user.role === "MEMBER") {
    const { week, group, record } = await getSelfAttendance(user);
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-bold text-flock-800">Attendance</h1>
        {week ? (
          <SelfCheckInCard
            passageRef={week.passageRef}
            groupName={group?.name ?? null}
            leaderName={group?.leader?.username ?? null}
            selfReported={!!record?.selfReportedAt}
            confirmedStatus={record?.confirmedAt ? record.status : null}
          />
        ) : (
          <p className="text-sm text-muted">No meeting is set up yet.</p>
        )}
      </section>
    );
  }

  // --- RS: all-hall view ---
  const { group: groupId } = await searchParams;
  const [{ week, attended, absent, total }, groups] = await Promise.all([
    getAllHallAttendance(user, groupId),
    getHallGroups(user),
  ]);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Attendance</h1>
        {week && (
          <p className="text-sm text-muted">
            {week.passageRef} · {week.semester} · week {week.index}
          </p>
        )}
      </div>

      {/* Group filter tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterTab label="All groups" href="/attendance" active={!groupId} />
        {groups.map((g) => (
          <FilterTab
            key={g.id}
            label={g.name}
            href={`/attendance?group=${g.id}`}
            active={groupId === g.id}
          />
        ))}
      </div>

      {/* Absentees first — the short, important list */}
      <RosterBlock
        title="Did NOT attend"
        count={absent.length}
        names={absent.map((m) => m.username)}
        tone="absent"
      />
      <RosterBlock
        title="Attended"
        count={attended.length}
        names={attended.map((m) => m.username)}
        tone="present"
      />

      <p className="text-center text-xs text-muted">
        {total} student{total === 1 ? "" : "s"}
        {groupId ? " in this group" : " on the hall"}
      </p>
    </section>
  );
}

function FilterTab({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-flock-700 text-white"
          : "bg-flock-100 text-flock-700 hover:bg-flock-300/50",
      )}
    >
      {label}
    </Link>
  );
}

function RosterBlock({
  title,
  count,
  names,
  tone,
}: {
  title: string;
  count: number;
  names: string[];
  tone: "present" | "absent";
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            tone === "absent"
              ? "bg-absent/10 text-absent"
              : "bg-flock-100 text-flock-700",
          )}
        >
          {count}
        </span>
      </div>
      {names.length === 0 ? (
        <p className="text-xs text-muted">None.</p>
      ) : (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {names.map((n) => (
            <li key={n} className="text-sm text-foreground">
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
