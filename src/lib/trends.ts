import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { byLastName, groupLabel } from "@/lib/names";

/**
 * Attendance Trends (RS only). Pure counts over time — no AI, no interpretation.
 * Turns attendance from paperwork into pastoral awareness: spot a slipping group
 * or a guy who's drifted before summary time.
 */

function assertAdmin(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
}

export type TrendsData = {
  weekly: { index: number; label: string; present: number; total: number; pct: number }[];
  groups: { id: string; name: string; present: number; total: number; pct: number }[];
  needsAttention: { id: string; username: string; groupName: string | null; lastSeenWeek: number | null }[];
  totalMembers: number;
};

export async function getTrends(user: ActiveUser): Promise<TrendsData> {
  assertAdmin(user);
  const hallId = user.hallId;

  const [weeks, members, groups, records] = await Promise.all([
    prisma.week.findMany({
      where: { hallId },
      orderBy: [{ index: "asc" }],
      select: { id: true, index: true, passageRef: true },
    }),
    prisma.user.findMany({
      where: { hallId, role: "MEMBER", isActive: true },
      select: { id: true, username: true, groupId: true },
    }),
    prisma.group.findMany({
      where: { hallId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        leader: { select: { username: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { hallId, status: "PRESENT" },
      select: { weekId: true, studentId: true, groupId: true },
    }),
  ]);

  const totalMembers = members.length;

  // Present count per week.
  const presentByWeek = new Map<string, Set<string>>();
  for (const r of records) {
    if (!presentByWeek.has(r.weekId)) presentByWeek.set(r.weekId, new Set());
    presentByWeek.get(r.weekId)!.add(r.studentId);
  }

  const weekly = weeks.map((w) => {
    const present = presentByWeek.get(w.id)?.size ?? 0;
    return {
      index: w.index,
      label: `W${w.index}`,
      present,
      total: totalMembers,
      pct: totalMembers ? Math.round((present / totalMembers) * 100) : 0,
    };
  });

  // Per-group attendance for the most recent week.
  const latest = weeks[weeks.length - 1];
  const latestPresent: Set<string> = latest
    ? (presentByWeek.get(latest.id) ?? new Set<string>())
    : new Set<string>();
  const memberGroup = new Map(members.map((m) => [m.id, m.groupId]));
  const groupPresent = new Map<string, number>();
  for (const sid of latestPresent) {
    const gid = memberGroup.get(sid);
    if (gid) groupPresent.set(gid, (groupPresent.get(gid) ?? 0) + 1);
  }
  const groupsOut = groups.map((g) => {
    const total = g._count.members;
    const present = groupPresent.get(g.id) ?? 0;
    return {
      id: g.id,
      name: groupLabel(g.leader?.username, g.name),
      present,
      total,
      pct: total ? Math.round((present / total) * 100) : 0,
    };
  });

  // Needs attention: no PRESENT in the last 3 weeks (rule, not AI).
  const recentWeekIds = weeks.slice(-3).map((w) => w.id);
  const seenRecently = new Set<string>();
  for (const wid of recentWeekIds) {
    for (const sid of presentByWeek.get(wid) ?? []) seenRecently.add(sid);
  }
  // Last week each student was present (for context).
  const lastSeen = new Map<string, number>();
  for (const w of weeks) {
    for (const sid of presentByWeek.get(w.id) ?? []) lastSeen.set(sid, w.index);
  }
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const needsAttention = members
    .filter((m) => !seenRecently.has(m.id))
    .map((m) => ({
      id: m.id,
      username: m.username,
      groupName: m.groupId ? (groupName.get(m.groupId) ?? null) : null,
      lastSeenWeek: lastSeen.get(m.id) ?? null,
    }))
    .sort(byLastName);

  return { weekly, groups: groupsOut, needsAttention, totalMembers };
}
