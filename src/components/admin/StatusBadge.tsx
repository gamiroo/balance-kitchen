// components/admin/StatusBadge.tsx
import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "order" | "user" | "menu" | "pack";
}

export default function StatusBadge({ status, type = "order" }: StatusBadgeProps) {
  const getStatusStyle = () => {
    switch (type) {
      case "order":
        switch (status.toLowerCase()) {
          case "pending": return "bg-yellow-100 text-yellow-800";
          case "confirmed": return "bg-blue-100 text-blue-800";
          case "delivered": return "bg-green-100 text-green-800";
          case "cancelled": return "bg-red-100 text-red-800";
          default: return "bg-gray-100 text-gray-800";
        }
      case "user":
        return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
      case "menu":
        switch (status.toLowerCase()) {
          case "active": return "bg-green-100 text-green-800";
          case "scheduled": return "bg-blue-100 text-blue-800";
          case "expired": return "bg-gray-100 text-gray-800";
          case "draft": return "bg-yellow-100 text-yellow-800";
          default: return "bg-gray-100 text-gray-800";
        }
      case "pack":
        return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
