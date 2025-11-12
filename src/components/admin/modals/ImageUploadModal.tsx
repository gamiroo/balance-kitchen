// components/admin/modals/ImageUploadModal.tsx
"use client";

import { useState, useRef } from "react";
import AdminModal from "./AdminModal";
import Image from "next/image";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (imageUrl: string) => void;
  currentImage?: string;
  title?: string;
}

export default function ImageUploadModal({ 
  isOpen, 
  onClose, 
  onUpload,
  currentImage,
  title = "Upload Image"
}: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // In a real implementation, you would upload to your storage service
      // For now, we'll simulate the upload and return a mock URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock URL - replace with actual upload logic
      const mockUrl = previewUrl || URL.createObjectURL(selectedFile);
      onUpload(mockUrl);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          {previewUrl && (
            <div className="flex justify-center">
              <Image
                src={previewUrl} 
                alt="Preview" 
                className="max-h-64 rounded-lg object-contain"
                width={256}
                height={256}
                loading="lazy"
              />
            </div>
          )}
          
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <label className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-blue-500">
                <span>Choose File</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="sr-only" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
            
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="ml-4 inline-flex items-center px-3 py-1 border border-gray-600 text-sm font-medium rounded-md text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
              >
                Remove
              </button>
            )}
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : "Upload Image"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
