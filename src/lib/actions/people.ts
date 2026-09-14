"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import {
  promoteToCgl,
  demoteToStudent,
  approveUser,
  removeUser,
  passwordResetLink,
  renameUser,
} from "@/lib/people";
import { siteOrigin } from "@/lib/site";
import { fullNameSchema } from "@/lib/names";

export type RenameState = { error?: string; saved?: number };

/** RS edits someone's first + last name. Shows everywhere the name appears. */
export async function renameUserAction(
  _prev: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing person." };
  const parsed = fullNameSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await renameUser(user, id, parsed.data.firstName, parsed.data.lastName);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save." };
  }
  // The name shows on every page (rosters, groups, notes, home), so refresh all.
  revalidatePath("/", "layout");
  return { saved: Date.now() };
}

export type ResetLinkState = {
  link?: string;
  name?: string;
  error?: string;
};

/** RS generates a one-time password-reset link to text to a student. */
export async function resetLinkAction(
  _prev: ResetLinkState,
  formData: FormData,
): Promise<ResetLinkState> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing person." };
  try {
    return await passwordResetLink(user, id, await siteOrigin());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't make a link." };
  }
}

export async function promoteToCglAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await promoteToCgl(user, id);
  revalidatePath("/people");
  revalidatePath("/draft");
}

// RS accounts are provisioned out-of-band via scripts/set-role.js (a fresh RS
// signs up with their hall code, then is promoted once by command). There's no
// in-app "make an RS" — role-granting stays deliberate.

export async function approveUserAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await approveUser(user, id);
  revalidatePath("/people");
}

export async function removeUserAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await removeUser(user, id);
  revalidatePath("/people");
}

export async function demoteToStudentAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await demoteToStudent(user, id);
  revalidatePath("/people");
  revalidatePath("/draft");
}
