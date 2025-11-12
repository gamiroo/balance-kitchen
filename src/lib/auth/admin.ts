// lib/auth/admin.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function isAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  return user?.role === "admin";
}
