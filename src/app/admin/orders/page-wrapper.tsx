// app/admin/orders/page-wrapper.tsx
import { isAdmin } from "../../../lib/auth/admin";
import { redirect } from "next/navigation";
import AdminOrdersPageClient from "./page-client";

export default async function AdminOrdersPageWrapper() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }

  return <AdminOrdersPageClient />;
}
