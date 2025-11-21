// app/admin/users/[id]/page.tsx
import { isAdmin } from "@/shared/lib/auth/admin";
import { redirect } from "next/navigation";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        <p className="mt-1 text-sm text-gray-500">
          User ID: {params.id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">User Information</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500">User details will appear here.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Edit User
              </button>
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
                Reset Password
              </button>
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                Deactivate User
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Statistics</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500">User statistics will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
