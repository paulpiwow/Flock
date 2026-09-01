"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import {
  promoteToCgl,
  demoteToStudent,
  approveUser,
  removeUser,
  passwordResetLink,
} from "@/lib/people";
import { siteOrigin } from "@/lib/site";

export type ResetLinkState = {
  link?: string;
  username?: string;
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
