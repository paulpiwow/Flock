import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { byLastName } from "@/lib/names";

/**
 * Community Group Maker data layer. The RS runs the "draft": assigning each guy
 * to the CGL who picks him. Also the who's-in-each-group overview. All admin-only
 * and hall-scoped.
 */

function assertAdmin(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
}

export async function getDraftBoard(user: ActiveUser) {
  assertAdmin(user);

  const [groups, pool] = await Promise.all([
    prisma.group.findMany({
      where: { hallId: user.hallId },
      orderBy: { name: "asc" },
      include: {
        leader: { select: { username: true } },
        members: { select: { id: true, username: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        hallId: user.hallId,
        role: "MEMBER",
        groupId: null,
        isActive: true,
      },
      select: { id: true, username: true },
    }),
  ]);

  return {
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      leaderName: g.leader?.username ?? null,
      members: [...g.members].sort(byLastName),
    })),
    pool: [...pool].sort(byLastName),
  };
}

/** Assign a student to a group (the RS's pick). */
export async function assignStudent(
  user: ActiveUser,
  studentId: string,
  groupId: string,
) {
  assertAdmin(user);
  const [group, student] = await Promise.all([
    prisma.group.findFirst({
      where: { id: groupId, hallId: user.hallId },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: studentId, hallId: user.hallId, role: "MEMBER" },
      select: { id: true },
    }),
  ]);
  if (!group || !student) throw new Error("Invalid assignment.");

  await prisma.user.update({
    where: { id: studentId },
    data: { groupId },
  });
}

/** Remove a student from their group (back to the pool). */
export async function unassignStudent(user: ActiveUser, studentId: string) {
  assertAdmin(user);
  await prisma.user.updateMany({
    where: { id: studentId, hallId: user.hallId, role: "MEMBER" },
    data: { groupId: null },
  });
}

/** The hall's CGLs (group leaders) — for the picker wheel. */
export async function getHallCGLs(user: ActiveUser) {
  const leaders = await prisma.user.findMany({
    where: { hallId: user.hallId, role: "LEADER", isActive: true },
    select: { id: true, username: true },
  });
  return [...leaders].sort(byLastName);
}
