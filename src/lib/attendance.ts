import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { byLastName, groupLabel } from "@/lib/names";

/**
 * Attendance data layer — the ONE place attendance is read/written. Every
 * function takes the ActiveUser and filters by `user.hallId`, so cross-hall
 * access is structurally impossible; role/group checks live here too.
 */

const TZ = "America/New_York";

/**
 * Canonical key for the current attendance week: this week's Wednesday (most
 * recent Wed in ET), normalized to noon UTC. The week rolls every Wednesday, so
 * a new week starts with no one checked until that night's check-ins.
 */
function currentWeekAnchor(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const y = Number(get("year"));
  const mo = Number(get("month"));
  const d = Number(get("day"));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  const daysSinceWed = (wd - 3 + 7) % 7; // Wednesday = 3
  const anchor = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() - daysSinceWed);
  return anchor;
}

function semesterLabel(d: Date): string {
  const m = d.getUTCMonth();
  const y = d.getUTCFullYear();
  if (m >= 7) return `Fall ${y}`; // Aug–Dec
  if (m <= 4) return `Spring ${y}`; // Jan–May
  return `Summer ${y}`; // Jun–Jul
}

/**
 * The current week for a hall — auto-created for the current calendar week if it
 * doesn't exist yet, so attendance refreshes weekly with no manual RS step.
 * New weeks get a "Passage TBD" placeholder until the RS sets the passage.
 */
export async function getCurrentWeek(hallId: string) {
  const anchor = currentWeekAnchor();
  const start = new Date(anchor);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(anchor);
  end.setUTCHours(23, 59, 59, 999);

  const existing = await prisma.week.findFirst({
    where: { hallId, date: { gte: start, lte: end } },
  });
  if (existing) return existing;

  const semester = semesterLabel(anchor);
  const last = await prisma.week.findFirst({
    where: { hallId, semester },
    orderBy: { index: "desc" },
    select: { index: true },
  });
  try {
    return await prisma.week.create({
      data: {
        hallId,
        index: (last?.index ?? 0) + 1,
        date: anchor,
        semester,
        passageRef: "Passage TBD",
        enduringUrl: null,
      },
    });
  } catch (e) {
    // A concurrent first-read may have created it (unique index+semester).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const w = await prisma.week.findFirst({
        where: { hallId, date: { gte: start, lte: end } },
      });
      if (w) return w;
    }
    throw e;
  }
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

/** Groups on the user's hall (for RS filter tabs), labeled by CGL last name. */
export async function getHallGroups(user: ActiveUser) {
  const groups = await prisma.group.findMany({
    where: { hallId: user.hallId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, leader: { select: { username: true } } },
  });
  return groups.map((g) => ({
    id: g.id,
    name: groupLabel(g.leader?.username, g.name),
  }));
}
