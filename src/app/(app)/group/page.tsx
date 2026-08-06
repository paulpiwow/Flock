import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getGroupRoster, getMyLedGroup } from "@/lib/attendance";
import { RosterConfirm, type RosterItem } from "@/components/RosterConfirm";
import { ComingSoon } from "@/components/ComingSoon";

export default async function GroupPage() {
  const user = await requireActiveUser();

  // RS manages attendance from the all-hall screen; students from /attendance.
  if (user.role === "ADMIN") redirect("/attendance");
  if (user.role === "MEMBER") redirect("/attendance");

  const led = await getMyLedGroup(user);
  if (!led) {
    return (
      <ComingSoon
        title="My Group"
        blurb="You're not leading a group yet. Your RS assigns groups in the Community Group Maker."
      />
    );
  }

  const { group, week, roster } = await getGroupRoster(user, led.id);

  if (!week) {
    return (
      <section className="space-y-2">
        <h1 className="text-xl font-bold text-flock-800">{group.name}</h1>
        <p className="text-sm text-muted">No meeting is set up yet.</p>
      </section>
    );
  }

  const items: RosterItem[] = roster.map((r) => ({
    id: r.id,
    username: r.username,
    selfReported: !!r.record?.selfReportedAt,
    present: r.record?.status === "PRESENT",
  }));
  const alreadyConfirmed = roster.some((r) => r.record?.confirmedAt);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">{group.name}</h1>
        <p className="text-sm text-muted">Tap who came, then confirm.</p>
      </div>
      <RosterConfirm
        groupId={group.id}
        weekLabel={`${week.passageRef} · week ${week.index}`}
        roster={items}
        alreadyConfirmed={alreadyConfirmed}
      />
    </section>
  );
}
