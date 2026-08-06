import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { byLastName } from "@/lib/names";

/**
 * People & roles management (RS only, hall-scoped). Promote a student to CGL
 * (they get a group to lead) or demote a CGL back to student.
 */

function assertAdmin(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
}

export async function getPeople(user: ActiveUser) {
  assertAdmin(user);
  const [leaders, students, groups] = await Promise.all([
    prisma.user.findMany({
      where: { hallId: user.hallId, role: "LEADER", isActive: true },
      select: { id: true, username: true },
    }),
    prisma.user.findMany({
      where: { hallId: user.hallId, role: "MEMBER", isActive: true },
      select: { id: true, username: true, group: { select: { name: true } } },
    }),
    prisma.group.findMany({
      where: { hallId: user.hallId },
      select: { id: true, name: true, leaderId: true },
    }),
  ]);

  const groupByLeader = new Map(
    groups.filter((g) => g.leaderId).map((g) => [g.leaderId as string, g.name]),
  );

  const cgls = leaders
    .map((l) => ({ id: l.id, username: l.username, groupName: groupByLeader.get(l.id) ?? null }))
    .sort(byLastName);
  const members = students
    .map((s) => ({ id: s.id, username: s.username, groupName: s.group?.name ?? null }))
    .sort(byLastName);

  return { cgls, students: members };
}

/** Promote a student to CGL and give them a new group to lead. */
export async function promoteToCgl(user: ActiveUser, studentId: string) {
  assertAdmin(user);
  const student = await prisma.user.findFirst({
    where: { id: studentId, hallId: user.hallId, role: "MEMBER" },
    select: { id: true, username: true },
  });
  if (!student) throw new Error("Student not found on this hall.");

  const first = student.username.split(/\s+/)[0] || student.username;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: student.id },
      data: { role: "LEADER", groupId: null },
    }),
    prisma.group.create({
      data: {
        hallId: user.hallId,
        name: `${first}'s Group`,
        leaderId: student.id,
      },
    }),
  ]);
}

/** Demote a CGL back to student. Their group is freed; deleted if now empty. */
export async function demoteToStudent(user: ActiveUser, leaderId: string) {
  assertAdmin(user);
  const leader = await prisma.user.findFirst({
    where: { id: leaderId, hallId: user.hallId, role: "LEADER" },
    select: { id: true },
  });
  if (!leader) throw new Error("CGL not found on this hall.");

  const ledGroups = await prisma.group.findMany({
    where: { hallId: user.hallId, leaderId: leader.id },
    select: { id: true, _count: { select: { members: true } } },
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: leader.id },
      data: { role: "MEMBER", groupId: null },
    });
    for (const g of ledGroups) {
      if (g._count.members === 0) {
        await tx.group.delete({ where: { id: g.id } });
      } else {
        await tx.group.update({
          where: { id: g.id },
          data: { leaderId: null },
        });
      }
    }
  });
}
