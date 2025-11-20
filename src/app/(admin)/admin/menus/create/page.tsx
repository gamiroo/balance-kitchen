// app/admin/menus/create/page.tsx
import { isAdmin } from "@/shared/lib/auth/admin";
import { redirect } from "next/navigation";

export default async function CreateMenuPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Menu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new weekly menu with start and end dates.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Menu Details</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500">Menu creation form will appear here.</p>
        </div>
      </div>
    </div>
  );
}
