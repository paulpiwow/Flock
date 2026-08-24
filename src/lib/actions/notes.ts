"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveUser } from "@/lib/auth";
import { upsertWeeklyNote, setWeekPassage, deleteWeek } from "@/lib/notes";

export type SaveState = { ok?: boolean; error?: string };

/** Save the current user's private note for a week. */
export async function saveWeeklyNoteAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await requireActiveUser();
  const weekId = String(formData.get("weekId") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!weekId) return { error: "Missing week." };

  try {
    await upsertWeeklyNote(user, weekId, body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/notes");
  return { ok: true };
}

const passageSchema = z.object({
  weekId: z.string().min(1),
  passageRef: z.string().trim().min(1, "Enter a passage."),
  enduringUrl: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
});

/** RS: set the passage + Enduring Word link for a week. */
export async function setPassageAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await requireActiveUser();
  const parsed = passageSchema.safeParse({
    weekId: formData.get("weekId"),
    passageRef: formData.get("passageRef"),
    enduringUrl: formData.get("enduringUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await setWeekPassage(
      user,
      parsed.data.weekId,
      parsed.data.passageRef,
      parsed.data.enduringUrl,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/notes");
  return { ok: true };
}

/** RS: delete a week (and its attendance + notes). Returns to the current week. */
export async function deleteWeekAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const weekId = String(formData.get("weekId") ?? "");
  if (weekId) await deleteWeek(user, weekId);
  revalidatePath("/notes");
  revalidatePath("/attendance");
  revalidatePath("/trends");
  redirect("/notes");
}

