// components/admin/SearchFilter.tsx
"use client";

import { useState } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "boolean";
  options?: FilterOption[];
}

interface SearchFilterProps {
  onSearch: (filters: Record<string, unknown>) => void;
  filters: FilterConfig[];
  defaultValues?: Record<string, unknown>;
}

export default function SearchFilter({ onSearch, filters, defaultValues = {} }: SearchFilterProps) {
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(defaultValues);

  const handleInputChange = (key: string, value: unknown) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filterValues);
  };

  const handleReset = () => {
    setFilterValues({});
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            <label htmlFor={filter.key} className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            {filter.type === "text" && (
              <input
                type="text"
                id={filter.key}
                value={(filterValues[filter.key] as string) || ""}
                onChange={(e) => handleInputChange(filter.key, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={`Search ${filter.label.toLowerCase()}...`}
              />
            )}
            {filter.type === "select" && (
              <select
                id={filter.key}
                value={(filterValues[filter.key] as string) || ""}
                onChange={(e) => handleInputChange(filter.key, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {filter.type === "boolean" && (
              <select
                id={filter.key}
                value={filterValues[filter.key] === undefined ? "" : String(filterValues[filter.key])}
                onChange={(e) => {
                  const value = e.target.value === "" ? "" : e.target.value === "true";
                  handleInputChange(filter.key, value === "" ? undefined : value);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            )}
            {filter.type === "date" && (
              <input
                type="date"
                id={filter.key}
                value={(filterValues[filter.key] as string) || ""}
                onChange={(e) => handleInputChange(filter.key, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
}
