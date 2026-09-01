import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ActiveUser } from "@/lib/auth";
import { byLastName, groupLabel } from "@/lib/names";
import { createRecoveryToken, deleteAuthUser } from "@/lib/supabase/admin";

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
  const [admins, leaders, students, pending, groups] = await Promise.all([
    prisma.user.findMany({
      where: { hallId: user.hallId, role: "ADMIN", isActive: true },
      select: { id: true, username: true },
    }),
    prisma.user.findMany({
      where: {
        hallId: user.hallId,
        role: "LEADER",
        isActive: true,
        approvedAt: { not: null },
      },
      select: { id: true, username: true },
    }),
    prisma.user.findMany({
      where: {
        hallId: user.hallId,
        role: "MEMBER",
        isActive: true,
        approvedAt: { not: null },
      },
      select: {
        id: true,
        username: true,
        group: {
          select: { name: true, leader: { select: { username: true } } },
        },
      },
    }),
    // Awaiting the RS's approval (no access yet). Show email so the RS can vet it.
    prisma.user.findMany({
      where: {
        hallId: user.hallId,
        isActive: true,
        approvedAt: null,
        role: { not: "ADMIN" },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true, email: true },
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
    pending: pending.map((p) => ({
      id: p.id,
      username: p.username,
      email: p.email,
    })),
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

/** RS approves a pending signup on their hall — grants access. */
export async function approveUser(user: ActiveUser, targetId: string) {
  assertAdmin(user);
  const res = await prisma.user.updateMany({
    where: { id: targetId, hallId: user.hallId, approvedAt: null },
    data: { approvedAt: new Date() },
  });
  if (res.count === 0) throw new Error("Not found or already approved.");
}

/**
 * RS removes a non-admin account (pending OR approved) — fully deletes it:
 * app row + Supabase login. Frees any group they led. Used by both "Deny" on a
 * pending signup and "Remove" on an approved member (e.g. an accidental approve).
 */
export async function removeUser(user: ActiveUser, targetId: string) {
  assertAdmin(user);
  if (targetId === user.id) throw new Error("You can't remove yourself.");
  const target = await prisma.user.findFirst({
    where: { id: targetId, hallId: user.hallId, role: { not: "ADMIN" } },
    select: { id: true },
  });
  if (!target) throw new Error("Person not found (demote an RS first).");
  // Remove their login too (best-effort — needs SUPABASE_SERVICE_ROLE_KEY).
  await deleteAuthUser(target.id).catch(() => {});
  await prisma.$transaction(async (tx) => {
    await freeLedGroups(tx, user.hallId, target.id);
    await tx.user.delete({ where: { id: target.id } });
  });
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

// RS accounts are provisioned via scripts/set-role.js (out-of-band), not in-app.

/** Demote a CGL or co-RS back to student. Their group is freed / deleted if empty. */
export async function demoteToStudent(user: ActiveUser, targetId: string) {
  assertAdmin(user);
  if (targetId === user.id) throw new Error("You can't change your own role.");
  const target = await prisma.user.findFirst({
    where: {
      id: targetId,
      hallId: user.hallId,
      role: { in: ["LEADER", "ADMIN"] },
    },
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

/**
 * RS mints a password-reset link for someone on their hall — for when the
 * reset email lands in junk (or never arrives). The RS texts the link; the
 * student opens it and sets a new password. One-time use, expires ~1 hour.
 */
export async function passwordResetLink(
  user: ActiveUser,
  targetId: string,
  origin: string,
): Promise<{ link: string; username: string }> {
  assertAdmin(user);
  const target = await prisma.user.findFirst({
    where: { id: targetId, hallId: user.hallId, isActive: true },
    select: { email: true, username: true },
  });
  if (!target) throw new Error("Person not found on this hall.");

  const tokenHash = await createRecoveryToken(target.email);
  if (!tokenHash) {
    throw new Error(
      "Reset links aren't set up yet (missing SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "recovery");
  url.searchParams.set("next", "/reset-password");
  return { link: url.toString(), username: target.username };
}
