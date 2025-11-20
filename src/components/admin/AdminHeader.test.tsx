/** @jest-environment jsdom */
// components/admin/AdminHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import AdminHeader from './AdminHeader';
import '@testing-library/jest-dom';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('AdminHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render admin dashboard title', () => {
    render(<AdminHeader />);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    render(<AdminHeader />);
    
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('should call signOut when logout button is clicked', () => {
    render(<AdminHeader />);
    
    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);
    
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('should have correct styling for logout button', () => {
    render(<AdminHeader />);
    
    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    expect(logoutButton).toHaveClass('text-red-600', 'hover:underline');
  });

  it('should render with correct header structure', () => {
    render(<AdminHeader />);
    
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('bg-white', 'shadow-sm');
    
    const container = header?.firstChild;
    expect(container).toHaveClass('flex', 'justify-between', 'items-center', 'px-6', 'py-3');
  });

  it('should render title with correct styling', () => {
    render(<AdminHeader />);
    
    const title = screen.getByText('Admin Dashboard');
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });
});
