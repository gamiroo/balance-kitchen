/** @jest-environment jsdom */
// components/admin/DataTable.client.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from './DataTable.client';
import '@testing-library/jest-dom';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { 
    children: React.ReactNode; 
    href: string;
    className?: string;
  }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

// Define test data interfaces that extend Record<string, unknown>
interface TestUser extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

describe('DataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path Cases', () => {
    it('should render table with data rows', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive' }
      ];
      
      const columns = [
        { key: 'name', title: 'Name' },
        { key: 'email', title: 'Email' },
        { key: 'role', title: 'Role' }
      ];

      render(<DataTable data={testData} columns={columns} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should render custom cell content using render function', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' }
      ];
      
      const columns = [
        { 
          key: 'status', 
          title: 'Status',
          render: (value: unknown) => {
            const status = String(value ?? '');
            return (
              <span className={status === 'Active' ? 'text-green-600' : 'text-red-600'}>
                {status}
              </span>
            );
          }
        }
      ];

      render(<DataTable data={testData} columns={columns} />);

      const statusCell = screen.getByText('Active');
      expect(statusCell).toBeInTheDocument();
      expect(statusCell).toHaveClass('text-green-600');
    });

    it('should render action buttons when actions are provided', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' }
      ];
      
      const columns = [{ key: 'name', title: 'Name' }];
      const mockAction = jest.fn();
      const actions = [
        { label: 'Edit', onClick: mockAction },
        { label: 'Delete', onClick: mockAction }
      ];

      render(<DataTable data={testData} columns={columns} actions={actions} />);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call action handler when action button is clicked', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' }
      ];
      
      const columns = [{ key: 'name', title: 'Name' }];
      const mockAction = jest.fn();
      const actions = [{ label: 'Edit', onClick: mockAction }];

      render(<DataTable data={testData} columns={columns} actions={actions} />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
      expect(mockAction).toHaveBeenCalledWith(testData[0]);
    });

    it('should call row click handler when row is clicked', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' }
      ];
      
      const columns = [{ key: 'name', title: 'Name' }];
      const mockRowClick = jest.fn();

      render(<DataTable data={testData} columns={columns} onRowClick={mockRowClick} />);

      const row = screen.getByText('John Doe').closest('tr');
      if (row) {
        fireEvent.click(row);
      }

      expect(mockRowClick).toHaveBeenCalledTimes(1);
      expect(mockRowClick).toHaveBeenCalledWith(testData[0]);
    });

    it('should render empty state when data is empty and emptyState is provided', () => {
      const emptyState = {
        title: 'No users found',
        description: 'Get started by creating a new user.',
        action: {
          label: 'Add User',
          href: '/admin/users/new'
        }
      };

      render(<DataTable data={[]} columns={[]} emptyState={emptyState} />);

      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating a new user.')).toBeInTheDocument();
      expect(screen.getByText('Add User')).toBeInTheDocument();
      expect(screen.getByText('Add User')).toHaveAttribute('href', '/admin/users/new');
    });

    it('should sort data when sortable column header is clicked', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'Zoe', email: 'zoe@example.com', role: 'User', status: 'Active' },
        { id: 2, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'Active' },
        { id: 3, name: 'Bob', email: 'bob@example.com', role: 'User', status: 'Inactive' }
      ];
      
      const columns = [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'role', title: 'Role', sortable: true }
      ];

      render(<DataTable data={testData} columns={columns} />);

      // Initial order
      const nameCells = screen.getAllByRole('cell').filter(cell => 
        ['Zoe', 'Alice', 'Bob'].includes(cell.textContent || '')
      );
      expect(nameCells[0]).toHaveTextContent('Zoe');
      expect(nameCells[1]).toHaveTextContent('Alice');
      expect(nameCells[2]).toHaveTextContent('Bob');

      // Click to sort by name
      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);

      const sortedNameCells = screen.getAllByRole('cell').filter(cell => 
        ['Zoe', 'Alice', 'Bob'].includes(cell.textContent || '')
      );
      expect(sortedNameCells[0]).toHaveTextContent('Alice');
      expect(sortedNameCells[1]).toHaveTextContent('Bob');
      expect(sortedNameCells[2]).toHaveTextContent('Zoe');
    });

    it('should show sort indicator when column is sorted', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'Active' }
      ];
      
      const columns = [
        { key: 'name', title: 'Name', sortable: true }
      ];

      render(<DataTable data={testData} columns={columns} />);

      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);

      expect(screen.getByText('Name')).toContainHTML('↑');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values gracefully', () => {
      const testData = [
        { id: 1, name: null, email: undefined, role: 'Admin' }
      ] as unknown as TestUser[];
      
      const columns = [
        { key: 'name', title: 'Name' },
        { key: 'email', title: 'Email' },
        { key: 'role', title: 'Role' }
      ];

      render(<DataTable data={testData} columns={columns} />);

      // Should render empty string for null/undefined values
      const cells = screen.getAllByRole('cell');
      expect(cells[0]).toHaveTextContent(''); // name cell
      expect(cells[1]).toHaveTextContent(''); // email cell
      expect(cells[2]).toHaveTextContent('Admin'); // role cell
    });

    it('should handle empty data array without emptyState', () => {
      render(<DataTable data={[]} columns={[]} />);

      // Should render an empty table
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // No rows except header
      const rows = screen.queryAllByRole('row');
      expect(rows).toHaveLength(1); // Only header row
    });

    it('should handle action labels and classes as functions', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive' }
      ];
      
      const columns = [{ key: 'name', title: 'Name' }];
      const actions = [
        {
          label: (row: TestUser) => row.status === 'Active' ? 'Deactivate' : 'Activate',
          onClick: jest.fn(),
          className: (row: TestUser) => row.status === 'Active' 
            ? 'text-red-600' 
            : 'text-green-600'
        }
      ];

      render(<DataTable data={testData} columns={columns} actions={actions} />);

      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons[0]).toHaveTextContent('Deactivate');
      expect(actionButtons[0]).toHaveClass('text-red-600');
      expect(actionButtons[1]).toHaveTextContent('Activate');
      expect(actionButtons[1]).toHaveClass('text-green-600');
    });

    it('should handle rows without id by using index', () => {
      const testData = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ] as unknown as TestUser[];

      const columns = [
        { key: 'name', title: 'Name' },
        { key: 'email', title: 'Email' }
      ];

      render(<DataTable data={testData} columns={columns} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Error Cases', () => {
    it('should throw error when data is null', () => {
      const columns = [{ key: 'name', title: 'Name' }];
      
      // @ts-expect-error - Testing invalid input
      expect(() => render(<DataTable data={null} columns={columns} />)).toThrow();
    });

    it('should throw error when columns is null', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' }
      ];
      
      // @ts-expect-error - Testing invalid input
      expect(() => render(<DataTable data={testData} columns={null} />)).toThrow();
    });
  });

  describe('Security Cases', () => {
    it('should prevent action click event from bubbling to row click', () => {
      const testData: TestUser[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' }
      ];
      
      const columns = [{ key: 'name', title: 'Name' }];
      const mockAction = jest.fn();
      const mockRowClick = jest.fn();
      const actions = [{ label: 'Edit', onClick: mockAction }];

      render(
        <DataTable 
          data={testData} 
          columns={columns} 
          actions={actions} 
          onRowClick={mockRowClick} 
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
      expect(mockRowClick).not.toHaveBeenCalled();
    });

    it('should sanitize cell content to prevent XSS', () => {
      const testData = [
        { id: 1, name: '<script>alert("xss")</script>', email: 'john@example.com' }
      ] as unknown as TestUser[];
      
      const columns = [
        { key: 'name', title: 'Name' },
        { key: 'email', title: 'Email' }
      ];

      render(<DataTable data={testData} columns={columns} />);

      // Should render as text, not as HTML
      const nameCell = screen.getByText('<script>alert("xss")</script>');
      expect(nameCell).toBeInTheDocument();
      expect(nameCell.querySelector('script')).toBeNull();
    });
  });
});
