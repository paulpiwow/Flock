"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { logOneOnOne } from "@/lib/oneonone";

export type OneOnOneState = { ok?: boolean; error?: string };

/** Log a 1-on-1 with one of the CGL's guys (optional date + note). */
export async function logOneOnOneAction(
  _prev: OneOnOneState,
  formData: FormData,
): Promise<OneOnOneState> {
  const user = await requireActiveUser();
  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) return { error: "Missing guy." };

  const dateStr = String(formData.get("metAt") ?? "").trim();
  const note = String(formData.get("note") ?? "");
  // Parse the date-only input as local noon to avoid TZ day-shift.
  const metAt = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  if (dateStr && Number.isNaN(metAt.getTime())) {
    return { error: "Invalid date." };
  }

  try {
    await logOneOnOne(user, studentId, { metAt, note });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }

  revalidatePath("/one-on-ones");
  revalidatePath("/hub");
  return { ok: true };
}
