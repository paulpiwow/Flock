import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";
import type { ResourceAudience } from "@prisma/client";

/**
 * Resources data layer — the hall's tidy link list. Only the RS edits, and the
 * RS chooses who each link is for:
 *   ADMIN   → just the RS(s)
 *   LEADERS → the RS(s) + CGLs
 *   ALL     → everyone (incl. students)
 * A reader only ever sees links scoped at or below their role.
 */

/** The audiences a given role is allowed to see. */
function visibleAudiences(role: ActiveUser["role"]): ResourceAudience[] {
  if (role === "ADMIN") return ["ADMIN", "LEADERS", "ALL"];
  if (role === "LEADER") return ["LEADERS", "ALL"];
  return ["ALL"];
}

/**
 * Standard Liberty-wide links, shown on every hall. Built into the app (not
 * per-hall rows), so they're always present and can't be accidentally deleted.
 */
const BUILT_IN: { label: string; url: string; audience: ResourceAudience }[] = [
  {
    label: "One-on-One Check-In",
    url: "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jiH4ugKzZUSpk0o5yXJRshDK5r5D3UtJve3R6V86ADBUNkNBUTVLQlowT1M3MUQ1UU5OSUVQMVAxQS4u",
    audience: "ADMIN",
  },
  {
    label: "Partnership Check-In",
    url: "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jiH4ugKzZUSpk0o5yXJRshDK5r5D3UtJve3R6V86ADBUQUhFS0o5VVY1VkFFU0lIOE9ZTktPNk1PUC4u",
    audience: "ADMIN",
  },
  {
    label: "Curfew Sign-Out Form",
    url: "https://apex.liberty.edu/banprd/f?p=357:11:13754120584071",
    audience: "ALL",
  },
];

export type ResourceItem = {
  id: string;
  label: string;
  url: string;
  audience: ResourceAudience;
  builtIn: boolean;
};

export async function getResources(user: ActiveUser): Promise<ResourceItem[]> {
  const audiences = visibleAudiences(user.role);
  const rows = await prisma.resource.findMany({
    where: { hallId: user.hallId, audience: { in: audiences } },
    orderBy: [{ pinned: "desc" }, { sort: "asc" }, { createdAt: "asc" }],
    select: { id: true, label: true, url: true, audience: true },
  });

  const builtIns: ResourceItem[] = BUILT_IN.filter((b) =>
    audiences.includes(b.audience),
  ).map((b, i) => ({ id: `builtin-${i}`, ...b, builtIn: true }));

  return [...builtIns, ...rows.map((r) => ({ ...r, builtIn: false }))];
}

/** Pinned links for the Home screen. */
export async function getPinnedResources(hallId: string) {
  return prisma.resource.findMany({
    where: { hallId, pinned: true },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    take: 3,
  });
}

function assertAdmin(user: ActiveUser) {
  if (user.role !== "ADMIN") throw new Error("Admin only.");
}

export async function addResource(
  user: ActiveUser,
  input: { label: string; url: string; audience: ResourceAudience; pinned: boolean },
) {
  assertAdmin(user);
  const last = await prisma.resource.findFirst({
    where: { hallId: user.hallId },
    orderBy: { sort: "desc" },
    select: { sort: true },
  });
  return prisma.resource.create({
    data: {
      hallId: user.hallId,
      label: input.label,
      url: input.url,
      audience: input.audience,
      pinned: input.pinned,
      sort: (last?.sort ?? 0) + 1,
    },
  });
}

export async function updateResource(
  user: ActiveUser,
  id: string,
  input: { label: string; url: string; audience: ResourceAudience; pinned: boolean },
) {
  assertAdmin(user);
  return prisma.resource.updateMany({
    where: { id, hallId: user.hallId },
    data: input,
  });
}

export async function deleteResource(user: ActiveUser, id: string) {
  assertAdmin(user);
  return prisma.resource.deleteMany({ where: { id, hallId: user.hallId } });
}

export async function togglePin(user: ActiveUser, id: string) {
  assertAdmin(user);
  const r = await prisma.resource.findFirst({
    where: { id, hallId: user.hallId },
    select: { pinned: true },
  });
  if (!r) return;
  return prisma.resource.update({
    where: { id },
    data: { pinned: !r.pinned },
  });
}
