// app/admin/orders/page-client.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "../../../components/admin/DataTable.client";
import StatusBadge from "../../../components/admin/StatusBadge";
import SearchFilter from "../../../components/admin/SearchFilter";
import { useAdminData } from "../../../hooks/useAdminData";

// Define types
interface Order {
  id: string;
  user_name: string;
  user_email: string;
  order_date: string;
  total_meals: number;
  total_price: number;
  status: string;
  [key: string]: unknown; // For additional properties
}

interface FilterState {
  status: string | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
}

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "boolean";
  options?: { value: string; label: string }[];
}

export default function AdminOrdersPageClient() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    status: undefined,
    startDate: undefined,
    endDate: undefined
  });

  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    return `/api/admin/orders?${params.toString()}`;
  };

  const { data: orders, loading, error, refetch } = useAdminData<Order[]>(buildApiUrl());

  const columns = [
    {
      key: "id",
      title: "Order ID",
      sortable: true
    },
    {
      key: "user_name",
      title: "Customer",
      render: (_: unknown, row: Order) => (
        <div>
          <div className="font-medium text-gray-900">{row.user_name}</div>
          <div className="text-gray-500 text-sm">{row.user_email}</div>
        </div>
      )
    },
    {
      key: "order_date",
      title: "Date",
      render: (value: unknown) => {
        if (!value) return 'N/A';
        try {
          return new Date(String(value)).toLocaleDateString();
        } catch {
          return String(value);
        }
      },
      sortable: true
    },
    {
      key: "total_meals",
      title: "Meals",
      render: (value: unknown) => {
        const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
        return `${numValue} meals`;
      }
    },
    {
      key: "total_price",
      title: "Amount",
      render: (value: unknown) => {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        return `$${numValue.toFixed(2)}`;
      },
      sortable: true
    },
    {
      key: "status",
      title: "Status",
      render: (value: unknown) => <StatusBadge status={String(value || 'pending')} type="order" />,
      sortable: true
    }
  ];

  const actions = [
    {
      label: "View",
      onClick: (row: Order) => {
        router.push(`/admin/orders/${row.id}`);
      }
    },
    {
      label: "Update Status",
      onClick: (row: Order) => {
        console.log("Update status for order", row.id);
        // You would make an API call here
      },
      className: "text-blue-600 hover:text-blue-900"
    }
  ];

  const handleSearch = (newFilters: Record<string, unknown>) => {
    setFilters({
      status: newFilters.status as string | undefined,
      startDate: newFilters.startDate as string | undefined,
      endDate: newFilters.endDate as string | undefined
    });
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
        <h3 className="text-lg font-medium text-red-800">Error Loading Orders</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer orders and their status
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Export
          </button>
        </div>
      </div>

      <SearchFilter
        onSearch={handleSearch}
        filters={[
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" }
            ]
          },
          {
            key: "startDate",
            label: "Start Date",
            type: "date"
          },
          {
            key: "endDate",
            label: "End Date",
            type: "date"
          }
        ] as FilterOption[]}
      />

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Order Management</h2>
        </div>
        <div className="p-6">
          <DataTable<Order>
            data={orders || []}
            columns={columns}
            actions={actions}
            onRowClick={(row: Order) => {
              router.push(`/admin/orders/${row.id}`);
            }}
            emptyState={{
              title: "No orders found",
              description: "Orders will appear here once customers place them.",
              action: {
                label: "View Menus",
                href: "/admin/menus"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
