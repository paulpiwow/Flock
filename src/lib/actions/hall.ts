"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeCode } from "@/lib/codes";

export type JoinState = { error?: string };

/** Bind the current (pending) user to a hall using its join code. */
export async function joinHall(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.hallId) redirect("/home"); // already bound

  const code = normalizeCode(formData.get("hallCode"));
  if (!code) return { error: "Enter your hall code." };

  const hall = await prisma.hall.findUnique({ where: { joinCode: code } });
  if (!hall) {
    return { error: "That hall code isn't right — check with your RS." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { hallId: hall.id },
  });

  redirect("/home");
}
