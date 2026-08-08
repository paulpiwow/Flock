"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveUser } from "@/lib/auth";
import {
  addResource,
  updateResource,
  deleteResource,
  togglePin,
} from "@/lib/resources";

export type ResourceState = { ok?: boolean; error?: string };

const schema = z.object({
  label: z.string().trim().min(1, "Enter a label."),
  url: z.string().trim().url("Enter a valid URL."),
  audience: z.enum(["ADMIN", "LEADERS", "ALL"]),
  pinned: z.boolean(),
});

export async function addResourceAction(
  _prev: ResourceState,
  formData: FormData,
): Promise<ResourceState> {
  const user = await requireActiveUser();
  const parsed = schema.safeParse({
    label: formData.get("label"),
    url: formData.get("url"),
    audience: formData.get("audience"),
    pinned: formData.get("pinned") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await addResource(user, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not add." };
  }
  revalidatePath("/resources");
  revalidatePath("/home");
  return { ok: true };
}

/** Toggle pin / delete via lightweight form-button actions. */
export async function togglePinAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await togglePin(user, id);
  revalidatePath("/resources");
  revalidatePath("/home");
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteResource(user, id);
  revalidatePath("/resources");
  revalidatePath("/home");
}

export async function updateResourceAction(
  _prev: ResourceState,
  formData: FormData,
): Promise<ResourceState> {
  const user = await requireActiveUser();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    label: formData.get("label"),
    url: formData.get("url"),
    audience: formData.get("audience"),
    pinned: formData.get("pinned") === "on",
  });
  if (!id) return { error: "Missing resource." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await updateResource(user, id, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/resources");
  revalidatePath("/home");
  return { ok: true };
}
