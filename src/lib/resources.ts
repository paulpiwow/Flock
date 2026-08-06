import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActiveUser } from "@/lib/auth";

/**
 * Resources data layer — the hall's tidy link list. Everyone reads; only the RS
 * edits. Pinned links also surface on Home.
 */

export async function getResources(user: ActiveUser) {
  return prisma.resource.findMany({
    where: { hallId: user.hallId },
    orderBy: [{ pinned: "desc" }, { sort: "asc" }, { createdAt: "asc" }],
  });
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
  input: { label: string; url: string; pinned: boolean },
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
      pinned: input.pinned,
      sort: (last?.sort ?? 0) + 1,
    },
  });
}

export async function updateResource(
  user: ActiveUser,
  id: string,
  input: { label: string; url: string; pinned: boolean },
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
