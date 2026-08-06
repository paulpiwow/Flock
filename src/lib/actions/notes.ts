"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveUser } from "@/lib/auth";
import {
  upsertWeeklyNote,
  setWeekPassage,
  setMemoryVerse,
  createWeek,
} from "@/lib/notes";

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

const verseSchema = z.object({
  weekId: z.string().min(1),
  reference: z.string().trim().min(1, "Enter a reference."),
  text: z.string().trim().min(1, "Enter the verse text."),
});

/** RS: set/update the memory verse (public-domain text only). */
export async function setVerseAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await requireActiveUser();
  const parsed = verseSchema.safeParse({
    weekId: formData.get("weekId"),
    reference: formData.get("reference"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await setMemoryVerse(
      user,
      parsed.data.weekId,
      parsed.data.reference,
      parsed.data.text,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/verse");
  revalidatePath("/notes");
  return { ok: true };
}

/** RS: start a new week (becomes the current week). */
export async function newWeekAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await requireActiveUser();
  const passageRef = String(formData.get("passageRef") ?? "").trim();
  const enduringUrl = String(formData.get("enduringUrl") ?? "").trim() || null;
  if (!passageRef) return { error: "Enter a passage." };

  try {
    await createWeek(user, { passageRef, enduringUrl, date: new Date() });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create." };
  }
  revalidatePath("/notes");
  revalidatePath("/verse");
  return { ok: true };
}
