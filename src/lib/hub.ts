import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { getCurrentWeek } from "@/lib/attendance";
import { byLastName } from "@/lib/names";

/**
 * CGL Hub — everything a CGL is responsible for, derived from real data:
 *   - Has attendance been submitted this week?
 *   - Which of their guys still need a care note this semester?
 * The RS gets the same, across all CGLs, to see who's on track without nagging.
 */

async function groupSubmittedThisWeek(groupId: string, weekId: string) {
  const count = await prisma.attendanceRecord.count({
    where: { groupId, weekId, confirmedAt: { not: null } },
  });
  return count > 0;
}

/** Members of a group who have no care note this semester. */
async function careGaps(
  memberIds: string[],
  hallId: string,
  semester: string,
) {
  if (memberIds.length === 0) return new Set<string>();
  const withNotes = await prisma.careNote.groupBy({
    by: ["studentId"],
    where: { hallId, semester, studentId: { in: memberIds } },
  });
  const have = new Set(withNotes.map((w) => w.studentId));
  return new Set(memberIds.filter((id) => !have.has(id)));
}

export async function getCglHub(user: ActiveUser) {
  const week = await getCurrentWeek(user.hallId);
  const semester = week?.semester ?? "Fall 2026";

  const group = await prisma.group.findFirst({
    where: { hallId: user.hallId, leaderId: user.id },
    include: { members: { select: { id: true, username: true } } },
  });
  if (!group || !week) {
    return { group, week, submitted: false, needNote: [] as { id: string; username: string }[] };
  }

  const memberIds = group.members.map((m) => m.id);
  const [submitted, gaps] = await Promise.all([
    groupSubmittedThisWeek(group.id, week.id),
    careGaps(memberIds, user.hallId, semester),
  ]);

  const needNote = group.members
    .filter((m) => gaps.has(m.id))
    .sort(byLastName);

  return { group, week, submitted, needNote };
}

export type CglStatus = {
  groupId: string;
  groupName: string;
  leaderName: string | null;
  submitted: boolean;
  careGapCount: number;
  memberCount: number;
};

/** RS overview: each CGL's status this week. */
export async function getRsHubOverview(user: ActiveUser): Promise<CglStatus[]> {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
  const week = await getCurrentWeek(user.hallId);
  const semester = week?.semester ?? "Fall 2026";

  const groups = await prisma.group.findMany({
    where: { hallId: user.hallId },
    orderBy: { name: "asc" },
    include: {
      leader: { select: { username: true } },
      members: { select: { id: true } },
    },
  });

  const out: CglStatus[] = [];
  for (const g of groups) {
    const memberIds = g.members.map((m) => m.id);
    const [submitted, gaps] = await Promise.all([
      week ? groupSubmittedThisWeek(g.id, week.id) : Promise.resolve(false),
      careGaps(memberIds, user.hallId, semester),
    ]);
    out.push({
      groupId: g.id,
      groupName: g.name,
      leaderName: g.leader?.username ?? null,
      submitted,
      careGapCount: gaps.size,
      memberCount: memberIds.length,
    });
  }
  return out;
}
