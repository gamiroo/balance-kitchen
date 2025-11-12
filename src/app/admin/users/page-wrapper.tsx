// app/admin/users/page-wrapper.tsx
import { isAdmin } from "../../../lib/auth/admin";
import { redirect } from "next/navigation";
import AdminUsersPageClient from "./page-client";

export default async function AdminUsersPageWrapper() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }

  return <AdminUsersPageClient />;
}
