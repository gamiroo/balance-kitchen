/** @jest-environment jsdom */
/* eslint-disable @next/next/no-img-element */
// components/admin/modals/image-upload-modal/ImageUploadModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import type { ReactNode } from 'react';
import ImageUploadModal from './ImageUploadModal';
import '@testing-library/jest-dom';

// Mock URL.createObjectURL for tests
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');

// Mock Next.js Image component
interface MockNextImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    width,
    height,
    className,
  }: MockNextImageProps) {
    return (
      <img
        src={typeof src === 'string' ? src : String(src)}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  };
});

// Mock the AdminModal component to isolate testing
type AdminModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface MockAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: AdminModalSize;
}

jest.mock('../admin-modal/AdminModal', () => {
  return function MockAdminModal({
    isOpen,
    onClose,
    title,
    children,
    size,
  }: MockAdminModalProps) {
    if (!isOpen) return null;

    return (
      <div
        data-testid="admin-modal"
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
          <div
            className={`relative transform overflow-hidden rounded-lg bg-gray-900 text-left shadow-xl transition-all sm:w-full ${
              size === 'md' ? 'max-w-xl' : 'max-w-md'
            }`}
          >
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-semibold text-white"
                  data-testid="modal-title"
                >
                  {title}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={onClose}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="bg-gray-900 px-4 py-5 sm:p-6">{children}</div>
          </div>
        </div>
      </div>
    );
  };
});

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onload: null as
    | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
    | null,
  result: 'data:image/png;base64,dummy content',
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockFileReader),
});

describe('ImageUploadModal', () => {
  const mockOnClose = jest.fn();
  const mockOnUpload = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onUpload: mockOnUpload,
    title: 'Upload Image',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.URL.createObjectURL as jest.Mock).mockClear();
    mockFileReader.readAsDataURL.mockClear();
  });

  it('should render modal when isOpen is true', () => {
    render(<ImageUploadModal {...defaultProps} />);

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Upload Image');
    expect(screen.getByText('Choose File')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<ImageUploadModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument();
    expect(screen.queryByText('Choose File')).not.toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<ImageUploadModal {...defaultProps} title="Custom Title" />);

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Custom Title');
  });

  it('should render with default title when no title provided', () => {
    render(<ImageUploadModal {...defaultProps} title={undefined} />);

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Upload Image');
  });

  it('should render file input with correct attributes', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
    expect(fileInput).toHaveClass('sr-only');
  });

  it('should render current image when provided', () => {
    render(
      <ImageUploadModal
        {...defaultProps}
        currentImage="https://example.com/image.jpg"
      />,
    );

    const image = document.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Preview');
  });

  it('should not render image preview when no current image', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const image = document.querySelector('img');
    expect(image).not.toBeInTheDocument();
  });

  it('should show file selection instructions', () => {
    render(<ImageUploadModal {...defaultProps} />);

    expect(
      screen.getByText('PNG, JPG, GIF up to 5MB'),
    ).toBeInTheDocument();
  });

  it('should render cancel and upload buttons', () => {
    render(<ImageUploadModal {...defaultProps} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upload Image' }),
    ).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should disable upload button when no file is selected', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    expect(uploadButton).toBeDisabled();
  });

  it('should show error when non-image file is selected', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const file = new File(['dummy content'], 'test.txt', {
      type: 'text/plain',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.getByText('Please select an image file (JPEG, PNG, GIF)'),
    ).toBeInTheDocument();
  });

  it('should show error when file is too large', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const largeFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)],
      'large.jpg',
      { type: 'image/jpeg' },
    );
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(
      screen.getByText('File size must be less than 5MB'),
    ).toBeInTheDocument();
  });

  it('should show error when trying to upload without selecting file', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    expect(uploadButton).toBeDisabled();
  });

  it('should show loading state when uploading', async () => {
    render(<ImageUploadModal {...defaultProps} />);

    const file = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Simulate FileReader completion
    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });

    await act(async () => {
      fireEvent.click(uploadButton);
    });

    expect(screen.getByText(/Uploading/i)).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();
  });

  it('should show preview when valid image is selected', async () => {
    render(<ImageUploadModal {...defaultProps} />);

    const file = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    const image = document.querySelector('img');
    expect(image).toBeInTheDocument();
  });

  it('should show remove button when image is selected', async () => {
    render(<ImageUploadModal {...defaultProps} />);

    const file = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    expect(
      screen.getByRole('button', { name: 'Remove' }),
    ).toBeInTheDocument();
  });

  it('should remove selected image when remove button is clicked', async () => {
    render(<ImageUploadModal {...defaultProps} />);

    const file = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    const removeButton = screen.getByRole('button', { name: 'Remove' });

    await act(async () => {
      fireEvent.click(removeButton);
    });

    const image = document.querySelector('img');
    expect(image).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove' }),
    ).not.toBeInTheDocument();
  });

  it('should call onUpload with image URL when upload is successful', async () => {
    const freshOnUpload = jest.fn().mockResolvedValue(undefined);
    const freshOnClose = jest.fn();

    render(
      <ImageUploadModal
        {...defaultProps}
        onUpload={freshOnUpload}
        onClose={freshOnClose}
      />,
    );

    const file = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });

    await act(async () => {
      fireEvent.click(uploadButton);
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    expect(freshOnUpload).toHaveBeenCalledTimes(1);
    expect(freshOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show error when upload fails', async () => {
    const mockOnUploadError = jest
      .fn()
      .mockRejectedValue(new Error('Upload failed'));

    render(
      <ImageUploadModal {...defaultProps} onUpload={mockOnUploadError} />,
    );

    const file = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });

    await act(async () => {
      fireEvent.click(uploadButton);
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    expect(
      screen.getByText('Failed to upload image. Please try again.'),
    ).toBeInTheDocument();
  });

  it('should render with medium size by default', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-xl');
  });

  it('should render with correct styling classes', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const chooseFileLabel = screen.getByText('Choose File').closest('label');
    expect(chooseFileLabel).toHaveClass(
      'relative',
      'cursor-pointer',
      'bg-gray-700',
      'rounded-md',
      'font-medium',
      'text-blue-400',
      'hover:text-blue-300',
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveClass(
      'inline-flex',
      'justify-center',
      'rounded-md',
      'border',
      'border-gray-600',
      'bg-gray-700',
      'px-4',
      'py-2',
      'text-sm',
      'font-medium',
      'text-gray-300',
      'hover:bg-gray-600',
    );

    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    expect(uploadButton).toHaveClass(
      'inline-flex',
      'justify-center',
      'rounded-md',
      'border',
      'border-transparent',
      'bg-blue-600',
      'px-4',
      'py-2',
      'text-sm',
      'font-medium',
      'text-white',
      'shadow-sm',
      'hover:bg-blue-700',
    );
  });

  it('should render remove button with correct styling', async () => {
    render(<ImageUploadModal {...defaultProps} />);

    const file = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    expect(removeButton).toHaveClass(
      'ml-4',
      'inline-flex',
      'items-center',
      'px-3',
      'py-1',
      'border',
      'border-gray-600',
      'text-sm',
      'font-medium',
      'rounded-md',
      'text-red-400',
      'hover:text-red-300',
    );
  });

  it('should handle empty currentImage prop', () => {
    render(<ImageUploadModal {...defaultProps} currentImage="" />);

    const image = document.querySelector('img');
    expect(image).not.toBeInTheDocument();
  });

  it('should handle special characters in title', () => {
    render(
      <ImageUploadModal
        {...defaultProps}
        title="Upload Image & Confirm"
      />,
    );

    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Upload Image & Confirm',
    );
  });

  it('should maintain button order (cancel then upload)', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons[buttons.length - 2];
    const uploadButton = buttons[buttons.length - 1];

    expect(cancelButton).toHaveTextContent('Cancel');
    expect(uploadButton).toHaveTextContent('Upload Image');
  });

  it('should clear error when new file is selected', async () => {
    render(<ImageUploadModal {...defaultProps} />);

    const textFile = new File(['dummy content'], 'test.txt', {
      type: 'text/plain',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [textFile] } });
    });

    expect(
      screen.getByText('Please select an image file (JPEG, PNG, GIF)'),
    ).toBeInTheDocument();

    const imageFile = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [imageFile] } });
    });

    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload.call(
          {} as FileReader,
          {} as ProgressEvent<FileReader>,
        );
      }
    });

    expect(
      screen.queryByText('Please select an image file (JPEG, PNG, GIF)'),
    ).not.toBeInTheDocument();
  });

  it('should render with correct space-y-6 class', () => {
    render(<ImageUploadModal {...defaultProps} />);

    const container = document.querySelector('.space-y-6');
    expect(container).toBeInTheDocument();
  });

  it('should handle rapid open/close cycles', () => {
    const { rerender } = render(
      <ImageUploadModal {...defaultProps} isOpen={false} />,
    );

    expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument();

    rerender(<ImageUploadModal {...defaultProps} isOpen={true} />);
    expect(screen.getByTestId('modal-title')).toBeInTheDocument();

    rerender(<ImageUploadModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument();
  });

  it('should render image preview with correct styling', () => {
    render(
      <ImageUploadModal
        {...defaultProps}
        currentImage="https://example.com/image.jpg"
      />,
    );

    const image = document.querySelector('img');
    expect(image).toHaveClass(
      'max-h-64',
      'rounded-lg',
      'object-contain',
    );
  });

  it('should handle multiple modals with different props', () => {
    const mockOnUpload2 = jest.fn();

    render(
      <>
        <ImageUploadModal
          {...defaultProps}
          title="First Modal"
          currentImage="https://example.com/image1.jpg"
        />
        <ImageUploadModal
          {...defaultProps}
          isOpen
          onUpload={mockOnUpload2}
          title="Second Modal"
          currentImage="https://example.com/image2.jpg"
        />
      </>,
    );

    expect(screen.getByText('First Modal')).toBeInTheDocument();
    expect(screen.getByText('Second Modal')).toBeInTheDocument();
  });
});
