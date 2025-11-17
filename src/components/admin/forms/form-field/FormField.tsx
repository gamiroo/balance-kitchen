// components/admin/forms/FormField.tsx
import React from "react";

interface FormFieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export default function FormField({ 
  label, 
  id, 
  children, 
  error, 
  required = false,
  helpText 
}: FormFieldProps) {
  return (
    <div>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
