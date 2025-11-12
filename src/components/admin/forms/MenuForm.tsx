// components/admin/forms/MenuForm.tsx
"use client";

import { useState } from "react";
import FormContainer from "./FormContainer";
import FormField from "./FormField";

interface MenuFormData {
  week_start_date: string;
  week_end_date: string;
  is_published: boolean;
}

interface MenuFormProps {
  initialData?: MenuFormData;
  onSubmit: (data: MenuFormData) => void;
  isSubmitting?: boolean;
}

export default function MenuForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false 
}: MenuFormProps) {
  const [formData, setFormData] = useState<MenuFormData>({
    week_start_date: initialData?.week_start_date || "",
    week_end_date: initialData?.week_end_date || "",
    is_published: initialData?.is_published || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.week_start_date) {
      newErrors.week_start_date = "Start date is required";
    }
    
    if (!formData.week_end_date) {
      newErrors.week_end_date = "End date is required";
    }
    
    if (formData.week_start_date && formData.week_end_date) {
      const startDate = new Date(formData.week_start_date);
      const endDate = new Date(formData.week_end_date);
      
      if (startDate > endDate) {
        newErrors.week_end_date = "End date must be after start date";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <FormContainer
      title={initialData ? "Edit Menu" : "Create New Menu"}
      description="Set up a weekly menu with start and end dates"
      onSubmit={handleSubmit}
      submitLabel={initialData ? "Update Menu" : "Create Menu"}
      cancelHref="/admin/menus"
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          label="Start Date"
          id="week_start_date"
          error={errors.week_start_date}
          required
        >
          <input
            type="date"
            id="week_start_date"
            name="week_start_date"
            value={formData.week_start_date}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </FormField>

        <FormField
          label="End Date"
          id="week_end_date"
          error={errors.week_end_date}
          required
        >
          <input
            type="date"
            id="week_end_date"
            name="week_end_date"
            value={formData.week_end_date}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </FormField>
      </div>

      <FormField
        label="Publish Menu"
        id="is_published"
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_published"
            name="is_published"
            checked={formData.is_published}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
            Make this menu available to customers
          </label>
        </div>
      </FormField>
    </FormContainer>
  );
}
