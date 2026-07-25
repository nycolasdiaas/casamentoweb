import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { admins } from "@/lib/db/schema";

export async function getAdminByEmail(email: string) {
  const admin = await db.query.admins.findFirst({
    where: eq(admins.email, email),
  });
  return admin ?? null;
}

export async function getAdminById(id: string) {
  const admin = await db.query.admins.findFirst({
    where: eq(admins.id, id),
  });
  return admin ?? null;
}
