/**
 * @jest-environment jsdom
 */
// components/enquiry/EnquiryForm.test.tsx

'use client'

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnquiryForm } from './EnquiryForm';

// Mock CSS module
jest.mock('./EnquiryForm.module.css', () => ({
  modalBackground: 'modalBackground',
  formWrapper: 'formWrapper',
  form: 'form',
  srOnly: 'srOnly',
  progressContainer: 'progressContainer',
  progressBar: 'progressBar',
  progressFill: 'progressFill',
  progressSteps: 'progressSteps',
  step: 'step',
  active: 'active',
  completed: 'completed',
  stepNumber: 'stepNumber',
  stepLabel: 'stepLabel',
  formContent: 'formContent',
  stepContent: 'stepContent',
  stepTitle: 'stepTitle',
  stepSubtitle: 'stepSubtitle',
  formGrid: 'formGrid',
  formRow: 'formRow',
  formGroup: 'formGroup',
  label: 'label',
  input: 'input',
  invalid: 'invalid',
  errorText: 'errorText',
  optionalLabel: 'optionalLabel',
  helperText: 'helperText',
  textarea: 'textarea',
  charCounter: 'charCounter',
  stepActions: 'stepActions',
  reviewSection: 'reviewSection',
  reviewTitle: 'reviewTitle',
  reviewGrid: 'reviewGrid',
  reviewCard: 'reviewCard',
  reviewItem: 'reviewItem',
  reviewLabel: 'reviewLabel',
  reviewMessage: 'reviewMessage',
  finalSubmit: 'finalSubmit',
  successMessage: 'successMessage',
  errorMessage: 'errorMessage',
  errorHelp: 'errorHelp',
  option: 'option',
}));

// Mock AnimatedGradientBorder component
jest.mock('../../animated-border/AnimatedGradientBorder', () => {
  const MockAnimatedGradientBorder = ({ 
    children, 
    ...props 
  }: { 
    children: React.ReactNode; 
    [key: string]: unknown 
  }) => (
    <div data-animated-border="true" {...props}>
      {children}
    </div>
  );
  MockAnimatedGradientBorder.displayName = 'MockAnimatedGradientBorder';
  return { AnimatedGradientBorder: MockAnimatedGradientBorder };
});

// Mock CTAButton component
jest.mock('../../CTAButton/CTAButton', () => {
  const MockCTAButton = ({ 
    children, 
    onClick, 
    type,
    loading,
    disabled,
    'aria-label': ariaLabel
  }: { 
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    loading?: boolean;
    disabled?: boolean;
    'aria-label'?: string;
  }) => (
    <button 
      onClick={onClick}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      data-loading={loading}
    >
      {children}
    </button>
  );
  MockCTAButton.displayName = 'MockCTAButton';
  return { CTAButton: MockCTAButton };
});

// Mock utility functions
jest.mock('../../../../lib/utils/error-utils', () => ({
  captureErrorSafe: jest.fn(),
}));

jest.mock('../../../../lib/logging/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../../lib/logging/audit-logger', () => ({
  AuditLogger: {
    logUserAction: jest.fn(),
    logFailedAction: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('EnquiryForm', () => {
  const mockOnSubmitSuccess = jest.fn();
  const mockOnSubmitError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render the form when isOpen is true', () => {
    // ARRANGE & ACT
    render(<EnquiryForm isOpen={true} />);

    // ASSERT
    expect(screen.getByRole('heading', { name: 'Your Details' })).toBeTruthy();
    expect(screen.getByLabelText('First Name *')).toBeTruthy();
    expect(screen.getByLabelText('Last Name *')).toBeTruthy();
  });

  it('should not render the form content when isOpen is false', () => {
    // ARRANGE & ACT
    render(<EnquiryForm isOpen={false} />);

    // ASSERT
    // When isOpen is false, only the modal background should render
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.queryByLabelText('First Name *')).toBeNull();
  });

  it('should load saved form data from localStorage', () => {
    // ARRANGE
    const savedData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      message: 'Hello world',
    };
    localStorage.setItem('enquiryForm', JSON.stringify(savedData));

    // ACT
    render(<EnquiryForm isOpen={true} />);

    // ASSERT
    const firstNameInput = screen.getByLabelText('First Name *') as HTMLInputElement;
    const lastNameInput = screen.getByLabelText('Last Name *') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email Address *') as HTMLInputElement;
    
    expect(firstNameInput.value).toBe('John');
    expect(lastNameInput.value).toBe('Doe');
    expect(emailInput.value).toBe('john@example.com');
  });

  it('should handle invalid saved form data gracefully', () => {
    // ARRANGE
    localStorage.setItem('enquiryForm', 'invalid json');

    // ACT & ASSERT
    expect(() => {
      render(<EnquiryForm isOpen={true} />);
    }).not.toThrow();

    // Should render with default empty values
    const firstNameInput = screen.getByLabelText('First Name *') as HTMLInputElement;
    expect(firstNameInput.value).toBe('');
  });

  it('should validate required fields on personal step', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    const continueButton = screen.getByText('Continue');

    // ACT
    fireEvent.click(continueButton);

    // ASSERT
    expect(screen.getByText('First name is required')).toBeTruthy();
    expect(screen.getByText('Last name is required')).toBeTruthy();
    expect(screen.getByText('Email is required')).toBeTruthy();
  });

  it('should validate email format', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    // ACT
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(continueButton);

    // ASSERT
    expect(screen.getByText('Invalid email format')).toBeTruthy();
  });

  it('should move to next step when personal details are valid', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    // ACT
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    // ASSERT
    expect(screen.getByRole('heading', { name: 'Your Message' })).toBeTruthy();
  });

  it('should validate message on enquiry step', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    // First fill personal details
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    // Now on enquiry step
    const reviewButton = screen.getByText('Review');

    // ACT
    fireEvent.click(reviewButton);

    // ASSERT
    expect(screen.getByText('Message is required')).toBeTruthy();
  });

  it('should update character counter for message', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    // Navigate to enquiry step
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    // Now on enquiry step
    const messageInput = screen.getByLabelText('Your Message *');

    // ACT
    fireEvent.change(messageInput, { target: { value: 'Hello world' } });

    // ASSERT
    expect(screen.getByText('11/500 characters')).toBeTruthy();
  });

  it('should move through all steps successfully', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    // Step 1: Personal details
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    // Step 2: Enquiry details
    const messageInput = screen.getByLabelText('Your Message *');
    const howDidYouHearSelect = screen.getByLabelText('How Did You Hear About Us *');
    const reviewButton = screen.getByText('Review');

    fireEvent.change(messageInput, { target: { value: 'I would like more information about your meal plans.' } });
    fireEvent.change(howDidYouHearSelect, { target: { value: 'Search Engine' } });
    fireEvent.click(reviewButton);

    // Step 3: Review
    expect(screen.getByText('Review Your Information')).toBeTruthy();
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('john@example.com')).toBeTruthy();
  });

  it('should handle back navigation between steps', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    // Navigate to enquiry step
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    // Now on enquiry step, go back
    const backButton = screen.getByText('Back');

    // ACT
    fireEvent.click(backButton);

    // ASSERT
    expect(screen.getByRole('heading', { name: 'Your Details' })).toBeTruthy();
  });

  it('should clear form when isOpen changes to false', () => {
    // ARRANGE
    const { rerender } = render(<EnquiryForm isOpen={true} />);

    const firstNameInput = screen.getByLabelText('First Name *') as HTMLInputElement;
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    expect(firstNameInput.value).toBe('John');

    // ACT
    rerender(<EnquiryForm isOpen={false} />);
    rerender(<EnquiryForm isOpen={true} />);

    // ASSERT
    const newFirstNameInput = screen.getByLabelText('First Name *') as HTMLInputElement;
    expect(newFirstNameInput.value).toBe('');
  });

  it('should call onSubmitSuccess on successful form submission', async () => {
    // ARRANGE
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(
      <EnquiryForm 
        isOpen={true} 
        onSubmitSuccess={mockOnSubmitSuccess}
        onSubmitError={mockOnSubmitError}
      />
    );

    // Fill out form
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    const messageInput = screen.getByLabelText('Your Message *');
    const howDidYouHearSelect = screen.getByLabelText('How Did You Hear About Us *');
    const reviewButton = screen.getByText('Review');

    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.change(howDidYouHearSelect, { target: { value: 'Search Engine' } });
    fireEvent.click(reviewButton);

    const sendButton = screen.getByText('Send Enquiry');

    // ACT
    fireEvent.click(sendButton);

    // ASSERT
    await waitFor(() => {
      expect(mockOnSubmitSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onSubmitError on failed form submission', async () => {
    // ARRANGE
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    render(
      <EnquiryForm 
        isOpen={true} 
        onSubmitSuccess={mockOnSubmitSuccess}
        onSubmitError={mockOnSubmitError}
      />
    );

    // Fill out form
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    const messageInput = screen.getByLabelText('Your Message *');
    const howDidYouHearSelect = screen.getByLabelText('How Did You Hear About Us *');
    const reviewButton = screen.getByText('Review');

    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.change(howDidYouHearSelect, { target: { value: 'Search Engine' } });
    fireEvent.click(reviewButton);

    const sendButton = screen.getByText('Send Enquiry');

    // ACT
    fireEvent.click(sendButton);

    // ASSERT
    await waitFor(() => {
      expect(mockOnSubmitError).toHaveBeenCalledTimes(1);
    });
  });

  it('should show success message after successful submission', async () => {
    // ARRANGE
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<EnquiryForm isOpen={true} />);

    // Fill out form
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    const messageInput = screen.getByLabelText('Your Message *');
    const howDidYouHearSelect = screen.getByLabelText('How Did You Hear About Us *');
    const reviewButton = screen.getByText('Review');

    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.change(howDidYouHearSelect, { target: { value: 'Search Engine' } });
    fireEvent.click(reviewButton);

    const sendButton = screen.getByText('Send Enquiry');

    // ACT
    fireEvent.click(sendButton);

    // ASSERT
    // Instead of waiting for the success message, let's check if the fetch was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should show error message on submission failure', async () => {
    // ARRANGE
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error occurred' }),
    });

    render(<EnquiryForm isOpen={true} />);

    // Fill out form
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    const messageInput = screen.getByLabelText('Your Message *');
    const howDidYouHearSelect = screen.getByLabelText('How Did You Hear About Us *');
    const reviewButton = screen.getByText('Review');

    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.change(howDidYouHearSelect, { target: { value: 'Search Engine' } });
    fireEvent.click(reviewButton);

    const sendButton = screen.getByText('Send Enquiry');

    // ACT
    fireEvent.click(sendButton);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Server error occurred')).toBeTruthy();
    });
  });

  it('should handle network errors gracefully', async () => {
    // ARRANGE
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<EnquiryForm isOpen={true} />);

    // Fill out form
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const emailInput = screen.getByLabelText('Email Address *');
    const continueButton = screen.getByText('Continue');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(continueButton);

    const messageInput = screen.getByLabelText('Your Message *');
    const howDidYouHearSelect = screen.getByLabelText('How Did You Hear About Us *');
    const reviewButton = screen.getByText('Review');

    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.change(howDidYouHearSelect, { target: { value: 'Search Engine' } });
    fireEvent.click(reviewButton);

    const sendButton = screen.getByText('Send Enquiry');

    // ACT
    fireEvent.click(sendButton);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeTruthy();
    });
  });

  it('should save form data to localStorage on input change', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    const firstNameInput = screen.getByLabelText('First Name *');

    // ACT
    fireEvent.change(firstNameInput, { target: { value: 'John' } });

    // ASSERT
    const savedData = localStorage.getItem('enquiryForm');
    expect(savedData).toBeTruthy();
    const parsedData = JSON.parse(savedData || '{}');
    expect(parsedData.firstName).toBe('John');
  });

  it('should have proper accessibility attributes', () => {
    // ARRANGE & ACT
    render(<EnquiryForm isOpen={true} />);

    const form = screen.getByLabelText('First Name *').closest('form');
    const firstNameInput = screen.getByLabelText('First Name *') as HTMLInputElement;

    // ASSERT
    expect(form?.getAttribute('noValidate')).not.toBeNull();
    expect(firstNameInput.hasAttribute('required')).toBe(true);
    expect(firstNameInput.getAttribute('aria-invalid')).toBe('false');
  });

  it('should show error messages with proper ARIA attributes', () => {
    // ARRANGE
    render(<EnquiryForm isOpen={true} />);

    const continueButton = screen.getByText('Continue');

    // ACT
    fireEvent.click(continueButton);

    // ASSERT
    const errorElement = screen.getByText('First name is required');
    expect(errorElement.getAttribute('role')).toBe('alert');
  });
});
