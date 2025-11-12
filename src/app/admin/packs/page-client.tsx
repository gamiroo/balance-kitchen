// app/admin/packs/page-client.tsx
'use client';

import { useRouter } from "next/navigation";
import Link from "next/link";
import DataTable from "../../../components/admin/DataTable.client";
import StatusBadge from "../../../components/admin/StatusBadge";
import { useAdminData } from "../../../hooks/useAdminData";

// Define types
interface PackTemplate {
  id: string;
  name: string;
  size: number;
  price: number;
  sales_count: number;
  is_active: boolean;
  [key: string]: unknown; // For additional properties
}

interface ColumnConfig {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, row: PackTemplate) => React.ReactNode;
}

interface ActionConfig {
  label: string | ((row: PackTemplate) => string);
  onClick: (row: PackTemplate) => void;
  className?: string | ((row: PackTemplate) => string);
}

// Helper functions for safe type conversion
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

const formatCurrency = (value: unknown): string => {
  const num = toNumber(value);
  return `$${num.toFixed(2)}`;
};

const formatMeals = (value: unknown): string => {
  const num = toNumber(value);
  return `${num} meals`;
};

export default function AdminPacksPageClient() {
  const router = useRouter();
  const { data: packTemplates, loading, error, refetch } = useAdminData<PackTemplate[]>('/api/admin/packs/templates');

  const columns: ColumnConfig[] = [
    {
      key: "name",
      title: "Name",
      sortable: true
    },
    {
      key: "size",
      title: "Size",
      render: (value: unknown) => {
        return formatMeals(value);
      }
    },
    {
      key: "price",
      title: "Price",
      render: (value: unknown) => {
        return formatCurrency(value);
      },
      sortable: true
    },
    {
      key: "sales_count",
      title: "Sales",
      render: (value: unknown) => {
        return toNumber(value);
      },
      sortable: true
    },
    {
      key: "is_active",
      title: "Status",
      render: (value: unknown) => (
        <StatusBadge status={(value as boolean) ? "active" : "inactive"} type="pack" />
      )
    }
  ];

  const actions: ActionConfig[] = [
    {
      label: "Edit",
      onClick: (row: PackTemplate) => {
        router.push(`/admin/packs/${row.id}/edit`);
      }
    },
    {
      label: (row: PackTemplate) => row.is_active ? "Deactivate" : "Activate",
      onClick: (row: PackTemplate) => {
        console.log(row.is_active ? "Deactivate" : "Activate", row.id);
        // You would make an API call here
      },
      className: (row: PackTemplate) => row.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"
    }
  ];

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
        <h3 className="text-lg font-medium text-red-800">Error Loading Pack Templates</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Meal Packs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage meal pack templates and track sales
          </p>
        </div>
        <Link
          href="/admin/packs/create"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create New Pack
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pack Templates</h2>
          </div>
          <div className="p-6">
            <DataTable
              data={packTemplates || []}
              columns={columns}
              actions={actions}
              onRowClick={(row: PackTemplate) => {
                router.push(`/admin/packs/${row.id}/edit`);
              }}
              emptyState={{
                title: "No pack templates",
                description: "Create your first meal pack template to get started.",
                action: {
                  label: "Create Pack Template",
                  href: "/admin/packs/create"
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pack Sales</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Pack Sales Data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Sales statistics and reports will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
