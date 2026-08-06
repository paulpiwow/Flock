"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { promoteToCgl, demoteToStudent } from "@/lib/people";

export async function promoteToCglAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await promoteToCgl(user, id);
  revalidatePath("/people");
  revalidatePath("/draft");
}

export async function demoteToStudentAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await demoteToStudent(user, id);
  revalidatePath("/people");
  revalidatePath("/draft");
}
