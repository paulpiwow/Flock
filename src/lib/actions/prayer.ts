"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveUser } from "@/lib/auth";
import { submitPrayerRequest } from "@/lib/prayer";

export type PrayerState = { ok?: boolean; error?: string };

const schema = z.object({
  body: z.string().trim().min(1, "Write a request first.").max(4000),
});

export async function submitPrayerRequestAction(
  _prev: PrayerState,
  formData: FormData,
): Promise<PrayerState> {
  const user = await requireActiveUser();

  const parsed = schema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  try {
    await submitPrayerRequest(user, parsed.data.body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not send." };
  }

  revalidatePath("/prayer");
  return { ok: true };
}
