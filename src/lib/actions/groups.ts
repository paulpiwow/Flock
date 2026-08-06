"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { assignStudent, unassignStudent } from "@/lib/groups";

/** RS assigns a student to a group. */
export async function assignStudentAction(studentId: string, groupId: string) {
  const user = await requireActiveUser();
  await assignStudent(user, studentId, groupId);
  revalidatePath("/draft");
}

/** RS removes a student from their group. */
export async function unassignStudentAction(studentId: string) {
  const user = await requireActiveUser();
  await unassignStudent(user, studentId);
  revalidatePath("/draft");
}
