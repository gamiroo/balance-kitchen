// app/admin/dashboard/page.tsx
import { isAdmin } from "../../../lib/auth/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatusBadge from "../../../components/admin/StatusBadge";
import SimpleChart from "../../../components/admin/charts/SimpleChart";

// Mock data
const mockStats = {
  users: { total_users: 1247, active_users: 1189, admin_count: 3 },
  orders: { total_orders: 342, total_revenue: 12847.50, pending_orders: 23, confirmed_orders: 45, delivered_orders: 274 },
  menus: { total_menus: 24, published_menus: 18, active_menus: 2 },
  packs: { total_pack_sales: 156, pack_revenue: 4230.00 }
};

const mockRecentOrders = [
  { id: "1", user_name: "John Doe", order_date: "2023-12-15", total_price: 45.99, status: "delivered" },
  { id: "2", user_name: "Jane Smith", order_date: "2023-12-15", total_price: 32.50, status: "confirmed" },
  { id: "3", user_name: "Bob Johnson", order_date: "2023-12-14", total_price: 58.75, status: "pending" },
  { id: "4", user_name: "Alice Brown", order_date: "2023-12-14", total_price: 27.30, status: "delivered" },
  { id: "5", user_name: "Charlie Wilson", order_date: "2023-12-13", total_price: 41.20, status: "delivered" }
];

const mockMenuStatus = [
  { id: "1", week_start_date: "2023-12-18", week_end_date: "2023-12-24", is_published: true, status: "Active" },
  { id: "2", week_start_date: "2023-12-25", week_end_date: "2023-12-31", is_published: true, status: "Scheduled" },
  { id: "3", week_start_date: "2023-12-11", week_end_date: "2023-12-17", is_published: true, status: "Expired" },
  { id: "4", week_start_date: "2024-01-01", week_end_date: "2024-01-07", is_published: false, status: "Draft" }
];

export default async function AdminDashboardPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your admin dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SimpleChart 
          title="Total Users" 
          value={mockStats.users.total_users} 
          icon="👥" 
        />
        <SimpleChart 
          title="Total Orders" 
          value={mockStats.orders.total_orders} 
          icon="📋" 
        />
        <SimpleChart 
          title="Revenue" 
          value={`$${mockStats.orders.total_revenue.toFixed(2)}`} 
          icon="💰" 
        />
        <SimpleChart 
          title="Active Menus" 
          value={mockStats.menus.active_menus} 
          icon="🍽️" 
        />
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockRecentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{order.user_name}</p>
                    <p className="text-sm text-gray-500">{new Date(order.order_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${order.total_price.toFixed(2)}</p>
                    <StatusBadge status={order.status} type="order" />
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/admin/orders" 
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all orders →
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Menu Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockMenuStatus.map((menu) => (
                <div key={menu.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(menu.week_start_date).toLocaleDateString()} - {new Date(menu.week_end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={menu.status} type="menu" />
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/admin/menus" 
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Manage menus →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin/menus/create"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🍽️</span>
                <div>
                  <div className="font-medium text-gray-900">Create Menu</div>
                  <div className="text-sm text-gray-500">Weekly menu planning</div>
                </div>
              </div>
            </Link>
            <Link 
              href="/admin/packs/create"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📦</span>
                <div>
                  <div className="font-medium text-gray-900">Create Pack</div>
                  <div className="text-sm text-gray-500">Meal pack templates</div>
                </div>
              </div>
            </Link>
            <Link 
              href="/admin/orders"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <div className="font-medium text-gray-900">View Orders</div>
                  <div className="text-sm text-gray-500">Order management</div>
                </div>
              </div>
            </Link>
            <Link 
              href="/admin/users"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <div className="font-medium text-gray-900">Manage Users</div>
                  <div className="text-sm text-gray-500">User accounts</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
