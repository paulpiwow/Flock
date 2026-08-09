"use server";

import { z } from "zod";
import { requireActiveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Save/refresh this device's push subscription, tied to the current user. */
const subSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await requireActiveUser();
  const parsed = subSchema.safeParse(sub);
  if (!parsed.success) return { ok: false, error: "Invalid subscription." };

  const { endpoint, p256dh, auth } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id, p256dh, auth },
    create: { endpoint, p256dh, auth, userId: user.id },
  });
  return { ok: true };
}

/** Remove this device's subscription (user turned notifications off). */
export async function removePushSubscription(
  endpoint: string,
): Promise<{ ok: boolean }> {
  await requireActiveUser();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
  return { ok: true };
}
