import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ActiveUser } from "@/lib/auth";
import { byLastName, groupLabel } from "@/lib/names";

/**
 * People & roles management (RS only, hall-scoped). Promote a student to CGL,
 * appoint a co-RS, or demote back — no manual DB edits. You can never change
 * your OWN role here (prevents a hall locking out its last RS).
 */

function assertAdmin(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
}

/** When someone stops leading, free their groups (delete if empty). */
async function freeLedGroups(
  tx: Prisma.TransactionClient,
  hallId: string,
  userId: string,
) {
  const led = await tx.group.findMany({
    where: { hallId, leaderId: userId },
    select: { id: true, _count: { select: { members: true } } },
  });
  for (const g of led) {
    if (g._count.members === 0) {
      await tx.group.delete({ where: { id: g.id } });
    } else {
      await tx.group.update({ where: { id: g.id }, data: { leaderId: null } });
    }
  }
}

export async function getPeople(user: ActiveUser) {
  assertAdmin(user);
  const [admins, leaders, students, groups] = await Promise.all([
    prisma.user.findMany({
      where: { hallId: user.hallId, role: "ADMIN", isActive: true },
      select: { id: true, username: true },
    }),
    prisma.user.findMany({
      where: { hallId: user.hallId, role: "LEADER", isActive: true },
      select: { id: true, username: true },
    }),
    prisma.user.findMany({
      where: { hallId: user.hallId, role: "MEMBER", isActive: true },
      select: {
        id: true,
        username: true,
        group: { select: { name: true, leader: { select: { username: true } } } },
      },
    }),
    prisma.group.findMany({
      where: { hallId: user.hallId },
      select: { id: true, leaderId: true },
    }),
  ]);

  const leadsAGroup = new Set(
    groups.filter((g) => g.leaderId).map((g) => g.leaderId as string),
  );

  return {
    admins: admins
      .map((a) => ({ id: a.id, username: a.username }))
      .sort(byLastName),
    cgls: leaders
      .map((l) => ({
        id: l.id,
        username: l.username,
        groupName: leadsAGroup.has(l.id) ? groupLabel(l.username) : null,
      }))
      .sort(byLastName),
    students: students
      .map((s) => ({
        id: s.id,
        username: s.username,
        groupName: s.group
          ? groupLabel(s.group.leader?.username, s.group.name)
          : null,
      }))
      .sort(byLastName),
  };
}

/** Promote a student to CGL and give them a new group to lead. */
export async function promoteToCgl(user: ActiveUser, studentId: string) {
  assertAdmin(user);
  const student = await prisma.user.findFirst({
    where: { id: studentId, hallId: user.hallId, role: "MEMBER" },
    select: { id: true, username: true },
  });
  if (!student) throw new Error("Student not found on this hall.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: student.id },
      data: { role: "LEADER", groupId: null },
    }),
    prisma.group.create({
      data: {
        hallId: user.hallId,
        name: groupLabel(student.username),
        leaderId: student.id,
      },
    }),
  ]);
}

/** Appoint a co-RS on this hall (student or CGL -> ADMIN). */
export async function promoteToRs(user: ActiveUser, targetId: string) {
  assertAdmin(user);
  if (targetId === user.id) throw new Error("You can't change your own role.");
  const target = await prisma.user.findFirst({
    where: { id: targetId, hallId: user.hallId, role: { in: ["MEMBER", "LEADER"] } },
    select: { id: true },
  });
  if (!target) throw new Error("Person not found on this hall.");

  await prisma.$transaction(async (tx) => {
    await freeLedGroups(tx, user.hallId, targetId);
    await tx.user.update({
      where: { id: targetId },
      data: { role: "ADMIN", groupId: null },
    });
  });
}

/** Demote a CGL or co-RS back to student. Their group is freed / deleted if empty. */
export async function demoteToStudent(user: ActiveUser, targetId: string) {
  assertAdmin(user);
  if (targetId === user.id) throw new Error("You can't change your own role.");
  const target = await prisma.user.findFirst({
    where: { id: targetId, hallId: user.hallId, role: { in: ["LEADER", "ADMIN"] } },
    select: { id: true },
  });
  if (!target) throw new Error("Person not found on this hall.");

  await prisma.$transaction(async (tx) => {
    await freeLedGroups(tx, user.hallId, targetId);
    await tx.user.update({
      where: { id: targetId },
      data: { role: "MEMBER", groupId: null },
    });
  });
}
