/**
 * @jest-environment jsdom
 */
// components/admin/forms/menu-form/MenuForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MenuForm, {MenuFormData} from './MenuForm';
import '@testing-library/jest-dom';

describe('MenuForm', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create menu form with correct title and description', () => {
    render(<MenuForm {...defaultProps} />);
    
    expect(screen.getByText('Create New Menu')).toBeInTheDocument();
    expect(screen.getByText('Set up a weekly menu with start and end dates')).toBeInTheDocument();
    expect(screen.getByText('Create Menu')).toBeInTheDocument();
  });

  it('should render edit menu form with correct title and description when initialData is provided', () => {
    const initialData = {
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07',
      is_published: true
    };
    
    render(<MenuForm {...defaultProps} initialData={initialData} />);
    
    expect(screen.getByText('Edit Menu')).toBeInTheDocument();
    expect(screen.getByText('Set up a weekly menu with start and end dates')).toBeInTheDocument();
    expect(screen.getByText('Update Menu')).toBeInTheDocument();
  });

  it('should render form fields with correct labels', () => {
    render(<MenuForm {...defaultProps} />);
    
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByText('Publish Menu')).toBeInTheDocument();
  });

  it('should render form fields with correct attributes', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date');
    const endDateInput = document.getElementById('week_end_date');
    const publishCheckbox = document.getElementById('is_published');
    
    expect(startDateInput).toHaveAttribute('type', 'date');
    expect(startDateInput).toHaveAttribute('id', 'week_start_date');
    expect(startDateInput).toHaveAttribute('name', 'week_start_date');
    
    expect(endDateInput).toHaveAttribute('type', 'date');
    expect(endDateInput).toHaveAttribute('id', 'week_end_date');
    expect(endDateInput).toHaveAttribute('name', 'week_end_date');
    
    expect(publishCheckbox).toHaveAttribute('type', 'checkbox');
    expect(publishCheckbox).toHaveAttribute('id', 'is_published');
    expect(publishCheckbox).toHaveAttribute('name', 'is_published');
  });

  it('should render form fields with initial data when provided', () => {
    const initialData = {
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07',
      is_published: true
    };
    
    render(<MenuForm {...defaultProps} initialData={initialData} />);
    
    const startDateInput = document.getElementById('week_start_date') as HTMLInputElement;
    const endDateInput = document.getElementById('week_end_date') as HTMLInputElement;
    const publishCheckbox = document.getElementById('is_published') as HTMLInputElement;
    
    expect(startDateInput.value).toBe('2023-01-01');
    expect(endDateInput.value).toBe('2023-01-07');
    expect(publishCheckbox.checked).toBe(true);
  });

  it('should render form fields with empty values when no initial data', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date') as HTMLInputElement;
    const endDateInput = document.getElementById('week_end_date') as HTMLInputElement;
    const publishCheckbox = document.getElementById('is_published') as HTMLInputElement;
    
    expect(startDateInput.value).toBe('');
    expect(endDateInput.value).toBe('');
    expect(publishCheckbox.checked).toBe(false);
  });

  it('should update form state when start date is changed', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date');
    fireEvent.change(startDateInput!, { target: { value: '2023-01-01' } });
    
    expect(startDateInput).toHaveValue('2023-01-01');
  });

  it('should update form state when end date is changed', () => {
    render(<MenuForm {...defaultProps} />);
    
    const endDateInput = document.getElementById('week_end_date');
    fireEvent.change(endDateInput!, { target: { value: '2023-01-07' } });
    
    expect(endDateInput).toHaveValue('2023-01-07');
  });

  it('should update form state when publish checkbox is toggled', () => {
    render(<MenuForm {...defaultProps} />);
    
    const publishCheckbox = document.getElementById('is_published');
    fireEvent.click(publishCheckbox!);
    
    expect(publishCheckbox).toBeChecked();
    
    fireEvent.click(publishCheckbox!);
    expect(publishCheckbox).not.toBeChecked();
  });

  it('should validate required fields and show error messages', () => {
    render(<MenuForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Create Menu');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Start date is required')).toBeInTheDocument();
    expect(screen.getByText('End date is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate date range and show error when end date is before start date', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date');
    const endDateInput = document.getElementById('week_end_date');
    
    fireEvent.change(startDateInput!, { target: { value: '2023-01-10' } });
    fireEvent.change(endDateInput!, { target: { value: '2023-01-05' } });
    
    const submitButton = screen.getByText('Create Menu');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should clear error when user starts typing in errored field', () => {
    render(<MenuForm {...defaultProps} />);
    
    // Trigger validation
    const submitButton = screen.getByText('Create Menu');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Start date is required')).toBeInTheDocument();
    
    // Start typing in the field
    const startDateInput = document.getElementById('week_start_date');
    fireEvent.change(startDateInput!, { target: { value: '2023-01-01' } });
    
    expect(screen.queryByText('Start date is required')).not.toBeInTheDocument();
  });

  it('should call onSubmit with form data when validation passes', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date');
    const endDateInput = document.getElementById('week_end_date');
    const publishCheckbox = document.getElementById('is_published');
    
    fireEvent.change(startDateInput!, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput!, { target: { value: '2023-01-07' } });
    fireEvent.click(publishCheckbox!);
    
    const submitButton = screen.getByText('Create Menu');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07',
      is_published: true
    });
  });

  it('should show loading state when isSubmitting is true', () => {
    render(<MenuForm {...defaultProps} isSubmitting={true} />);
    
    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });

  it('should not show loading state when isSubmitting is false', () => {
    render(<MenuForm {...defaultProps} isSubmitting={false} />);
    
    const submitButton = screen.getByText('Create Menu');
    expect(submitButton).not.toBeDisabled();
  });

  it('should apply correct styling classes to form elements', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date');
    const endDateInput = document.getElementById('week_end_date');
    const publishCheckbox = document.getElementById('is_published');
    
    expect(startDateInput).toHaveClass(
      'block', 
      'w-full', 
      'rounded-md', 
      'border-gray-300', 
      'shadow-sm', 
      'focus:border-blue-500', 
      'focus:ring-blue-500', 
      'sm:text-sm'
    );
    
    expect(endDateInput).toHaveClass(
      'block', 
      'w-full', 
      'rounded-md', 
      'border-gray-300', 
      'shadow-sm', 
      'focus:border-blue-500', 
      'focus:ring-blue-500', 
      'sm:text-sm'
    );
    
    expect(publishCheckbox).toHaveClass(
      'h-4', 
      'w-4', 
      'text-blue-600', 
      'border-gray-300', 
      'rounded', 
      'focus:ring-blue-500'
    );
  });

  it('should render publish checkbox with correct label text', () => {
    render(<MenuForm {...defaultProps} />);
    
    expect(screen.getByText('Make this menu available to customers')).toBeInTheDocument();
  });

  it('should render form fields in correct layout grid', () => {
    render(<MenuForm {...defaultProps} />);
    
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid-cols-1', 'gap-6', 'sm:grid-cols-2');
  });

  it('should handle empty initial data gracefully', () => {
    render(<MenuForm {...defaultProps} initialData={undefined} />);
    
    const startDateInput = document.getElementById('week_start_date') as HTMLInputElement;
    const endDateInput = document.getElementById('week_end_date') as HTMLInputElement;
    const publishCheckbox = document.getElementById('is_published') as HTMLInputElement;
    
    expect(startDateInput.value).toBe('');
    expect(endDateInput.value).toBe('');
    expect(publishCheckbox.checked).toBe(false);
  });

  it('should handle partial initial data gracefully', () => {
    const partialData: Partial<MenuFormData> = {
      week_start_date: '2023-01-01',
      is_published: true
    };
    
    render(<MenuForm {...defaultProps} initialData={partialData} />);
    
    const startDateInput = document.getElementById('week_start_date') as HTMLInputElement;
    const endDateInput = document.getElementById('week_end_date') as HTMLInputElement;
    const publishCheckbox = document.getElementById('is_published') as HTMLInputElement;
    
    expect(startDateInput.value).toBe('2023-01-01');
    expect(endDateInput.value).toBe('');
    expect(publishCheckbox.checked).toBe(true);
  });

  it('should cancel form and navigate to menus page', () => {
    render(<MenuForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveAttribute('href', '/admin/menus');
  });

  it('should validate and submit form with only start date and end date (publish unchecked)', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date');
    const endDateInput = document.getElementById('week_end_date');
    
    fireEvent.change(startDateInput!, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput!, { target: { value: '2023-01-07' } });
    
    const submitButton = screen.getByText('Create Menu');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07',
      is_published: false
    });
  });

  it('should validate and submit form with all fields filled', () => {
    render(<MenuForm {...defaultProps} />);
    
    const startDateInput = document.getElementById('week_start_date');
    const endDateInput = document.getElementById('week_end_date');
    const publishCheckbox = document.getElementById('is_published');
    
    fireEvent.change(startDateInput!, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput!, { target: { value: '2023-01-07' } });
    fireEvent.click(publishCheckbox!);
    
    const submitButton = screen.getByText('Create Menu');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      week_start_date: '2023-01-01',
      week_end_date: '2023-01-07',
      is_published: true
    });
  });
});

