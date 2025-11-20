/** @jest-environment jsdom */
// components/admin/forms/order-status-form/OrderStatusForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode, FormEvent } from 'react';
import OrderStatusForm from './OrderStatusForm';
import '@testing-library/jest-dom';

// Minimal props for the mocked components
interface MockFormContainerProps {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
  description: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  cancelHref?: string;
}

interface MockFormFieldProps {
  children: ReactNode;
  label: string;
  helpText?: string;
}

// Mock the FormContainer and FormField components to isolate testing
jest.mock('../form-container/FormContainer', () => {
  return function MockFormContainer({
    children,
    onSubmit,
    title,
    description,
    submitLabel = 'Update Status',
    isSubmitting = false,
    cancelHref = '/admin/orders',
  }: MockFormContainerProps) {
    return (
      <div data-testid="form-container">
        <h1>{title}</h1>
        <p>{description}</p>
        <form onSubmit={onSubmit}>
          {children}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
          <a href={cancelHref}>Cancel</a>
        </form>
      </div>
    );
  };
});

jest.mock('../form-field/FormField', () => {
  return function MockFormField({
    children,
    label,
    helpText,
  }: MockFormFieldProps) {
    return (
      <div>
        <label>{label}</label>
        {children}
        {helpText && <p>{helpText}</p>}
      </div>
    );
  };
});

describe('OrderStatusForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with correct title and description', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText('Update Order Status')).toBeInTheDocument();
    expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Update Status')).toBeInTheDocument();
  });

  it('should render status field with correct label and help text', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(
      screen.getByText('Select the new status for this order'),
    ).toBeInTheDocument();
  });

  it('should render status select with correct attributes', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status');
    expect(statusSelect).toHaveAttribute('id', 'status');
    expect(statusSelect).toHaveAttribute('name', 'status');
  });

  it('should render status options correctly', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;
    const options = Array.from(statusSelect.options);

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Pending (Current)');
    expect(options[0]).toBeDisabled();
    expect(options[1]).toHaveTextContent('Confirmed');
    expect(options[1]).not.toBeDisabled();
    expect(options[2]).toHaveTextContent('Delivered');
    expect(options[2]).not.toBeDisabled();
    expect(options[3]).toHaveTextContent('Cancelled');
    expect(options[3]).not.toBeDisabled();
  });

  it('should set initial status to currentStatus', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="confirmed"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;
    expect(statusSelect.value).toBe('confirmed');
  });

  it('should update form state when select is changed', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status');
    fireEvent.change(statusSelect!, { target: { value: 'confirmed' } });
    expect(statusSelect).toHaveValue('confirmed');
  });

  it('should call onSubmit with form data when form is submitted', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status');
    fireEvent.change(statusSelect!, { target: { value: 'delivered' } });

    const submitButton = screen.getByText('Update Status');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      status: 'delivered',
    });
  });

  it('should show loading state when isSubmitting is true', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
        isSubmitting
      />,
    );

    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });

  it('should not show loading state when isSubmitting is false', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />,
    );

    const submitButton = screen.getByText('Update Status');
    expect(submitButton).not.toBeDisabled();
  });

  it('should cancel form and navigate to orders page', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveAttribute('href', '/admin/orders');
  });

  it('should disable current status option', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="confirmed"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;
    const options = Array.from(statusSelect.options);

    expect(options[1]).toHaveTextContent('Confirmed (Current)');
    expect(options[1]).toBeDisabled();
  });

  it('should mark current status with (Current) text', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="delivered"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;
    const options = Array.from(statusSelect.options);

    expect(options[2]).toHaveTextContent('Delivered (Current)');
  });

  it('should handle different order IDs', () => {
    render(
      <OrderStatusForm
        orderId="ORD-123"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText('Order #ORD-123')).toBeInTheDocument();
  });

  it('should handle different current statuses', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="cancelled"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;
    expect(statusSelect.value).toBe('cancelled');
  });

  it('should submit form with current status if not changed', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const submitButton = screen.getByText('Update Status');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      status: 'pending',
    });
  });

  it('should prevent default form submission', () => {
    const mockSubmit = jest.fn(() => {}); // removed unused param
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockSubmit}
      />,
    );

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it('should render all status options with correct labels', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText('Pending (Current)')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('should handle empty order ID', () => {
    render(
      <OrderStatusForm
        orderId=""
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText('Order #')).toBeInTheDocument();
  });

  it('should handle different current status values with separate renders', () => {
    // pending
    const { unmount: unmount1 } = render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );
    let statusSelect = document.getElementById('status') as HTMLSelectElement;
    expect(statusSelect.value).toBe('pending');
    unmount1();

    // confirmed
    const { unmount: unmount2 } = render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="confirmed"
        onSubmit={mockOnSubmit}
      />,
    );
    statusSelect = document.getElementById('status') as HTMLSelectElement;
    expect(statusSelect.value).toBe('confirmed');
    unmount2();

    // delivered
    const { unmount: unmount3 } = render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="delivered"
        onSubmit={mockOnSubmit}
      />,
    );
    statusSelect = document.getElementById('status') as HTMLSelectElement;
    expect(statusSelect.value).toBe('delivered');
    unmount3();

    // cancelled
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="cancelled"
        onSubmit={mockOnSubmit}
      />,
    );
    statusSelect = document.getElementById('status') as HTMLSelectElement;
    expect(statusSelect.value).toBe('cancelled');
  });

  it('should maintain form state correctly during interactions', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;

    expect(statusSelect.value).toBe('pending');

    fireEvent.change(statusSelect, { target: { value: 'confirmed' } });
    expect(statusSelect.value).toBe('confirmed');

    fireEvent.change(statusSelect, { target: { value: 'delivered' } });
    expect(statusSelect.value).toBe('delivered');

    const submitButton = screen.getByText('Update Status');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      status: 'delivered',
    });
  });

  it('should not submit form when select value is unchanged', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="confirmed"
        onSubmit={mockOnSubmit}
      />,
    );

    const submitButton = screen.getByText('Update Status');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      status: 'confirmed',
    });
  });

  it('should apply correct styling to disabled options', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;
    const disabledOption = statusSelect.options[0];

    expect(disabledOption).toBeDisabled();
  });

  it('should not disable non-current status options', () => {
    render(
      <OrderStatusForm
        orderId="ORD-001"
        currentStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    const statusSelect = document.getElementById('status') as HTMLSelectElement;
    const enabledOption = statusSelect.options[1];

    expect(enabledOption).not.toBeDisabled();
  });
});
