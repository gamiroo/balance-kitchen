/** @jest-environment jsdom */
// components/admin/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';
import '@testing-library/jest-dom';

describe('StatusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the DOM between tests
    document.body.innerHTML = '';
  });

  describe('Happy Path Cases', () => {
    it('should render with default order type and pending status', () => {
      render(<StatusBadge status="pending" />);

      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should render order status badges with correct styles', () => {
      const testCases = [
        { status: 'pending', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
        { status: 'confirmed', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
        { status: 'delivered', bgClass: 'bg-green-100', textClass: 'text-green-800' },
        { status: 'cancelled', bgClass: 'bg-red-100', textClass: 'text-red-800' },
        { status: 'unknown', bgClass: 'bg-gray-100', textClass: 'text-gray-800' }
      ];

      testCases.forEach(({ status, bgClass, textClass }) => {
        const { unmount } = render(<StatusBadge status={status} type="order" />);
        
        const badge = screen.getByText(status.charAt(0).toUpperCase() + status.slice(1));
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass(bgClass, textClass);
        
        unmount();
      });
    });

    it('should render user status badges with correct styles', () => {
      const { unmount } = render(<StatusBadge status="active" type="user" />);
      const activeBadge = screen.getByText('Active');
      expect(activeBadge).toBeInTheDocument();
      expect(activeBadge).toHaveClass('bg-green-100', 'text-green-800');
      unmount();

      render(<StatusBadge status="inactive" type="user" />);
      const inactiveBadge = screen.getByText('Inactive');
      expect(inactiveBadge).toBeInTheDocument();
      expect(inactiveBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should render menu status badges with correct styles', () => {
      const testCases = [
        { status: 'active', bgClass: 'bg-green-100', textClass: 'text-green-800' },
        { status: 'scheduled', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
        { status: 'expired', bgClass: 'bg-gray-100', textClass: 'text-gray-800' },
        { status: 'draft', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
        { status: 'unknown', bgClass: 'bg-gray-100', textClass: 'text-gray-800' }
      ];

      testCases.forEach(({ status, bgClass, textClass }) => {
        const { unmount } = render(<StatusBadge status={status} type="menu" />);
        
        const badge = screen.getByText(status.charAt(0).toUpperCase() + status.slice(1));
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass(bgClass, textClass);
        
        unmount();
      });
    });

    it('should render pack status badges with correct styles', () => {
      const { unmount } = render(<StatusBadge status="active" type="pack" />);
      const activeBadge = screen.getByText('Active');
      expect(activeBadge).toBeInTheDocument();
      expect(activeBadge).toHaveClass('bg-green-100', 'text-green-800');
      unmount();

      render(<StatusBadge status="inactive" type="pack" />);
      const inactiveBadge = screen.getByText('Inactive');
      expect(inactiveBadge).toBeInTheDocument();
      expect(inactiveBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should capitalize status text correctly', () => {
      render(<StatusBadge status="pending" type="order" />);
      
      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed case status values', () => {
      render(<StatusBadge status="PENDING" type="order" />);
      
      // The component capitalizes the first letter, so PENDING becomes PENDING (first P is already capital)
      const badge = screen.getByText('PENDING');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should handle empty status string', () => {
      render(<StatusBadge status="" type="order" />);
      
      // For empty string, query by the class names since getByText('') finds multiple elements
      const badge = document.querySelector('.inline-flex.items-center');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should handle whitespace in status string', () => {
      render(<StatusBadge status=" pending " type="order" />);
      
      // Query by the actual rendered text with whitespace
      const badge = screen.getByText(content => 
        typeof content === 'string' && content.trim() === 'pending'
      );
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should handle special characters in status string', () => {
      render(<StatusBadge status="pending-order" type="order" />);
      
      const badge = screen.getByText('Pending-order');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should handle default type when type is not specified', () => {
      render(<StatusBadge status="confirmed" />);
      
      const badge = screen.getByText('Confirmed');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Error Cases', () => {
    it('should render with default styles when type is invalid', () => {
      // @ts-expect-error - Testing invalid type
      render(<StatusBadge status="active" type="invalid" />);
      
      const badge = screen.getByText('Active');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Security Cases', () => {
    it('should sanitize status text to prevent XSS', () => {
      const xssStatus = '<script>alert("xss")</script>';
      render(<StatusBadge status={xssStatus} type="order" />);
      
      const badge = screen.getByText(xssStatus);
      expect(badge).toBeInTheDocument();
      // Should render as text, not execute script
      expect(badge.querySelector('script')).toBeNull();
    });

    it('should handle excessively long status strings', () => {
      const longStatus = 'a'.repeat(100);
      render(<StatusBadge status={longStatus} type="order" />);
      
      // Check that it renders with a function matcher to handle long text
      const badge = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'span' && 
               element.classList.contains('inline-flex') &&
               content === longStatus.charAt(0).toUpperCase() + longStatus.slice(1);
      });
      
      expect(badge).toBeInTheDocument();
    });
  });
});
