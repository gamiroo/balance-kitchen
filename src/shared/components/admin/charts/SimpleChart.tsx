// components/admin/charts/SimpleChart.tsx
"use client";

export default function SimpleChart({ 
  title, 
  value, 
  change, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  icon: string;
}) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center">
        <div className="rounded-full bg-blue-100 p-3">
          <span className="text-blue-600 text-xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <span className={`ml-2 text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
