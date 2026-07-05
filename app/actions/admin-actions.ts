"use server";

import { revalidatePath } from "next/cache";
import { verifySessionCookie } from "@/lib/auth/session";
import { createGroup, deleteGroup } from "@/lib/repositories/groups";

async function requireAdminSession() {
  const valid = await verifySessionCookie();
  if (!valid) {
    throw new Error("Unauthorized");
  }
}

export async function createGroupAction(formData: FormData) {
  await requireAdminSession();

  const label = formData.get("label")?.toString().trim() || undefined;
  const guestNames = formData
    .getAll("name")
    .map((value) => value.toString().trim())
    .filter(Boolean);

  if (guestNames.length === 0) {
    throw new Error("At least one guest name is required");
  }

  const group = await createGroup({ label, guestNames });
  revalidatePath("/admin");
  return group;
}

export async function deleteGroupAction(groupId: string) {
  await requireAdminSession();
  await deleteGroup(groupId);
  revalidatePath("/admin");
}
