import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import { getCurrentWeek } from "@/lib/attendance";
import { byLastName } from "@/lib/names";

/**
 * Care Notes data layer — real students' spiritual/personal details, so access
 * control is enforced HERE, not in the UI:
 *   - CGL  → only guys in the group they lead
 *   - RS   → any student on their hall
 *   - Student → never (their role can't reach these functions)
 */

/** Current semester for grouping notes (from the active week; sensible default). */
async function currentSemester(hallId: string): Promise<string> {
  const week = await getCurrentWeek(hallId);
  return week?.semester ?? "Fall 2026";
}

/**
 * Load a student the caller is allowed to see, or throw. This is the gate every
 * care-note read/write passes through.
 */
export async function requireStudentAccess(user: ActiveUser, studentId: string) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, hallId: user.hallId },
    select: { id: true, username: true, groupId: true, hallId: true },
  });
  if (!student) throw new Error("Student not found on this hall.");

  if (user.role === "ADMIN") return student;

  if (user.role === "LEADER") {
    const led = await prisma.group.findFirst({
      where: { hallId: user.hallId, leaderId: user.id },
      select: { id: true },
    });
    if (led && student.groupId === led.id) return student;
    throw new Error("That student isn't in your group.");
  }

  throw new Error("Not authorized.");
}

/** A student's full care-note timeline (newest first). */
export async function getStudentCareNotes(user: ActiveUser, studentId: string) {
  const student = await requireStudentAccess(user, studentId);
  const notes = await prisma.careNote.findMany({
    where: { hallId: user.hallId, studentId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { username: true } } },
  });
  return { student, notes };
}

/** Add a dated care note. Enforces access; flags possible-IR for RS review. */
export async function addCareNote(
  user: ActiveUser,
  input: {
    studentId: string;
    body: string;
    tag: "PRAYER" | "FOLLOW_UP" | null;
    possibleIR: boolean;
  },
) {
  await requireStudentAccess(user, input.studentId);
  const semester = await currentSemester(user.hallId);

  return prisma.careNote.create({
    data: {
      hallId: user.hallId,
      studentId: input.studentId,
      authorId: user.id,
      body: input.body.trim(),
      tag: input.possibleIR ? "POSSIBLE_IR" : input.tag,
      possibleIR: input.possibleIR,
      semester,
    },
  });
}

/** CGL's own guys with note counts + last-note date (their group roster). */
export async function getMyGuysWithNotes(user: ActiveUser) {
  const led = await prisma.group.findFirst({
    where: { hallId: user.hallId, leaderId: user.id },
    include: { members: { select: { id: true, username: true } } },
  });
  if (!led) return { group: null, guys: [] };

  const counts = await prisma.careNote.groupBy({
    by: ["studentId"],
    where: { hallId: user.hallId, studentId: { in: led.members.map((m) => m.id) } },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  const byStudent = new Map(counts.map((c) => [c.studentId, c]));

  const guys = [...led.members].sort(byLastName).map((m) => ({
    id: m.id,
    username: m.username,
    noteCount: byStudent.get(m.id)?._count._all ?? 0,
    lastNote: byStudent.get(m.id)?._max.createdAt ?? null,
  }));
  return { group: led, guys };
}

/** RS activity feed: recent care notes hall-wide, possible-IR first then newest. */
export async function getRecentCareNotes(user: ActiveUser, take = 25) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
  return prisma.careNote.findMany({
    where: { hallId: user.hallId },
    orderBy: [{ possibleIR: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      author: { select: { username: true } },
      student: { select: { id: true, username: true } },
    },
  });
}

/** RS: every student on the hall with a note count, alphabetized. */
export async function getHallStudentsWithNotes(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
  const members = await prisma.user.findMany({
    where: { hallId: user.hallId, role: "MEMBER", isActive: true },
    select: { id: true, username: true },
  });
  const counts = await prisma.careNote.groupBy({
    by: ["studentId"],
    where: { hallId: user.hallId },
    _count: { _all: true },
  });
  const byStudent = new Map(counts.map((c) => [c.studentId, c._count._all]));
  return members
    .map((m) => ({ ...m, noteCount: byStudent.get(m.id) ?? 0 }))
    .sort(byLastName);
}
