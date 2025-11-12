// app/admin/packs/page-wrapper.tsx
import { isAdmin } from "../../../lib/auth/admin";
import { redirect } from "next/navigation";
import AdminPacksPageClient from "./page-client";

export default async function AdminPacksPageWrapper() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }

  return <AdminPacksPageClient />;
}
