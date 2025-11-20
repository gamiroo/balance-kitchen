/** @jest-environment jsdom */
// components/admin/AdminSidebar.test.tsx
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock next/link to properly handle className prop
jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { 
    children: React.ReactNode; 
    href: string;
    className?: string;
  }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

describe('AdminSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render admin panel title', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('should render all menu items', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Menus')).toBeInTheDocument();
    expect(screen.getByText('Packs')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render menu items with correct icons', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🍽️')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('should apply active styling to current page link', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    const activeLink = screen.getByText('Dashboard').closest('a');
    expect(activeLink).toBeInTheDocument();
    // Check that the link contains the active classes (using partial match)
    expect(activeLink?.className).toContain('bg-blue-100');
    expect(activeLink?.className).toContain('text-blue-600');
  });

  it('should apply hover styling to non-active links', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    const inactiveLink = screen.getByText('Menus').closest('a');
    expect(inactiveLink).toBeInTheDocument();
    // Check that the link contains the inactive classes (using partial match)
    expect(inactiveLink?.className).toContain('text-gray-700');
    expect(inactiveLink?.className).toContain('hover:bg-gray-100');
  });

  it('should render correct href for each menu item', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByText('Menus').closest('a')).toHaveAttribute('href', '/admin/menus');
    expect(screen.getByText('Packs').closest('a')).toHaveAttribute('href', '/admin/packs');
    expect(screen.getByText('Orders').closest('a')).toHaveAttribute('href', '/admin/orders');
    expect(screen.getByText('Users').closest('a')).toHaveAttribute('href', '/admin/users');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/admin/settings');
  });

  it('should render with correct sidebar structure', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    const sidebar = document.querySelector('aside');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass('w-64', 'bg-white', 'shadow-md');
    
    const titleContainer = sidebar?.firstChild;
    expect(titleContainer).toHaveClass('p-4', 'text-xl', 'font-bold', 'border-b');
  });

  it('should render nav with correct styling', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('mt-5');
  });

  it('should render all menu items in a list', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(6);
  });

  it('should apply correct styling to sidebar title', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    render(<AdminSidebar />);
    
    const title = screen.getByText('Admin Panel');
    expect(title).toHaveClass('text-xl', 'font-bold');
  });
});
