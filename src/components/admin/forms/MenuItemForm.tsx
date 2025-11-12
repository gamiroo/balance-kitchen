// components/admin/forms/MenuItemForm.tsx
"use client";

import { useState } from "react";
import FormContainer from "./FormContainer";
import FormField from "./FormField";

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  ingredients?: string;
  allergens?: string;
}

interface MenuItemFormProps {
  initialData?: MenuItemFormData;
  onSubmit: (data: MenuItemFormData) => void;
  isSubmitting?: boolean;
}

const categories = [
  "Main Course",
  "Appetizer",
  "Salad",
  "Soup",
  "Dessert",
  "Beverage",
  "Side Dish"
];

export default function MenuItemForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false 
}: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    category: initialData?.category || categories[0],
    is_available: initialData?.is_available ?? true,
    image_url: initialData?.image_url || "",
    calories: initialData?.calories || 0,
    protein: initialData?.protein || 0,
    carbs: initialData?.carbs || 0,
    fat: initialData?.fat || 0,
    fiber: initialData?.fiber || 0,
    ingredients: initialData?.ingredients || "",
    allergens: initialData?.allergens || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: string | number | boolean = value;
    
    if (type === "number") {
      newValue = value === "" ? "" : Number(value);
    } else if (name === "is_available") {
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
      newErrors.name = "Item name is required";
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
      title={initialData ? "Edit Menu Item" : "Create New Menu Item"}
      description="Add a new dish to your menu with pricing and nutritional information"
      onSubmit={handleSubmit}
      submitLabel={initialData ? "Update Item" : "Create Item"}
      cancelHref="/admin/menus"
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          label="Item Name"
          id="name"
          error={errors.name}
          required
        >
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Grilled Salmon"
          />
        </FormField>

        <FormField
          label="Category"
          id="category"
        >
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
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

        <FormField
          label="Image URL"
          id="image_url"
          helpText="URL to the item's image"
        >
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="https://example.com/image.jpg"
          />
        </FormField>
      </div>

      <FormField
        label="Description"
        id="description"
        helpText="Detailed description of the menu item"
      >
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Describe the ingredients and preparation..."
        />
      </FormField>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          label="Calories"
          id="calories"
        >
          <input
            type="number"
            id="calories"
            name="calories"
            value={formData.calories}
            onChange={handleChange}
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </FormField>

        <FormField
          label="Protein (g)"
          id="protein"
        >
          <input
            type="number"
            id="protein"
            name="protein"
            value={formData.protein}
            onChange={handleChange}
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </FormField>

        <FormField
          label="Carbs (g)"
          id="carbs"
        >
          <input
            type="number"
            id="carbs"
            name="carbs"
            value={formData.carbs}
            onChange={handleChange}
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </FormField>

        <FormField
          label="Fat (g)"
          id="fat"
        >
          <input
            type="number"
            id="fat"
            name="fat"
            value={formData.fat}
            onChange={handleChange}
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          label="Ingredients"
          id="ingredients"
          helpText="Comma-separated list of ingredients"
        >
          <textarea
            id="ingredients"
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            rows={2}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="ingredient1, ingredient2, ingredient3..."
          />
        </FormField>

        <FormField
          label="Allergens"
          id="allergens"
          helpText="Comma-separated list of allergens"
        >
          <textarea
            id="allergens"
            name="allergens"
            value={formData.allergens}
            onChange={handleChange}
            rows={2}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="allergen1, allergen2, allergen3..."
          />
        </FormField>
      </div>

      <FormField
        label="Available"
        id="is_available"
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_available"
            name="is_available"
            checked={formData.is_available}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
            This item is currently available
          </label>
        </div>
      </FormField>
    </FormContainer>
  );
}
