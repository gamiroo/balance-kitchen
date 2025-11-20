// app/admin/menus/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DataTable from "@/shared/components/admin/DataTable.client";
import StatusBadge from "@/shared/components/admin/StatusBadge";
import SearchFilter from "@/shared/components/admin/SearchFilter";
import { useAdminData } from "@/shared/hooks/useAdminData";

// Define types
interface Menu {
  id: string;
  week_start_date: string;
  week_end_date: string;
  created_by_name?: string;
  item_count: number;
  status: string;
  is_published: boolean;
  [key: string]: unknown; // For additional properties
}

interface FilterState {
  published: boolean | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
  [key: string]: unknown; // Add index signature
}

export default function AdminMenusPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    published: undefined,
    startDate: undefined,
    endDate: undefined
  });

  // Handle URL parameters on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const publishedParam = urlParams.get('published');
      const startDateParam = urlParams.get('startDate');
      const endDateParam = urlParams.get('endDate');
      
      setFilters({
        published: publishedParam ? publishedParam === 'true' : undefined,
        startDate: startDateParam || undefined,
        endDate: endDateParam || undefined
      });
    }
  }, []);

  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (filters.published !== undefined) {
      params.append('published', filters.published.toString());
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    return `/api/admin/menus?${params.toString()}`;
  };

  const { data: menus, loading, error, refetch } = useAdminData<Menu[]>(buildApiUrl());

  const columns = [
    {
      key: "week_start_date",
      title: "Week",
      render: (_: unknown, row: Menu) => (
        <div>
          <div className="font-medium text-gray-900">
            {new Date(row.week_start_date).toLocaleDateString()} - {new Date(row.week_end_date).toLocaleDateString()}
          </div>
          {row.created_by_name && (
            <div className="text-sm text-gray-500">by {row.created_by_name}</div>
          )}
        </div>
      )
    },
    {
      key: "item_count",
      title: "Items",
      render: (value: unknown) => `${value || 0} items`
    },
    {
      key: "status",
      title: "Status",
      render: (_: unknown, row: Menu) => (
        <StatusBadge status={row.status || 'Draft'} type="menu" />
      )
    },
    {
      key: "is_published",
      title: "Published",
      render: (value: unknown) => (
        <span className={value ? "text-green-600" : "text-gray-500"}>
          {value ? "Yes" : "No"}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: "Edit",
      onClick: (row: Menu) => {
        router.push(`/admin/menus/${row.id}/edit`);
      }
    },
    {
      label: (row: Menu) => row.is_published ? "Unpublish" : "Publish",
      onClick: (row: Menu) => {
        console.log(row.is_published ? "Unpublish" : "Publish", row.id);
        // You would make an API call here
      },
      className: (row: Menu) => row.is_published ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"
    }
  ];

  const handleSearch = (newFilters: Record<string, unknown>) => {
    // Handle null/undefined values properly
    const publishedValue = newFilters.published;
    let published: boolean | undefined = undefined;
    
    if (publishedValue === 'true') {
      published = true;
    } else if (publishedValue === 'false') {
      published = false;
    }

    setFilters({
      published: published,
      startDate: newFilters.startDate as string | undefined,
      endDate: newFilters.endDate as string | undefined
    });
    
    // Update URL with new filters
    const params = new URLSearchParams();
    if (published !== undefined) {
      params.append('published', published.toString());
    }
    if (newFilters.startDate) {
      params.append('startDate', newFilters.startDate as string);
    }
    if (newFilters.endDate) {
      params.append('endDate', newFilters.endDate as string);
    }
    
    router.push(`/admin/menus?${params.toString()}`);
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
        <h3 className="text-lg font-medium text-red-800">Error Loading Menus</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage weekly menus and their items
          </p>
        </div>
        <Link
          href="/admin/menus/create"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create New Menu
        </Link>
      </div>

      <SearchFilter
        onSearch={handleSearch}
        filters={[
          {
            key: "published",
            label: "Published",
            type: "boolean"
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
        ]}
        defaultValues={filters}
      />

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Weekly Menus</h2>
        </div>
        <div className="p-6">
          <DataTable<Menu>
            data={menus || []}
            columns={columns}
            actions={actions}
            onRowClick={(row: Menu) => {
              router.push(`/admin/menus/${row.id}/edit`);
            }}
            emptyState={{
              title: "No menus found",
              description: "Get started by creating a new weekly menu.",
              action: {
                label: "Create Menu",
                href: "/admin/menus/create"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
