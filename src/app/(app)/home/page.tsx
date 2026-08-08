import { requireActiveUser } from "@/lib/auth";
import { HOME_TILES } from "@/lib/features";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { getSelfAttendance } from "@/lib/attendance";
import { isCheckInOpen } from "@/lib/checkin";
import { FeatureGrid } from "@/components/FeatureGrid";
import { InstallPrompt } from "@/components/InstallPrompt";
import { SelfCheckInCard } from "@/components/SelfCheckInCard";
import { SheepMark } from "@/components/SheepMark";
import { SignOutButton } from "@/components/SignOutButton";

export default async function HomePage() {
  const user = await requireActiveUser();
  const role = user.role as Role;
  const initial = user.username.charAt(0).toUpperCase();

  // Students self-check-in from Home — but only during the Wednesday-night
  // window (or if they've already been marked this week).
  const selfAttendance =
    role === "MEMBER" ? await getSelfAttendance(user) : null;
  const checkInOpen = isCheckInOpen();
  const alreadyMarked = !!(
    selfAttendance?.record?.selfReportedAt ||
    selfAttendance?.record?.confirmedAt
  );
  const showCheckIn =
    !!selfAttendance?.week && (checkInOpen || alreadyMarked);

  return (
    <section className="space-y-6">
      {/* Top bar: brand + sign out */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-flock-800">
          <SheepMark className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">Flock</span>
        </div>
        <SignOutButton />
      </div>

      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-flock-700 text-lg font-bold text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {user.username}
          </h1>
          <p className="text-sm text-muted">
            {ROLE_LABEL[role]} · {user.hall.name}
          </p>
        </div>
      </div>

      {/* Student: this week's check-in, up top (Wednesday-night window only) */}
      {showCheckIn && selfAttendance?.week && (
        <SelfCheckInCard
          passageRef={selfAttendance.week.passageRef}
          groupName={selfAttendance.group?.name ?? null}
          leaderName={selfAttendance.group?.leader?.username ?? null}
          hasGroup={!!user.groupId}
          open={checkInOpen}
          selfReported={!!selfAttendance.record?.selfReportedAt}
          confirmedStatus={
            selfAttendance.record?.confirmedAt
              ? selfAttendance.record.status
              : null
          }
        />
      )}

      {/* Install banner (shows only when installable / iOS Safari) */}
      <InstallPrompt />

      {/* Launcher grid */}
      <FeatureGrid tiles={HOME_TILES[role]} />
    </section>
  );
}
