"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fullNameSchema } from "@/lib/names";

export type NameState = { error?: string };

/**
 * One-time "enter your first and last name" prompt. Fills the first/last
 * columns (the app displays and sorts by these, falling back to `username`),
 * which is also what stops the blocking modal in the app layout.
 */
export async function confirmName(
  _prev: NameState,
  formData: FormData,
): Promise<NameState> {
  const user = await requireUser();
  const parsed = fullNameSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { firstName, lastName } = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: { firstName, lastName },
  });

  revalidatePath("/", "layout");
  return {};
}
