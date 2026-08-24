import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { getCurrentWeek } from "@/lib/attendance";

/**
 * Weekly Notes data layer. Personal notes are private to each person (a study
 * journal). Flock never interprets the passage — it just stores a blank page
 * and links out to Enduring Word. RS-only helpers set the week's passage/verse.
 */

/** A week (default: current) + this user's private note. */
export async function getWeekContext(user: ActiveUser, weekId?: string) {
  const week = weekId
    ? await prisma.week.findFirst({ where: { id: weekId, hallId: user.hallId } })
    : await getCurrentWeek(user.hallId);
  if (!week) return null;

  const note = await prisma.weeklyNote.findUnique({
    where: { authorId_weekId: { authorId: user.id, weekId: week.id } },
  });
  return { week, note };
}

/** All weeks on the hall (for the archive), newest first. */
export async function getArchiveWeeks(user: ActiveUser) {
  return prisma.week.findMany({
    where: { hallId: user.hallId },
    orderBy: [{ date: "desc" }, { index: "desc" }],
    select: { id: true, index: true, passageRef: true, date: true, semester: true },
  });
}

/** Save (create/update) the user's private note for a week. */
export async function upsertWeeklyNote(
  user: ActiveUser,
  weekId: string,
  body: string,
) {
  const week = await prisma.week.findFirst({
    where: { id: weekId, hallId: user.hallId },
    select: { id: true },
  });
  if (!week) throw new Error("Week not found on this hall.");

  return prisma.weeklyNote.upsert({
    where: { authorId_weekId: { authorId: user.id, weekId } },
    create: { authorId: user.id, weekId, body },
    update: { body },
  });
}

/* ---------- RS-only setup ---------- */

function assertAdmin(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
}

/** RS sets the passage + Enduring Word link for a week. */
export async function setWeekPassage(
  user: ActiveUser,
  weekId: string,
  passageRef: string,
  enduringUrl: string | null,
) {
  assertAdmin(user);
  return prisma.week.updateMany({
    where: { id: weekId, hallId: user.hallId },
    data: { passageRef, enduringUrl },
  });
}

/** RS deletes a week — cascades to its attendance records and everyone's notes. */
export async function deleteWeek(user: ActiveUser, weekId: string) {
  assertAdmin(user);
  const res = await prisma.week.deleteMany({
    where: { id: weekId, hallId: user.hallId },
  });
  if (res.count === 0) throw new Error("Week not found on this hall.");
}

