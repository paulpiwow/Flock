"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveUser } from "@/lib/auth";
import { addCareNote } from "@/lib/care";

export type CareNoteState = { ok?: boolean; error?: string };

const schema = z.object({
  studentId: z.string().min(1),
  body: z.string().trim().min(1, "Write a note first.").max(4000),
  tag: z.enum(["PRAYER", "FOLLOW_UP"]).nullable(),
});

export async function addCareNoteAction(
  _prev: CareNoteState,
  formData: FormData,
): Promise<CareNoteState> {
  const user = await requireActiveUser();
  if (user.role === "MEMBER") return { error: "Not authorized." };

  const tagRaw = String(formData.get("tag") ?? "");
  const parsed = schema.safeParse({
    studentId: formData.get("studentId"),
    body: formData.get("body"),
    tag: tagRaw === "PRAYER" || tagRaw === "FOLLOW_UP" ? tagRaw : null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  try {
    await addCareNote(user, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }

  revalidatePath(`/care/${parsed.data.studentId}`);
  revalidatePath("/care");
  return { ok: true };
}
