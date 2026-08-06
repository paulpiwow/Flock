import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Group, Hall, User } from "@prisma/client";

// hall is null while a user is PENDING (signed up, not yet bound to a hall).
export type CurrentUser = User & { hall: Hall | null; group: Group | null };
// A user guaranteed to be bound to a hall (past the pending gate).
export type ActiveUser = CurrentUser & { hall: Hall; hallId: string };

/** Resolve a hall from a join code (the credential that binds membership). */
async function hallFromCode(code: unknown): Promise<Hall | null> {
  const joinCode = String(code ?? "").trim().toUpperCase();
  if (!joinCode) return null;
  return prisma.hall.findUnique({ where: { joinCode } });
}

/**
 * Resolve the signed-in Supabase user to our app User row, creating it on
 * first login (id mirrors the Supabase auth uid). New users bind to a hall via
 * the join code they entered at signup; without a valid code they are PENDING
 * (hallId null) and see nothing until they join. Returns null if signed out.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { hall: true, group: true },
  });
  if (existing) return existing;

  // First login for this account — create the app User row.
  const username =
    (authUser.user_metadata?.username as string | undefined)?.trim() ||
    authUser.email.split("@")[0];
  // Bind by the join code entered at signup. Forging this only ever binds to a
  // hall whose secret code you already know, so the code stays the real gate.
  const hall = await hallFromCode(authUser.user_metadata?.hallCode);

  try {
    return await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        username,
        role: "MEMBER",
        hallId: hall?.id ?? null,
      },
      include: { hall: true, group: true },
    });
  } catch (e) {
    // A concurrent first-login request may have created it already (P2002).
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const created = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { hall: true, group: true },
      });
      if (created) return created;
    }
    throw e;
  }
});

/** Redirects to login when signed out. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

/**
 * The main guard for app pages: signed in AND bound to a hall AND active.
 * Pending users are sent to /join; deactivated users are signed back out.
 */
export async function requireActiveUser(): Promise<ActiveUser> {
  const user = await requireUser();
  if (!user.isActive) redirect("/");
  if (!user.hall || !user.hallId) redirect("/join");
  return user as ActiveUser;
}
