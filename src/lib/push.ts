import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Web Push (VAPID). Sends a notification to every device a user has opted in
 * with, and prunes subscriptions the push service says are gone. Best-effort:
 * a failure here never breaks the action that triggered it.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:flock@liberty.edu";

let ready = false;
function configure(): boolean {
  if (ready) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false; // push not configured — no-op
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  ready = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Send a notification to all opted-in devices of the given users. */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (!configure() || userIds.length === 0) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err: unknown) {
        // 404/410 = subscription no longer valid; drop it so we stop trying.
        const code =
          typeof err === "object" && err !== null && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: s.id } })
            .catch(() => {});
        }
      }
    }),
  );
}
