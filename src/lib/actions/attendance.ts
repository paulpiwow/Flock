"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { selfCheckIn, confirmGroupAttendance } from "@/lib/attendance";

export type ConfirmState = { ok?: boolean; error?: string };

/** Student taps "I'm here". */
export async function selfCheckInAction(): Promise<void> {
  const user = await requireActiveUser();
  await selfCheckIn(user);
  revalidatePath("/attendance");
  revalidatePath("/home");
}

/** CGL confirms their group's roster. `present` = ids of everyone who came. */
export async function confirmAttendanceAction(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const user = await requireActiveUser();
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return { error: "Missing group." };
  const presentIds = formData.getAll("present").map(String);

  try {
    await confirmGroupAttendance(user, groupId, presentIds);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }

  // These all read from confirmed attendance — refresh them too, or they'd
  // keep serving stale numbers after a roster change.
  revalidatePath("/group");
  revalidatePath("/attendance");
  revalidatePath("/trends");
  revalidatePath("/hub");
  revalidatePath("/home");
  return { ok: true };
}
