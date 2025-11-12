// app/admin/users/page-client.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "../../../components/admin/DataTable.client";
import StatusBadge from "../../../components/admin/StatusBadge";
import SearchFilter from "../../../components/admin/SearchFilter";
import { useAdminData } from "../../../hooks/useAdminData";

// Define types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  total_orders: number;
  total_spent: number;
  [key: string]: unknown; // For additional properties
}

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "boolean";
  options?: { value: string; label: string }[];
}

export default function AdminUsersPageClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Build API URL with search term
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    return `/api/admin/users?${params.toString()}`;
  };

  const { data: users, loading, error, refetch } = useAdminData<User[]>(buildApiUrl());

  const columns = [
    {
      key: "name",
      title: "Name",
      sortable: true
    },
    {
      key: "email",
      title: "Email",
      sortable: true
    },
    {
      key: "role",
      title: "Role",
      render: (value: unknown) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          String(value) === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
        }`}>
          {String(value || 'user')}
        </span>
      )
    },
    {
      key: "is_active",
      title: "Status",
      render: (value: unknown) => (
        <StatusBadge status={value ? "active" : "inactive"} type="user" />
      )
    },
    {
      key: "total_orders",
      title: "Orders",
      render: (value: unknown) => {
        const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
        return numValue;
      },
      sortable: true
    },
    {
      key: "total_spent",
      title: "Spent",
      render: (value: unknown) => {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        return `$${numValue.toFixed(2)}`;
      },
      sortable: true
    }
  ];

  const actions = [
    {
      label: "View",
      onClick: (row: User) => {
        router.push(`/admin/users/${row.id}`);
      }
    },
    {
      label: "Edit Role",
      onClick: (row: User) => {
        console.log("Edit role for user", row.id);
        // You would make an API call here
      },
      className: "text-blue-600 hover:text-blue-900"
    }
  ];

  const handleSearch = (newFilters: Record<string, unknown>) => {
    setSearchTerm(newFilters.search as string || "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800">Error Loading Users</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={() => handleSearch({ search: searchTerm })}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </div>

      <SearchFilter
        onSearch={handleSearch}
        filters={[
          {
            key: "role",
            label: "Role",
            type: "select",
            options: [
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" }
            ]
          },
          {
            key: "active",
            label: "Active",
            type: "boolean"
          }
        ] as FilterOption[]}
      />

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">User Management</h2>
        </div>
        <div className="p-6">
          <DataTable<User>
            data={users || []}
            columns={columns}
            actions={actions}
            onRowClick={(row: User) => {
              router.push(`/admin/users/${row.id}`);
            }}
            emptyState={{
              title: "No users found",
              description: "Users will appear here once they register.",
              action: {
                label: "Invite User",
                href: "#"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
