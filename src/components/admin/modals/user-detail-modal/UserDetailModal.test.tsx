/** @jest-environment jsdom */
// components/admin/modals/user-detail-modal/UserDetailModal.test.tsx
import React, { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserDetailModal from './UserDetailModal';
import '@testing-library/jest-dom';

// Types for mocks
interface MockAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'lg' | 'md' | 'sm' | 'xl' | 'full';
}

interface MockStatusBadgeProps {
  status: string;
  type: string;
}

// Mock the AdminModal component to isolate testing
jest.mock('../admin-modal/AdminModal', () => {
  const MockAdminModal = ({
    isOpen,
    onClose,
    title,
    children,
    size,
  }: MockAdminModalProps) => {
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
              size === 'lg' ? 'max-w-2xl' : 'max-w-md'
            }`}
          >
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={onClose}
                  aria-label="Close"
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
            <div className="bg-gray-900 px-4 py-5 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return MockAdminModal;
});

// Mock StatusBadge component
jest.mock('../../StatusBadge', () => {
  const MockStatusBadge = ({ status, type }: MockStatusBadgeProps) => (
    <span
      data-testid="status-badge"
      data-status={status}
      data-type={type}
    >
      {status}
    </span>
  );

  return MockStatusBadge;
});

describe('UserDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnEditRole = jest.fn();
  const mockOnToggleStatus = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      is_active: true,
      created_at: '2023-01-15T10:30:00Z',
      last_login: '2023-12-01T14:20:00Z',
      total_orders: 15,
      total_spent: 245.5,
      meal_balance: 8,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<UserDetailModal {...defaultProps} />);

    expect(screen.getByText('User Details')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<UserDetailModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('User Details')).not.toBeInTheDocument();
  });

  it('should render user avatar with first initial', () => {
    render(<UserDetailModal {...defaultProps} />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should render user name and email', () => {
    render(<UserDetailModal {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render status badge with correct status', () => {
    render(<UserDetailModal {...defaultProps} />);

    const statusBadge = screen.getByTestId('status-badge');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveAttribute('data-status', 'active');
    expect(statusBadge).toHaveAttribute('data-type', 'user');
  });

  it('should render role badge with correct styling for user role', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, role: 'user' }}
      />,
    );

    const roleBadge = screen.getByText('user');
    expect(roleBadge).toBeInTheDocument();
    expect(roleBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should render role badge with correct styling for admin role', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, role: 'admin' }}
      />,
    );

    const roleBadge = screen.getByText('admin');
    expect(roleBadge).toBeInTheDocument();
    expect(roleBadge).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('should render account information with formatted dates', () => {
    render(<UserDetailModal {...defaultProps} />);

    expect(screen.getByText('Member Since')).toBeInTheDocument();

    const dateElements = screen.getAllByText((content) =>
      content.includes('2023'),
    );
    expect(dateElements).toHaveLength(2);

    expect(screen.getByText('Last Login')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('$245.50')).toBeInTheDocument();

    expect(screen.getByText('Meal Balance')).toBeInTheDocument();
    expect(screen.getByText('8 meals')).toBeInTheDocument();
  });

  it('should render "Never" for last login when not available', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, last_login: undefined }}
      />,
    );

    expect(screen.getByText('Last Login')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should render role select with correct options and value', () => {
    render(<UserDetailModal {...defaultProps} />);

    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
    expect(roleSelect).toBeInTheDocument();
    expect(roleSelect.value).toBe('user');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('User');
    expect(options[1]).toHaveTextContent('Admin');
  });

  it('should render status toggle button with correct text and styling for active user', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, is_active: true }}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Deactivate User',
    });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('bg-red-600');
  });

  it('should render status toggle button with correct text and styling for inactive user', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, is_active: false }}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Activate User',
    });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('bg-green-600');
  });

  it('should call onEditRole when role is changed', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        onEditRole={mockOnEditRole}
      />,
    );

    const roleSelect = screen.getByLabelText('Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    expect(mockOnEditRole).toHaveBeenCalledTimes(1);
    expect(mockOnEditRole).toHaveBeenCalledWith('user-123', 'admin');
  });

  it('should call onToggleStatus when status toggle button is clicked', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        onToggleStatus={mockOnToggleStatus}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Deactivate User',
    });
    fireEvent.click(toggleButton);

    expect(mockOnToggleStatus).toHaveBeenCalledTimes(1);
    expect(mockOnToggleStatus).toHaveBeenCalledWith('user-123', false);
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        onClose={mockOnClose}
      />,
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onEditRole when not provided', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        onEditRole={undefined}
      />,
    );

    const roleSelect = screen.getByLabelText('Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    expect(mockOnEditRole).not.toHaveBeenCalled();
  });

  it('should not call onToggleStatus when not provided', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        onToggleStatus={undefined}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Deactivate User',
    });
    fireEvent.click(toggleButton);

    expect(mockOnToggleStatus).not.toHaveBeenCalled();
  });

  it('should render with large size', () => {
    render(<UserDetailModal {...defaultProps} />);

    const modalContainer = document.querySelector('.relative.transform');
    expect(modalContainer).toHaveClass('max-w-2xl');
  });

  it('should handle user with no meal balance', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, meal_balance: 0 }}
      />,
    );

    expect(screen.getByText('0 meals')).toBeInTheDocument();
  });

  it('should handle user with zero total spent', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, total_spent: 0 }}
      />,
    );

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('should handle user with no orders', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, total_orders: 0 }}
      />,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render inactive status badge correctly', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, is_active: false }}
      />,
    );

    const statusBadge = screen.getByTestId('status-badge');
    expect(statusBadge).toHaveAttribute('data-status', 'inactive');
  });

  it('should call onEditRole with correct parameters for admin role', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        onEditRole={mockOnEditRole}
      />,
    );

    const roleSelect = screen.getByLabelText('Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    expect(mockOnEditRole).toHaveBeenCalledWith('user-123', 'admin');
  });

  it('should call onEditRole with correct parameters for user role', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, role: 'admin' }}
        onEditRole={mockOnEditRole}
      />,
    );

    const roleSelect = screen.getByLabelText('Role');
    fireEvent.change(roleSelect, { target: { value: 'user' } });

    expect(mockOnEditRole).toHaveBeenCalledWith('user-123', 'user');
  });

  it('should call onToggleStatus with correct parameters for activating user', () => {
    render(
      <UserDetailModal
        {...defaultProps}
        user={{ ...defaultProps.user, is_active: false }}
        onToggleStatus={mockOnToggleStatus}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Activate User',
    });
    fireEvent.click(toggleButton);

    expect(mockOnToggleStatus).toHaveBeenCalledWith('user-123', true);
  });

  it('should render all action buttons and select elements', () => {
    render(<UserDetailModal {...defaultProps} />);

    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Deactivate User' }),
    ).toBeInTheDocument();
  });

  it('should maintain proper grid layout structure', () => {
    render(<UserDetailModal {...defaultProps} />);

    const gridContainers = document.querySelectorAll('.grid');
    expect(gridContainers.length).toBeGreaterThan(0);

    expect(
      screen.getByText('Account Information'),
    ).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
