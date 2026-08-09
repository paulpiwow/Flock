import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import type { PrayerAudience } from "@prisma/client";
import { displayLastName } from "@/lib/names";
import { sendPushToUsers } from "@/lib/push";

/**
 * Prayer Requests — a one-way channel up the shepherding chain:
 *   Student → their CGL   (audience CGL)
 *   CGL     → the hall RS  (audience RS)
 * The RS is the top of the chain, so they receive but never send.
 * Everything is hall-scoped; a CGL only ever sees their own guys' requests.
 */

/** Which audience a given role's requests are addressed to (null = can't send). */
function audienceForRole(role: ActiveUser["role"]): PrayerAudience | null {
  if (role === "MEMBER") return "CGL";
  if (role === "LEADER") return "RS";
  return null; // ADMIN (RS) is the top — receives only
}

export type PrayerItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: string;
};

export type PrayerData = {
  /** A friendly name for who this user sends to ("Adams" / "your RS"), or null. */
  sendTo: string | null;
  /** Requests addressed to this user (their guys', or their CGLs'). */
  received: PrayerItem[];
  /** Requests this user has sent (most recent first). */
  sent: PrayerItem[];
};

function toItems(
  rows: { id: string; body: string; createdAt: Date; author: { username: string } | null }[],
): PrayerItem[] {
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: r.author?.username ?? "Someone",
  }));
}

export async function getPrayerData(user: ActiveUser): Promise<PrayerData> {
  const hallId = user.hallId;

  // Who does this user send to?
  let sendTo: string | null = null;
  if (user.role === "MEMBER" && user.groupId) {
    const group = await prisma.group.findFirst({
      where: { id: user.groupId, hallId },
      select: { leader: { select: { username: true } } },
    });
    sendTo = group?.leader ? displayLastName(group.leader.username) : "your CGL";
  } else if (user.role === "LEADER") {
    sendTo = "your RS";
  }

  // What does this user receive?
  let received: PrayerItem[] = [];
  if (user.role === "LEADER") {
    const led = await prisma.group.findMany({
      where: { hallId, leaderId: user.id },
      select: { id: true },
    });
    const groupIds = led.map((g) => g.id);
    if (groupIds.length) {
      const rows = await prisma.prayerRequest.findMany({
        where: { hallId, audience: "CGL", author: { groupId: { in: groupIds } } },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { username: true } } },
      });
      received = toItems(rows);
    }
  } else if (user.role === "ADMIN") {
    const rows = await prisma.prayerRequest.findMany({
      where: { hallId, audience: "RS" },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } },
    });
    received = toItems(rows);
  }

  // What has this user sent?
  const sentRows = await prisma.prayerRequest.findMany({
    where: { hallId, authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { username: true } } },
  });
  const sent = toItems(sentRows);

  return { sendTo, received, sent };
}

/** Submit a prayer request up the chain. RS (ADMIN) can't send. */
export async function submitPrayerRequest(user: ActiveUser, body: string) {
  const audience = audienceForRole(user.role);
  if (!audience) throw new Error("Your role doesn't send prayer requests.");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Write a request first.");

  const created = await prisma.prayerRequest.create({
    data: {
      hallId: user.hallId,
      authorId: user.id,
      audience,
      body: trimmed,
    },
  });

  // Notify the recipient tier — student's CGL, or the hall's RS(s). Best-effort.
  try {
    let recipientIds: string[] = [];
    if (audience === "CGL" && user.groupId) {
      const group = await prisma.group.findFirst({
        where: { id: user.groupId, hallId: user.hallId },
        select: { leaderId: true },
      });
      if (group?.leaderId) recipientIds = [group.leaderId];
    } else if (audience === "RS") {
      const admins = await prisma.user.findMany({
        where: { hallId: user.hallId, role: "ADMIN", isActive: true },
        select: { id: true },
      });
      recipientIds = admins.map((a) => a.id);
    }
    await sendPushToUsers(recipientIds, {
      title: "New prayer request",
      body: `${user.username} sent a prayer request.`,
      url: "/prayer",
    });
  } catch {
    /* push is non-fatal */
  }

  return created;
}
