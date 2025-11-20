/**
 *  @jest-environment jsdom
 */
// components/admin/forms/FormField.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormField from './FormField';
import type { ComponentProps } from 'react';

type FormFieldProps = ComponentProps<typeof FormField>;
type FormFieldBaseProps = Omit<FormFieldProps, 'children'>;

const defaultProps: FormFieldBaseProps = {
  label: 'Test Field',
  id: 'test-field',
};

const renderWithInput = (props?: Partial<FormFieldBaseProps>) => {
  const mergedProps: FormFieldBaseProps = {
    ...defaultProps,
    ...props,
  };

  return render(
    <FormField {...mergedProps}>
      <input type="text" id={mergedProps.id} />
    </FormField>
  );
};

describe('FormField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form field with label and input', () => {
    renderWithInput();

    expect(screen.getByText('Test Field')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should associate label with input using htmlFor', () => {
    renderWithInput();

    const label = screen.getByText('Test Field');
    const input = screen.getByRole('textbox');

    expect(label).toHaveAttribute('for', 'test-field');
    expect(input).toHaveAttribute('id', 'test-field');
  });

  it('should render required indicator when required is true', () => {
    renderWithInput({ required: true });

    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass('text-red-500', 'ml-1');
  });

  it('should not render required indicator when required is false', () => {
    renderWithInput({ required: false });

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should not render required indicator when required is not specified', () => {
    renderWithInput();

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should render help text when provided', () => {
    renderWithInput({ helpText: 'This is helper text' });

    expect(screen.getByText('This is helper text')).toBeInTheDocument();
    expect(screen.getByText('This is helper text')).toHaveClass(
      'mt-1',
      'text-sm',
      'text-gray-500',
    );
  });

  it('should not render help text when not provided', () => {
    renderWithInput();

    expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
  });

  it('should render error message when provided', () => {
    renderWithInput({ error: 'This field is required' });

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass(
      'mt-1',
      'text-sm',
      'text-red-600',
    );
  });

  it('should not render error message when not provided', () => {
    renderWithInput();

    expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
  });

  it('should render all elements in correct order', () => {
    renderWithInput({
      required: true,
      helpText: 'This is helper text',
      error: 'This field is required',
    });

    const container = screen.getByText('Test Field').closest('div');
    const children = container?.children;

    if (children) {
      // Label should be first
      expect(children[0]).toHaveTextContent('Test Field');

      // Input should be second
      expect(children[1]).toHaveAttribute('id', 'test-field');

      // Help text should be third
      expect(children[2]).toHaveTextContent('This is helper text');

      // Error should be fourth
      expect(children[3]).toHaveTextContent('This field is required');
    }
  });

  it('should apply correct styling classes to label', () => {
    renderWithInput();

    const label = screen.getByText('Test Field');
    expect(label).toHaveClass(
      'block',
      'text-sm',
      'font-medium',
      'text-gray-700',
      'mb-1',
    );
  });

  it('should render with different child elements', () => {
    render(
      <FormField label="Test Field" id="test-select">
        <select id="test-select">
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      </FormField>,
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render with textarea as child', () => {
    render(
      <FormField label="Test Field" id="test-textarea">
        <textarea id="test-textarea" />
      </FormField>,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle empty label', () => {
    renderWithInput({ label: '' });

    const labelElement = document.querySelector('label');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveTextContent('');
  });

  it('should handle empty help text', () => {
    renderWithInput({ helpText: '' });

    const helpTextElement = document.querySelector('p.mt-1.text-gray-500');
    expect(helpTextElement).not.toBeInTheDocument();
  });

  it('should handle empty error message', () => {
    renderWithInput({ error: '' });

    const errorElement = document.querySelector('p.mt-1.text-red-600');
    expect(errorElement).not.toBeInTheDocument();
  });

  it('should handle special characters in label', () => {
    renderWithInput({ label: 'Test Field & Special Ch@r$!' });

    expect(
      screen.getByText('Test Field & Special Ch@r$!'),
    ).toBeInTheDocument();
  });

  it('should handle special characters in help text', () => {
    renderWithInput({ helpText: 'Help with $p£ci@l ch@r$' });

    expect(screen.getByText('Help with $p£ci@l ch@r$')).toBeInTheDocument();
  });

  it('should handle special characters in error message', () => {
    renderWithInput({ error: 'Error with $p£ci@l ch@r$' });

    expect(screen.getByText('Error with $p£ci@l ch@r$')).toBeInTheDocument();
  });

  it('should render multiple form fields without conflicts', () => {
    render(
      <>
        <FormField label="Field 1" id="field-1">
          <input type="text" id="field-1" />
        </FormField>
        <FormField label="Field 2" id="field-2">
          <input type="text" id="field-2" />
        </FormField>
      </>,
    );

    expect(screen.getByLabelText('Field 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Field 2')).toBeInTheDocument();
  });

  it('should render with complex child content', () => {
    render(
      <FormField label="Test Field" id="complex-field">
        <div className="relative">
          <input
            type="text"
            id="complex-field"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </FormField>,
    );

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    const svgElement = document.querySelector('svg.h-5.w-5');
    expect(svgElement).toBeInTheDocument();
  });
});
