import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import {
  NAME_SELECT,
  byLastName,
  displayName,
  groupLabel,
  type Named,
} from "@/lib/names";

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
        leader: { select: NAME_SELECT },
        members: { select: { id: true, ...NAME_SELECT } },
      },
    }),
    prisma.user.findMany({
      where: {
        hallId: user.hallId,
        role: "MEMBER",
        groupId: null,
        isActive: true,
      },
      select: { id: true, ...NAME_SELECT },
    }),
  ]);

  const toItem = (m: { id: string } & Named) => ({
    id: m.id,
    name: displayName(m),
  });

  return {
    groups: groups.map((g) => ({
      id: g.id,
      name: groupLabel(g.leader, g.name),
      leaderName: g.leader ? displayName(g.leader) : null,
      members: [...g.members].sort(byLastName).map(toItem),
    })),
    pool: [...pool].sort(byLastName).map(toItem),
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
    select: { id: true, ...NAME_SELECT },
  });
  return [...leaders]
    .sort(byLastName)
    .map((l) => ({ id: l.id, name: displayName(l) }));
}
