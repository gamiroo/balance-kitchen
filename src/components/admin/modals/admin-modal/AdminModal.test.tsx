/** @jest-environment jsdom */
// components/admin/modals/admin-modal/AdminModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import AdminModal from './AdminModal';
import '@testing-library/jest-dom';

describe('AdminModal', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body styles
    document.body.style.overflow = '';
  });

  it('should render modal when isOpen is true', () => {
    render(<AdminModal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<AdminModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should render modal with correct title', () => {
    render(<AdminModal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toHaveClass(
      'text-lg',
      'font-semibold',
      'text-white',
    );
  });

  it('should render children content', () => {
    render(<AdminModal {...defaultProps} />);

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should render close button by default', () => {
    render(<AdminModal {...defaultProps} />);

    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass(
      'text-gray-400',
      'hover:text-white',
      'transition-colors',
    );
  });

  it('should not render close button when showCloseButton is false', () => {
    render(<AdminModal {...defaultProps} showCloseButton={false} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<AdminModal {...defaultProps} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<AdminModal {...defaultProps} />);

    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close modal when content area is clicked', () => {
    render(<AdminModal {...defaultProps} />);

    const contentArea = screen.getByText('Modal Content').closest('div');
    fireEvent.click(contentArea!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when escape key is pressed', () => {
    render(<AdminModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when other keys are pressed', () => {
    render(<AdminModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should apply body overflow hidden when modal is open', () => {
    render(<AdminModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should remove body overflow hidden when modal is closed', () => {
    const { unmount } = render(<AdminModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('should remove event listeners when component unmounts', () => {
    const { unmount } = render(<AdminModal {...defaultProps} />);

    unmount();

    // Try to trigger escape key - should not call onClose
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should apply correct size classes for sm size', () => {
    render(<AdminModal {...defaultProps} size="sm" />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-md');
  });

  it('should apply correct size classes for md size', () => {
    render(<AdminModal {...defaultProps} size="md" />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-xl');
  });

  it('should apply correct size classes for lg size', () => {
    render(<AdminModal {...defaultProps} size="lg" />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-3xl');
  });

  it('should apply correct size classes for xl size', () => {
    render(<AdminModal {...defaultProps} size="xl" />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-5xl');
  });

  it('should apply correct size classes for full size', () => {
    render(<AdminModal {...defaultProps} size="full" />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-7xl', 'mx-4');
  });

  it('should render with default size when no size is provided', () => {
    render(<AdminModal {...defaultProps} size={undefined} />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-xl');
  });

  it('should render with correct styling classes', () => {
    render(<AdminModal {...defaultProps} />);

    const modalWrapper = document.querySelector('.fixed.inset-0.z-50');
    expect(modalWrapper).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'overflow-y-auto',
    );

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass(
      'relative',
      'transform',
      'overflow-hidden',
      'rounded-lg',
      'bg-gray-900',
      'text-left',
      'shadow-xl',
      'transition-all',
    );

    const header = document.querySelector('.bg-gray-800');
    expect(header).toHaveClass(
      'bg-gray-800',
      'px-4',
      'py-3',
      'border-b',
      'border-gray-700',
    );

    const content = document.querySelector('.bg-gray-900.px-4.py-5');
    expect(content).toHaveClass('bg-gray-900', 'px-4', 'py-5');
  });

  it('should handle complex child content', () => {
    render(
      <AdminModal {...defaultProps}>
        <div>
          <h2>Complex Content</h2>
          <p>Paragraph content</p>
          <button>Inner Button</button>
        </div>
      </AdminModal>,
    );

    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    expect(screen.getByText('Inner Button')).toBeInTheDocument();
  });

  it('should handle empty title', () => {
    render(<AdminModal {...defaultProps} title="" />);

    // Get the title element directly instead of by text content
    const titleElement = document.querySelector('h3');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('');
  });

  it('should handle empty children', () => {
    render(
      <AdminModal {...defaultProps}>
        {/* intentionally no children to override default children */}
      </AdminModal>,
    );

    // Should still render the modal shell without content
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('should prevent body scroll when modal opens and restore when closes', () => {
    const { rerender } = render(
      <AdminModal {...defaultProps} isOpen={false} />,
    );

    expect(document.body.style.overflow).toBe('');

    rerender(<AdminModal {...defaultProps} isOpen />);

    expect(document.body.style.overflow).toBe('hidden');

    rerender(<AdminModal {...defaultProps} isOpen={false} />);

    expect(document.body.style.overflow).toBe('');
  });

  it('should handle multiple modals (only one should be active)', () => {
    const mockOnClose2 = jest.fn();

    render(
      <>
        <AdminModal {...defaultProps} />
        <AdminModal
          {...defaultProps}
          isOpen
          onClose={mockOnClose2}
          title="Second Modal"
        />
      </>,
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Second Modal')).toBeInTheDocument();
  });

  it('should apply backdrop blur effect', () => {
    render(<AdminModal {...defaultProps} />);

    const backdrop = document.querySelector('.fixed.inset-0.bg-black');
    expect(backdrop).toHaveClass(
      'bg-black',
      'bg-opacity-70',
      'backdrop-blur-sm',
    );
  });

  it('should render SVG close icon with correct attributes', () => {
    render(<AdminModal {...defaultProps} />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('stroke', 'currentColor');

    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
    expect(path).toHaveAttribute('stroke-linecap', 'round');
    expect(path).toHaveAttribute('stroke-linejoin', 'round');
    expect(path).toHaveAttribute('stroke-width', '2');
  });

  it('should handle rapid open/close cycles', () => {
    const { rerender } = render(
      <AdminModal {...defaultProps} isOpen={false} />,
    );

    expect(document.body.style.overflow).toBe('');

    rerender(<AdminModal {...defaultProps} isOpen />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<AdminModal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');

    rerender(<AdminModal {...defaultProps} isOpen />);
    expect(document.body.style.overflow).toBe('hidden');
  });
});
