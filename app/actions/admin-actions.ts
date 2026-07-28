"use server";

import { revalidatePath } from "next/cache";
import { getSessionAdminId } from "@/lib/auth/session";
import { createGroup, deleteGroup } from "@/lib/repositories/groups";
import { getLegacySiteId } from "@/lib/repositories/sites";

async function requireAdminSession() {
  const adminId = await getSessionAdminId();
  if (!adminId) {
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

  const siteId = await getLegacySiteId();
  const group = await createGroup({ siteId, label, guestNames });
  revalidatePath("/admin");
  return group;
}

export async function deleteGroupAction(groupId: string) {
  await requireAdminSession();
  const siteId = await getLegacySiteId();
  await deleteGroup(siteId, groupId);
  revalidatePath("/admin");
}
