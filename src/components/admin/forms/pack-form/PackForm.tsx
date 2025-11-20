// components/admin/forms/pack-form/PackForm.tsx
"use client";

import { useState } from "react";
import FormContainer from "../form-container/FormContainer";
import FormField from "../form-field/FormField";

interface PackFormData {
  name: string;
  size: number;
  price: number;
  description: string;
  is_active: boolean;
}

interface PackFormProps {
  initialData?: PackFormData;
  onSubmit: (data: PackFormData) => void;
  isSubmitting?: boolean;
}

export default function PackForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false 
}: PackFormProps) {
  const [formData, setFormData] = useState<PackFormData>({
    name: initialData?.name || "",
    size: initialData?.size || 5,
    price: initialData?.price || 0,
    description: initialData?.description || "",
    is_active: initialData?.is_active ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: string | number | boolean = value;
    
    if (type === "number") {
      newValue = value === "" ? "" : Number(value);
    } else if (name === "is_active") {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
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
    
    if (!formData.name.trim()) {
      newErrors.name = "Pack name is required";
    }
    
    if (formData.size <= 0) {
      newErrors.size = "Pack size must be greater than 0";
    }
    
    if (formData.price < 0) {
      newErrors.price = "Price cannot be negative";
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
      title={initialData ? "Edit Pack Template" : "Create New Pack Template"}
      description="Define a new meal pack template with size and pricing"
      onSubmit={handleSubmit}
      submitLabel={initialData ? "Update Pack" : "Create Pack"}
      cancelHref="/admin/packs"
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          label="Pack Name"
          id="name"
          error={errors.name}
          required
          helpText="A descriptive name for this pack template"
        >
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Family Pack, Weekly Special"
          />
        </FormField>

        <FormField
          label="Pack Size"
          id="size"
          error={errors.size}
          required
          helpText="Number of meals included in this pack"
        >
          <input
            type="number"
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            min="1"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </FormField>

        <FormField
          label="Price ($)"
          id="price"
          error={errors.price}
          required
        >
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="0.00"
          />
        </FormField>
      </div>

      <FormField
        label="Description"
        id="description"
        helpText="Optional description of this pack template"
      >
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Describe what makes this pack special..."
        />
      </FormField>

      <FormField
        label="Active Status"
        id="is_active"
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Make this pack template available for purchase
          </label>
        </div>
      </FormField>
    </FormContainer>
  );
}
