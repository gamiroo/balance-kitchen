// components/admin/forms/OrderStatusForm.tsx
"use client";

import { useState } from "react";
import FormContainer from "./FormContainer";
import FormField from "./FormField";

interface OrderStatusFormData {
  status: string;
}

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
  onSubmit: (data: OrderStatusFormData) => void;
  isSubmitting?: boolean;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

export default function OrderStatusForm({ 
  orderId,
  currentStatus,
  onSubmit, 
  isSubmitting = false 
}: OrderStatusFormProps) {
  const [formData, setFormData] = useState<OrderStatusFormData>({
    status: currentStatus
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      status: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormContainer
      title="Update Order Status"
      description={`Order #${orderId}`}
      onSubmit={handleSubmit}
      submitLabel="Update Status"
      cancelHref="/admin/orders"
      isSubmitting={isSubmitting}
    >
      <FormField
        label="Status"
        id="status"
        helpText="Select the new status for this order"
      >
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {statusOptions.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.value === currentStatus}
            >
              {option.label}
              {option.value === currentStatus ? " (Current)" : ""}
            </option>
          ))}
        </select>
      </FormField>
    </FormContainer>
  );
}
