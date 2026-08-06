import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";

/**
 * Memory verses, two tiers (hall-scoped, never interpreted):
 *   LEADERS — RS assigns to the hall's CGLs.
 *   GROUP   — a CGL assigns to their own group's members.
 */

function assertAdmin(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
}

/** The group a CGL leads (for their group-verse management). */
export async function getMyLedGroup(user: ActiveUser) {
  return prisma.group.findFirst({
    where: { hallId: user.hallId, leaderId: user.id },
    select: { id: true, name: true },
  });
}

/** Verses the RS set for the hall's CGLs. Visible to RS + CGLs. */
export async function getLeaderVerses(user: ActiveUser) {
  return prisma.memoryVerse.findMany({
    where: { hallId: user.hallId, audience: "LEADERS" },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { username: true } } },
  });
}

/** Assert the caller may manage this group's verses (its CGL, or an RS). */
async function requireGroupManage(user: ActiveUser, groupId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, hallId: user.hallId },
    select: { id: true, leaderId: true, name: true },
  });
  if (!group) throw new Error("Group not found on this hall.");
  if (user.role !== "ADMIN" && group.leaderId !== user.id) {
    throw new Error("Not your group.");
  }
  return group;
}

/** Verses for a specific group (for the CGL's management view). */
export async function getGroupVerses(user: ActiveUser, groupId: string) {
  await requireGroupManage(user, groupId);
  return prisma.memoryVerse.findMany({
    where: { hallId: user.hallId, groupId, audience: "GROUP" },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { username: true } } },
  });
}

/** The verses a student should memorize = their own group's verses. */
export async function getStudentVerses(user: ActiveUser) {
  if (!user.groupId) return [];
  return prisma.memoryVerse.findMany({
    where: { hallId: user.hallId, groupId: user.groupId, audience: "GROUP" },
    orderBy: { createdAt: "desc" },
  });
}

/** RS adds a verse for the hall's CGLs. */
export async function addLeaderVerse(
  user: ActiveUser,
  reference: string,
  text: string,
) {
  assertAdmin(user);
  return prisma.memoryVerse.create({
    data: {
      hallId: user.hallId,
      audience: "LEADERS",
      reference: reference.trim(),
      text: text.trim(),
      authorId: user.id,
    },
  });
}

/** CGL (or RS) adds a verse for a group's members. */
export async function addGroupVerse(
  user: ActiveUser,
  groupId: string,
  reference: string,
  text: string,
) {
  await requireGroupManage(user, groupId);
  return prisma.memoryVerse.create({
    data: {
      hallId: user.hallId,
      audience: "GROUP",
      groupId,
      reference: reference.trim(),
      text: text.trim(),
      authorId: user.id,
    },
  });
}

/** Delete a verse. LEADERS → RS only; GROUP → the group's CGL or an RS. */
export async function deleteVerse(user: ActiveUser, id: string) {
  const verse = await prisma.memoryVerse.findFirst({
    where: { id, hallId: user.hallId },
    select: { id: true, audience: true, groupId: true },
  });
  if (!verse) return;

  if (verse.audience === "LEADERS") {
    assertAdmin(user);
  } else if (verse.groupId) {
    await requireGroupManage(user, verse.groupId);
  }

  await prisma.memoryVerse.delete({ where: { id: verse.id } });
}
