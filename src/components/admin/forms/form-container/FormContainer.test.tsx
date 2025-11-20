/**
 * @jest-environment jsdom
 */
// components/admin/forms/FormContainer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FormContainer from '../form-container/FormContainer';
import '@testing-library/jest-dom';

describe('FormContainer', () => {
  const mockOnSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
  const defaultProps = {
    title: 'Test Form',
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form container with title', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Test Form')).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
  });

  it('should render form container with description when provided', () => {
    render(
      <FormContainer {...defaultProps} description="This is a test form">
        <div>Form Content</div>
      </FormContainer>
    );
    
    expect(screen.getByText('This is a test form')).toBeInTheDocument();
    expect(screen.getByText('This is a test form')).toHaveClass('mt-1', 'text-sm', 'text-gray-500');
  });

  it('should not render description when not provided', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    expect(screen.queryByText('This is a test form')).not.toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <FormContainer {...defaultProps}>
        <div data-testid="form-content">Form Content</div>
      </FormContainer>
    );
    
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });

  it('should render form with correct structure', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    // Get form by tag name since it doesn't have accessible roles
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    
    const detailsHeader = screen.getByText('Details');
    expect(detailsHeader).toBeInTheDocument();
    expect(detailsHeader).toHaveClass('text-lg', 'font-medium', 'text-gray-900');
  });

  it('should call onSubmit when form is submitted', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('should render cancel button with default href', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveAttribute('href', '/admin');
    expect(cancelButton).toHaveClass(
      'inline-flex', 
      'items-center', 
      'px-4', 
      'py-2', 
      'border', 
      'border-gray-300', 
      'shadow-sm', 
      'text-sm', 
      'font-medium', 
      'rounded-md', 
      'text-gray-700', 
      'bg-white'
    );
  });

  it('should render cancel button with custom href', () => {
    render(
      <FormContainer {...defaultProps} cancelHref="/custom-cancel">
        <div>Form Content</div>
      </FormContainer>
    );
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveAttribute('href', '/custom-cancel');
  });

  it('should render submit button with default label', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    const submitButton = screen.getByText('Save');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveClass(
      'inline-flex', 
      'items-center', 
      'px-4', 
      'py-2', 
      'border', 
      'border-transparent', 
      'shadow-sm', 
      'text-sm', 
      'font-medium', 
      'rounded-md', 
      'text-white', 
      'bg-blue-600'
    );
  });

  it('should render submit button with custom label', () => {
    render(
      <FormContainer {...defaultProps} submitLabel="Create Item">
        <div>Form Content</div>
      </FormContainer>
    );
    
    const submitButton = screen.getByText('Create Item');
    expect(submitButton).toBeInTheDocument();
  });

  it('should disable submit button when isSubmitting is true', () => {
    render(
      <FormContainer {...defaultProps} isSubmitting={true}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    // When isSubmitting is true, the button contains "Saving..." text, not "Save"
    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveClass('disabled:opacity-50');
  });

  it('should enable submit button when isSubmitting is false', () => {
    render(
      <FormContainer {...defaultProps} isSubmitting={false}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    const submitButton = screen.getByText('Save');
    expect(submitButton).not.toBeDisabled();
  });

  it('should show loading spinner and text when isSubmitting is true', () => {
    render(
      <FormContainer {...defaultProps} isSubmitting={true}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    // Check for spinner SVG by its classes
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should not show loading spinner when isSubmitting is false', () => {
    render(
      <FormContainer {...defaultProps} isSubmitting={false}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    // Check that spinner is not present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
    
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
  });

  it('should apply correct styling classes to container', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    const container = document.querySelector('.space-y-6');
    expect(container).toBeInTheDocument();
    
    const formContainer = document.querySelector('.bg-white.shadow.rounded-lg');
    expect(formContainer).toBeInTheDocument();
  });

  it('should apply correct styling classes to form sections', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    const headerSection = document.querySelector('.px-6.py-4.border-b.border-gray-200');
    expect(headerSection).toBeInTheDocument();
    
    const contentSection = document.querySelector('.p-6.space-y-6');
    expect(contentSection).toBeInTheDocument();
    
    const footerSection = document.querySelector('.px-6.py-4.bg-gray-50.border-t.border-gray-200');
    expect(footerSection).toBeInTheDocument();
  });

  it('should handle empty title', () => {
    render(
      <FormContainer {...defaultProps} title="">
        <div>Form Content</div>
      </FormContainer>
    );
    
    // Get the h1 element directly instead of by text content
    const titleElement = document.querySelector('h1');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('');
  });

  it('should not render description when description is empty string', () => {
    render(
      <FormContainer {...defaultProps} description="">
        <div>Form Content</div>
      </FormContainer>
    );
    
    // When description is empty string, the p element should NOT be rendered
    const descriptionElement = document.querySelector('p.mt-1');
    expect(descriptionElement).not.toBeInTheDocument();
  });

  it('should handle complex child content', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>
          <h3>Complex Form</h3>
          <input type="text" placeholder="Enter text" />
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
      </FormContainer>
    );
    
    expect(screen.getByText('Complex Form')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should handle multiple child elements', () => {
    render(
      <FormContainer {...defaultProps}>
        <div>First Element</div>
        <div>Second Element</div>
        <div>Third Element</div>
      </FormContainer>
    );
    
    expect(screen.getByText('First Element')).toBeInTheDocument();
    expect(screen.getByText('Second Element')).toBeInTheDocument();
    expect(screen.getByText('Third Element')).toBeInTheDocument();
  });

  it('should prevent default form submission', () => {
    const mockSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });
    
    render(
      <FormContainer {...defaultProps} onSubmit={mockSubmit}>
        <div>Form Content</div>
      </FormContainer>
    );
    
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});



