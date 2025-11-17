/** @jest-environment jsdom */
// components/admin/modals/confirmation-modal/ConfirmationModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from './ConfirmationModal';
import '@testing-library/jest-dom';

// Mock the AdminModal component to isolate testing
jest.mock('../admin-modal/AdminModal', () => {
  return function MockAdminModal({ 
    isOpen, 
    onClose, 
    title, 
    children,
    size 
  }: any) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="admin-modal" className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm"></div>
          <div className={`relative transform overflow-hidden rounded-lg bg-gray-900 text-left shadow-xl transition-all sm:w-full ${size === 'sm' ? 'max-w-md' : 'max-w-xl'}`}>
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={onClose}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="bg-gray-900 px-4 py-5 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };
});

describe('ConfirmationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    expect(screen.queryByText('Are you sure you want to proceed?')).not.toBeInTheDocument();
  });

  it('should render with correct title and message', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should render default confirm and cancel buttons', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render custom confirm and cancel button text', () => {
    render(
      <ConfirmationModal 
        {...defaultProps} 
        confirmText="Yes, Delete" 
        cancelText="No, Keep" 
      />
    );
    
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should apply default confirm button styling', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-500');
  });

  it('should apply custom confirm button styling', () => {
    render(
      <ConfirmationModal 
        {...defaultProps} 
        confirmButtonClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" 
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'focus:ring-blue-500');
  });

  it('should disable confirm button when isDeleting is true', () => {
    render(<ConfirmationModal {...defaultProps} isDeleting={true} />);
    
    const confirmButton = screen.getByText('Deleting...');
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveClass('opacity-75', 'cursor-not-allowed');
  });

  it('should enable confirm button when isDeleting is false', () => {
    render(<ConfirmationModal {...defaultProps} isDeleting={false} />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).not.toBeDisabled();
    expect(confirmButton).not.toHaveClass('opacity-75', 'cursor-not-allowed');
  });

  it('should show loading spinner when isDeleting is true', () => {
    render(<ConfirmationModal {...defaultProps} isDeleting={true} />);
    
    const confirmButton = screen.getByText('Deleting...');
    expect(confirmButton).toBeInTheDocument();
    
    // Check for spinner SVG
    const spinner = confirmButton.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should not show loading spinner when isDeleting is false', () => {
    render(<ConfirmationModal {...defaultProps} isDeleting={false} />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeInTheDocument();
    
    // Check that spinner is not present
    const spinner = confirmButton.querySelector('svg.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  it('should render with small size by default', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-md');
  });

  it('should render with correct styling classes', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
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
      'focus:outline-none', 
      'focus:ring-2', 
      'focus:ring-blue-500'
    );
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass(
      'inline-flex', 
      'justify-center', 
      'rounded-md', 
      'border', 
      'border-transparent', 
      'px-4', 
      'py-2', 
      'text-sm', 
      'font-medium', 
      'text-white', 
      'shadow-sm', 
      'focus:outline-none', 
      'focus:ring-2', 
      'focus:ring-offset-2', 
      'focus:ring-offset-gray-900'
    );
  });

  it('should render message with correct text color', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const messageElement = screen.getByText('Are you sure you want to proceed?');
    expect(messageElement).toHaveClass('text-gray-300');
  });

  it('should render buttons in correct container with flex layout', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const buttonContainer = document.querySelector('.flex.justify-end');
    expect(buttonContainer).toBeInTheDocument();
    expect(buttonContainer).toHaveClass('flex', 'justify-end', 'space-x-3');
  });

  it('should handle empty title', () => {
    render(<ConfirmationModal {...defaultProps} title="" />);
    
    const titleElement = document.querySelector('h3');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('');
  });

  it('should handle empty message', () => {
    render(<ConfirmationModal {...defaultProps} message="" />);
    
    // Get the message element directly instead of by text content
    const messageElement = document.querySelector('.text-gray-300');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent('');
  });

  it('should handle complex message content', () => {
    render(
      <ConfirmationModal 
        {...defaultProps} 
        message="This action cannot be undone. All data will be permanently deleted." 
      />
    );
    
    expect(screen.getByText('This action cannot be undone. All data will be permanently deleted.')).toBeInTheDocument();
  });

  it('should handle special characters in title and message', () => {
    render(
      <ConfirmationModal 
        {...defaultProps} 
        title="Delete Item & Confirm" 
        message="Are you sure? This will delete $100 worth of items!" 
      />
    );
    
    expect(screen.getByText('Delete Item & Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure? This will delete $100 worth of items!')).toBeInTheDocument();
  });

  it('should handle long title and message text', () => {
    const longTitle = 'This is a very long confirmation title that might cause layout issues';
    const longMessage = 'This is a very long confirmation message that explains in detail what will happen when the user confirms this action. It should wrap properly and not break the layout.';
    
    render(
      <ConfirmationModal 
        {...defaultProps} 
        title={longTitle} 
        message={longMessage} 
      />
    );
    
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should maintain button order (cancel then confirm)', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // The last button should be the confirm button (since close button is first in AdminModal)
    const confirmButton = buttons[buttons.length - 1];
    const cancelButton = buttons[buttons.length - 2];
    
    expect(cancelButton).toHaveTextContent('Cancel');
    expect(confirmButton).toHaveTextContent('Confirm');
  });

  it('should not call any handlers when modal is closed', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    
    // Try to click buttons - should not be possible since modal is not rendered
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should handle rapid state changes', () => {
    const { rerender } = render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    
    rerender(<ConfirmationModal {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    
    rerender(<ConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should render with correct space-y-6 class', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    const container = document.querySelector('.space-y-6');
    expect(container).toBeInTheDocument();
  });

  it('should handle multiple modals with different props', () => {
    const mockOnConfirm2 = jest.fn();
    
    render(
      <>
        <ConfirmationModal 
          {...defaultProps} 
          title="First Modal" 
          message="First message" 
        />
        <ConfirmationModal 
          {...defaultProps} 
          isOpen={true} 
          onConfirm={mockOnConfirm2} 
          title="Second Modal" 
          message="Second message" 
          confirmText="Delete" 
          cancelText="Keep" 
        />
      </>
    );
    
    expect(screen.getByText('First Modal')).toBeInTheDocument();
    expect(screen.getByText('Second Modal')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });
});
