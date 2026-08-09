"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { promoteToCgl, demoteToStudent, approveUser, denyUser } from "@/lib/people";

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

export async function denyUserAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await denyUser(user, id);
  revalidatePath("/people");
}

export async function demoteToStudentAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await demoteToStudent(user, id);
  revalidatePath("/people");
  revalidatePath("/draft");
}
