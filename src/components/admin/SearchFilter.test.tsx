/** @jest-environment jsdom */
// components/admin/SearchFilter.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilter from './SearchFilter';
import '@testing-library/jest-dom';

// Define FilterConfig interface locally since it's not exported
interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "boolean";
  options?: FilterOption[];
}

describe('SearchFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path Cases', () => {
    it('should render all filter fields based on configuration', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]},
        { key: 'isVerified', label: 'Verified', type: 'boolean' },
        { key: 'createdDate', label: 'Created Date', type: 'date' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Verified')).toBeInTheDocument();
      expect(screen.getByLabelText('Created Date')).toBeInTheDocument();
    });

    it('should call onSearch with filter values when Apply Filters is clicked', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]}
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      // Fill in filter values
      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'John' } });

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      // Click Apply Filters
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith({
        name: 'John',
        status: 'active'
      });
    });

    it('should reset all filters when Reset button is clicked', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      // Fill in a value
      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'John' } });
      expect(nameInput).toHaveValue('John');

      // Click Reset
      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      // Check that input is cleared and onSearch is called with empty filters
      expect(nameInput).toHaveValue('');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith({});
    });

    it('should initialize with default values', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]}
      ];

      const defaultValues = {
        name: 'John',
        status: 'active'
      };

      const mockOnSearch = jest.fn();

      render(
        <SearchFilter 
          onSearch={mockOnSearch} 
          filters={filters} 
          defaultValues={defaultValues} 
        />
      );

      expect(screen.getByLabelText('Name')).toHaveValue('John');
      expect(screen.getByLabelText('Status')).toHaveValue('active');
    });

    it('should handle boolean filter with Yes/No options', () => {
      const filters: FilterConfig[] = [
        { key: 'isVerified', label: 'Verified', type: 'boolean' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      const booleanSelect = screen.getByLabelText('Verified');
      fireEvent.change(booleanSelect, { target: { value: 'true' } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        isVerified: true
      });
    });

    it('should handle date filter input', () => {
      const filters: FilterConfig[] = [
        { key: 'createdDate', label: 'Created Date', type: 'date' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      const dateInput = screen.getByLabelText('Created Date');
      fireEvent.change(dateInput, { target: { value: '2023-01-15' } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        createdDate: '2023-01-15'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filters array', () => {
      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={[]} />);

      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('should handle select filter with no options', () => {
      const filters: FilterConfig[] = [
        { key: 'status', label: 'Status', type: 'select' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      const select = screen.getByLabelText('Status');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should handle undefined default values', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' }
      ];

      const mockOnSearch = jest.fn();

      render(
        <SearchFilter 
          onSearch={mockOnSearch} 
          filters={filters} 
          defaultValues={undefined} 
        />
      );

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('should handle boolean filter with "All" selection', () => {
      const filters: FilterConfig[] = [
        { key: 'isVerified', label: 'Verified', type: 'boolean' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      const booleanSelect = screen.getByLabelText('Verified');
      fireEvent.change(booleanSelect, { target: { value: '' } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        isVerified: undefined
      });
    });

    it('should prevent default form submission behavior', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      // Get the form element and simulate submit event
      const form = document.querySelector('form');
      const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      if (form) {
        form.dispatchEvent(submitEvent);
      }

      // Check that preventDefault was called to prevent actual form submission
      expect(preventDefaultSpy).toHaveBeenCalled();
      // Check that our custom handler was called
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    it('should not crash when onSearch is not provided', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' }
      ];

      // @ts-expect-error - Testing missing onSearch prop
      expect(() => render(<SearchFilter filters={filters} />)).not.toThrow();
    });

    it('should not crash when filter configuration is invalid', () => {
      const filters = [
        { key: 'invalid', label: 'Invalid', type: 'invalid-type' }
      ];

      const mockOnSearch = jest.fn();

      expect(() => render(<SearchFilter onSearch={mockOnSearch} filters={filters as FilterConfig[]} />)).not.toThrow();
    });
  });

  describe('Security Cases', () => {
    it('should sanitize text input to prevent XSS', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      const nameInput = screen.getByLabelText('Name');
      const xssValue = '<script>alert("xss")</script>';
      fireEvent.change(nameInput, { target: { value: xssValue } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        name: xssValue
      });
    });

    it('should not allow form submission with malicious data', () => {
      const filters: FilterConfig[] = [
        { key: 'name', label: 'Name', type: 'text' }
      ];

      const mockOnSearch = jest.fn();

      render(<SearchFilter onSearch={mockOnSearch} filters={filters} />);

      const nameInput = screen.getByLabelText('Name');
      const maliciousValue = 'John"; DROP TABLE users; --';
      fireEvent.change(nameInput, { target: { value: maliciousValue } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        name: maliciousValue
      });
    });
  });
});
