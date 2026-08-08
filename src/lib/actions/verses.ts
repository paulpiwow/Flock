"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveUser } from "@/lib/auth";
import { addLeaderVerse, addGroupVerse, deleteVerse } from "@/lib/verses";
import { lookupVerse as lookupVerseText } from "@/lib/bible";

export type VerseState = { ok?: boolean; error?: string };

export type VerseLookupResult =
  | { ok: true; reference: string; text: string }
  | { ok: false; error: string };

/** Look up a verse's text by reference (WEB, public domain). No DB writes. */
export async function lookupVerse(
  reference: string,
): Promise<VerseLookupResult> {
  await requireActiveUser();
  try {
    const v = await lookupVerseText(reference);
    return { ok: true, reference: v.reference, text: v.text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lookup failed." };
  }
}

const verseSchema = z.object({
  reference: z.string().trim().min(1, "Enter a reference."),
  text: z.string().trim().min(1, "Enter the verse text."),
});

/** RS adds a verse for the hall's CGLs. */
export async function addLeaderVerseAction(
  _prev: VerseState,
  formData: FormData,
): Promise<VerseState> {
  const user = await requireActiveUser();
  const parsed = verseSchema.safeParse({
    reference: formData.get("reference"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await addLeaderVerse(user, parsed.data.reference, parsed.data.text);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/verse");
  return { ok: true };
}

/** CGL adds a verse for their group's members. */
export async function addGroupVerseAction(
  _prev: VerseState,
  formData: FormData,
): Promise<VerseState> {
  const user = await requireActiveUser();
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return { error: "Missing group." };
  const parsed = verseSchema.safeParse({
    reference: formData.get("reference"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await addGroupVerse(user, groupId, parsed.data.reference, parsed.data.text);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/verse");
  return { ok: true };
}

/** Delete a verse (permission enforced in the data layer). */
export async function deleteVerseAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteVerse(user, id);
  revalidatePath("/verse");
}
