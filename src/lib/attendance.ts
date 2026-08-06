import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { byLastName } from "@/lib/names";

/**
 * Attendance data layer — the ONE place attendance is read/written. Every
 * function takes the ActiveUser and filters by `user.hallId`, so cross-hall
 * access is structurally impossible; role/group checks live here too.
 */

/** The current Wednesday for a hall = most recent week by date, then index. */
export async function getCurrentWeek(hallId: string) {
  return prisma.week.findFirst({
    where: { hallId },
    orderBy: [{ date: "desc" }, { index: "desc" }],
  });
}

/** The student's own group + their record for the current week (self-check-in). */
export async function getSelfAttendance(user: ActiveUser) {
  const week = await getCurrentWeek(user.hallId);
  if (!week || !user.groupId) return { week, group: null, record: null };

  const [group, record] = await Promise.all([
    prisma.group.findFirst({
      where: { id: user.groupId, hallId: user.hallId },
      include: { leader: { select: { username: true } } },
    }),
    prisma.attendanceRecord.findUnique({
      where: { weekId_studentId: { weekId: week.id, studentId: user.id } },
    }),
  ]);
  return { week, group, record };
}

/** Student taps "I'm here" — pre-fills their record for the CGL to confirm. */
export async function selfCheckIn(user: ActiveUser) {
  const week = await getCurrentWeek(user.hallId);
  if (!week) throw new Error("No active week to check in for.");

  await prisma.attendanceRecord.upsert({
    where: { weekId_studentId: { weekId: week.id, studentId: user.id } },
    create: {
      hallId: user.hallId,
      weekId: week.id,
      studentId: user.id,
      groupId: user.groupId,
      status: "PRESENT",
      selfReportedAt: new Date(),
    },
    // Don't override a CGL's confirmed record; just stamp the self-report.
    update: { selfReportedAt: new Date() },
  });
}

/** Assert the user may manage this group (its CGL, or an RS on the same hall). */
async function requireGroupAccess(user: ActiveUser, groupId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, hallId: user.hallId },
    include: {
      leader: { select: { id: true, username: true } },
      members: true,
    },
  });
  if (!group) throw new Error("Group not found on this hall.");
  const allowed = user.role === "ADMIN" || group.leaderId === user.id;
  if (!allowed) throw new Error("Not authorized for this group.");
  return group;
}

/** CGL's roster for their group + each member's current-week record. */
export async function getGroupRoster(user: ActiveUser, groupId: string) {
  const group = await requireGroupAccess(user, groupId);
  const week = await getCurrentWeek(user.hallId);

  const records = week
    ? await prisma.attendanceRecord.findMany({
        where: { weekId: week.id, studentId: { in: group.members.map((m) => m.id) } },
      })
    : [];
  const byStudent = new Map(records.map((r) => [r.studentId, r]));

  const roster = [...group.members].sort(byLastName).map((m) => ({
    id: m.id,
    username: m.username,
    record: byStudent.get(m.id) ?? null,
  }));

  return { group, week, roster };
}

/** The CGL's own led group (for the "My Group" entry point). */
export async function getMyLedGroup(user: ActiveUser) {
  return prisma.group.findFirst({
    where: { hallId: user.hallId, leaderId: user.id },
  });
}

/**
 * CGL confirms the roster: everyone in `presentIds` is PRESENT, the rest ABSENT.
 * This confirm is the official record.
 */
export async function confirmGroupAttendance(
  user: ActiveUser,
  groupId: string,
  presentIds: string[],
) {
  const group = await requireGroupAccess(user, groupId);
  const week = await getCurrentWeek(user.hallId);
  if (!week) throw new Error("No active week.");

  const present = new Set(presentIds);
  const now = new Date();

  await prisma.$transaction(
    group.members.map((m) =>
      prisma.attendanceRecord.upsert({
        where: { weekId_studentId: { weekId: week.id, studentId: m.id } },
        create: {
          hallId: user.hallId,
          weekId: week.id,
          studentId: m.id,
          groupId: group.id,
          status: present.has(m.id) ? "PRESENT" : "ABSENT",
          confirmedAt: now,
          confirmedById: user.id,
          recordedById: user.id,
        },
        update: {
          status: present.has(m.id) ? "PRESENT" : "ABSENT",
          groupId: group.id,
          confirmedAt: now,
          confirmedById: user.id,
          recordedById: user.id,
        },
      }),
    ),
  );
}

/** RS-only: the whole hall for a week, split into absentees / attendees, alphabetized. */
export async function getAllHallAttendance(user: ActiveUser, groupId?: string) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
  const week = await getCurrentWeek(user.hallId);

  const members = await prisma.user.findMany({
    where: {
      hallId: user.hallId,
      role: "MEMBER",
      isActive: true,
      ...(groupId ? { groupId } : {}),
    },
    select: { id: true, username: true, groupId: true },
  });

  const records = week
    ? await prisma.attendanceRecord.findMany({
        where: { weekId: week.id, studentId: { in: members.map((m) => m.id) } },
        select: { studentId: true, status: true },
      })
    : [];
  const status = new Map(records.map((r) => [r.studentId, r.status]));

  const attended = members
    .filter((m) => status.get(m.id) === "PRESENT")
    .sort(byLastName);
  const absent = members
    .filter((m) => status.get(m.id) !== "PRESENT")
    .sort(byLastName);

  return { week, attended, absent, total: members.length };
}

/** Groups on the user's hall (for RS filter tabs). */
export async function getHallGroups(user: ActiveUser) {
  return prisma.group.findMany({
    where: { hallId: user.hallId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
