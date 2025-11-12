// components/admin/modals/UserDetailModal.tsx
"use client";

import AdminModal from "./AdminModal";
import StatusBadge from "../StatusBadge";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login?: string;
    total_orders: number;
    total_spent: number;
    meal_balance: number;
  };
  onEditRole?: (userId: string, newRole: string) => void;
  onToggleStatus?: (userId: string, newStatus: boolean) => void;
}

export default function UserDetailModal({ 
  isOpen, 
  onClose, 
  user,
  onEditRole,
  onToggleStatus
}: UserDetailModalProps) {
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onEditRole?.(user.id, e.target.value);
  };

  const handleStatusToggle = () => {
    onToggleStatus?.(user.id, !user.is_active);
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <div className="flex items-center justify-center h-24 w-24 rounded-full bg-gray-700 mx-auto">
              <span className="text-2xl font-bold text-gray-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="sm:col-span-2 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white">{user.name}</h3>
              <p className="text-gray-400">{user.email}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={user.is_active ? "active" : "inactive"} type="user" />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-md font-medium text-white mb-4">Account Information</h4>
          
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-400">Member Since</dt>
              <dd className="mt-1 text-sm text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-400">Last Login</dt>
              <dd className="mt-1 text-sm text-white">
                {user.last_login 
                  ? new Date(user.last_login).toLocaleDateString() 
                  : "Never"}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-400">Total Orders</dt>
              <dd className="mt-1 text-sm text-white">{user.total_orders}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-400">Total Spent</dt>
              <dd className="mt-1 text-sm text-white">${user.total_spent.toFixed(2)}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-400">Meal Balance</dt>
              <dd className="mt-1 text-sm text-white">{user.meal_balance} meals</dd>
            </div>
          </dl>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-md font-medium text-white mb-4">Actions</h4>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-400 mb-1">
                Role
              </label>
              <select
                id="role"
                value={user.role}
                onChange={handleRoleChange}
                className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleStatusToggle}
                className={`w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  user.is_active 
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
                    : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                }`}
              >
                {user.is_active ? "Deactivate User" : "Activate User"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
