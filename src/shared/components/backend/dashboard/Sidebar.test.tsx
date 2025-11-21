/**
 * @jest-environment jsdom
 */
// components/dashboard/Sidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from './Sidebar';
import styles from './Sidebar.module.css';
import '@testing-library/jest-dom';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn()
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

// Mock CSS modules
jest.mock('./Sidebar.module.css', () => ({
  sidebar: 'sidebar',
  header: 'header',
  logo: 'logo',
  user: 'user',
  userName: 'userName',
  userEmail: 'userEmail',
  nav: 'nav',
  menu: 'menu',
  menuItem: 'menuItem',
  subMenuItem: 'subMenuItem',
  sectionButton: 'sectionButton',
  active: 'active',
  icon: 'icon',
  text: 'text',
  arrow: 'arrow',
  arrowExpanded: 'arrowExpanded',
  link: 'link',
  subLink: 'subLink',
  footer: 'footer',
  signOutButton: 'signOutButton'
}));

describe('DashboardSidebar', () => {
  const mockSession = {
    user: {
      name: 'Test User',
      email: 'test@example.com'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (signOut as jest.Mock).mockResolvedValue(undefined);
  });

  it('should render sidebar with user session information', () => {
    render(<DashboardSidebar />);
    
    expect(screen.getByText('MealPack')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render all main menu items', () => {
    render(<DashboardSidebar />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Order Meals')).toBeInTheDocument();
    expect(screen.getByText('Purchase Packs')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('should not render sub-menu items when section is collapsed', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<DashboardSidebar />);
    
    expect(screen.queryByText('Order History')).not.toBeInTheDocument();
    expect(screen.queryByText('Purchase History')).not.toBeInTheDocument();
  });

  it('should render sub-menu items when section is expanded', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/history/orders');
    render(<DashboardSidebar />);
    
    expect(screen.getByText('Order History')).toBeInTheDocument();
    expect(screen.getByText('Purchase History')).toBeInTheDocument();
  });

  it('should toggle history section when clicked', () => {
    render(<DashboardSidebar />);
    
    const historyButton = screen.getByText('History');
    fireEvent.click(historyButton);
    
    expect(screen.getByText('Order History')).toBeInTheDocument();
    expect(screen.getByText('Purchase History')).toBeInTheDocument();
    
    fireEvent.click(historyButton);
    
    expect(screen.queryByText('Order History')).not.toBeInTheDocument();
    expect(screen.queryByText('Purchase History')).not.toBeInTheDocument();
  });

  it('should highlight active menu item based on current path', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/orders');
    render(<DashboardSidebar />);
    
    const activeLink = screen.getByText('Order Meals').closest('a');
    expect(activeLink).toHaveClass(styles.active);
  });

  it('should highlight active sub-menu item based on current path', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/history/orders');
    render(<DashboardSidebar />);
    
    const activeLink = screen.getByText('Order History').closest('a');
    expect(activeLink).toHaveClass(styles.active);
  });

  it('should call signOut function when sign out button is clicked', () => {
    render(<DashboardSidebar />);
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('should render section button with expanded arrow when section is open', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/history/orders');
    render(<DashboardSidebar />);
    
    const historyButton = screen.getByText('History');
    const arrow = historyButton.nextElementSibling;
    
    expect(arrow).toHaveClass(styles.arrow);
    expect(arrow).toHaveClass(styles.arrowExpanded);
  });

  it('should render section button with collapsed arrow when section is closed', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<DashboardSidebar />);
    
    const historyButton = screen.getByText('History');
    const arrow = historyButton.nextElementSibling;
    
    expect(arrow).toHaveClass(styles.arrow);
    expect(arrow).not.toHaveClass(styles.arrowExpanded);
  });

  it('should render sub-menu items with sub-link styling', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/history/orders');
    render(<DashboardSidebar />);
    
    const orderHistoryLink = screen.getByText('Order History').closest('a');
    expect(orderHistoryLink).toHaveClass(styles.subLink);
  });

  it('should not render user information when session is not available', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });
    render(<DashboardSidebar />);
    
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });
});
