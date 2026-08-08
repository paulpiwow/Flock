import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { addCareNote } from "@/lib/care";

/**
 * 1-on-1 tracker — a light "have I met with each guy this cycle?" list for CGLs.
 * Not a calendar. Hall/group-scoped to the CGL's own group.
 */

const NUDGE_DAYS = 21; // nudge if not met in ~3 weeks

export type OneOnOneGuy = {
  id: string;
  username: string;
  lastMet: Date | null;
  count: number;
  needsNudge: boolean;
};

/** The CGL's guys with their last-met date + a nudge flag. */
export async function getMyOneOnOnes(user: ActiveUser) {
  const led = await prisma.group.findFirst({
    where: { hallId: user.hallId, leaderId: user.id },
    include: { members: { select: { id: true, username: true } } },
  });
  if (!led) return { group: null, guys: [] as OneOnOneGuy[] };

  const memberIds = led.members.map((m) => m.id);
  const grouped = memberIds.length
    ? await prisma.oneOnOne.groupBy({
        by: ["studentId"],
        where: { hallId: user.hallId, studentId: { in: memberIds } },
        _max: { metAt: true },
        _count: { _all: true },
      })
    : [];
  const byStudent = new Map(grouped.map((g) => [g.studentId, g]));

  const now = Date.now();
  const guys: OneOnOneGuy[] = led.members.map((m) => {
    const info = byStudent.get(m.id);
    const lastMet = info?._max.metAt ?? null;
    const needsNudge =
      !lastMet || now - lastMet.getTime() > NUDGE_DAYS * 86_400_000;
    return {
      id: m.id,
      username: m.username,
      lastMet,
      count: info?._count._all ?? 0,
      needsNudge,
    };
  });

  // Nudge-worthy first, then oldest last-met first (never-met at the very top).
  guys.sort((a, b) => {
    if (a.needsNudge !== b.needsNudge) return a.needsNudge ? -1 : 1;
    const at = a.lastMet?.getTime() ?? 0;
    const bt = b.lastMet?.getTime() ?? 0;
    return at - bt;
  });

  return { group: led, guys };
}

/** Assert the guy is in the CGL's own group (or the caller is an RS). */
async function requireGuyAccess(user: ActiveUser, studentId: string) {
  const led = await prisma.group.findFirst({
    where: { hallId: user.hallId, leaderId: user.id },
    select: { id: true },
  });
  const student = await prisma.user.findFirst({
    where: { id: studentId, hallId: user.hallId, role: "MEMBER" },
    select: { id: true, groupId: true },
  });
  if (!student) throw new Error("Guy not found on this hall.");
  const ok = user.role === "ADMIN" || (led && student.groupId === led.id);
  if (!ok) throw new Error("That guy isn't in your group.");
}

/** Log a 1-on-1. An optional note is also saved as a care note (flows to the RS). */
export async function logOneOnOne(
  user: ActiveUser,
  studentId: string,
  opts: { metAt?: Date; note?: string } = {},
) {
  await requireGuyAccess(user, studentId);

  await prisma.oneOnOne.create({
    data: {
      hallId: user.hallId,
      studentId,
      leaderId: user.id,
      metAt: opts.metAt ?? new Date(),
    },
  });

  const note = opts.note?.trim();
  if (note) {
    await addCareNote(user, {
      studentId,
      body: `1-on-1: ${note}`,
      tag: "FOLLOW_UP",
    });
  }
}
