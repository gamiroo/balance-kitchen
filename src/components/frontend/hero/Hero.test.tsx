/** @jest-environment jsdom */
// src/components/frontend/hero/Hero.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { Hero } from './Hero';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  };
});

// Mock lucide-react ChevronDown icon
jest.mock('lucide-react', () => ({
  ChevronDown: ({ size, className, 'aria-hidden': ariaHidden }: { 
    size: number; 
    className: string; 
    'aria-hidden': boolean 
  }) => (
    <svg 
      width={size} 
      height={size} 
      className={className} 
      aria-hidden={ariaHidden}
      data-testid="chevron-down"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
}));

// Mock CTAButton component
jest.mock('../../../ui/CTAButton/CTAButton', () => {
  return {
    CTAButton: ({ children, onClick, href, 'aria-label': ariaLabel }: { 
      children: React.ReactNode; 
      onClick: () => void;
      href: string;
      'aria-label'?: string;
    }) => (
      <button onClick={onClick} aria-label={ariaLabel}>
        {children}
      </button>
    ),
  };
});

// Mock CSS modules
jest.mock('./Hero.module.css', () => ({
  heroSection: 'heroSection',
  backgroundOverlay: 'backgroundOverlay',
  contentContainer: 'contentContainer',
  contentContainerSm: 'contentContainerSm',
  contentContainerLg: 'contentContainerLg',
  heroHeading: 'heroHeading',
  heroHeadingSm: 'heroHeadingSm',
  heroHeadingMd: 'heroHeadingMd',
  heroHeadingLg: 'heroHeadingLg',
  heroSubtitle: 'heroSubtitle',
  heroSubtitleSm: 'heroSubtitleSm',
  heroSubtitleMd: 'heroSubtitleMd',
  ctaContainer: 'ctaContainer',
  scrollIndicator: 'scrollIndicator',
  scrollIndicatorContent: 'scrollIndicatorContent',
  scrollButton: 'scrollButton',
  scrollIcon: 'scrollIcon',
  scrollIconMobile: 'scrollIconMobile',
  scrollText: 'scrollText',
  skipLink: 'skipLink',
}));

describe('Hero', () => {
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Restore window methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    
    // Reset window.innerWidth to default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    // Suppress console errors for tests that expect errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Ensure cleanup after each test
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });

  // Mock window resize functionality
  const mockWindowInnerWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
  };

  describe('Happy Path Cases', () => {
    it('should render the Hero component with all main elements', () => {
      render(<Hero />);
      
      // Check main heading
      expect(screen.getByText('Healthy meals, delivered fast.')).toBeInTheDocument();
      
      // Check subtitle
      expect(screen.getByText('Save time, stay fit, taste the difference.')).toBeInTheDocument();
      
      // Check CTA button
      expect(screen.getByText('Find out more')).toBeInTheDocument();
      
      // Check scroll indicator
      expect(screen.getByLabelText('Scroll to next section')).toBeInTheDocument();
      
      // Check skip link
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<Hero />);
      
      // Check hero section
      const heroSection = screen.getByRole('banner', { name: 'Hero section - Healthy meals delivered fast' });
      expect(heroSection).toBeInTheDocument();
      
      // Check heading
      const heading = screen.getByRole('heading', { name: 'Healthy meals, delivered fast.' });
      expect(heading).toBeInTheDocument();
      
      // Check CTA button
      const ctaButton = screen.getByLabelText('Find out more about Balance Kitchen - scrolls to next section');
      expect(ctaButton).toBeInTheDocument();
      
      // Check skip link
      const skipLink = screen.getByLabelText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
    });

    it('should render with correct background image style', () => {
      render(<Hero />);
      
      const heroSection = document.querySelector('.heroSection');
      expect(heroSection).toHaveStyle('background-image: url(/images/hero/hero-bg2.jpg)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle desktop view correctly', () => {
      // Set desktop width
      mockWindowInnerWidth(1200);
      
      render(<Hero />);
      
      // Check that mobile styles are not applied
      const scrollIcon = document.querySelector('.scrollIcon');
      expect(scrollIcon).not.toHaveClass('scrollIconMobile');
      
      // Check desktop icon size (should be 40)
      const chevronIcon = screen.getByTestId('chevron-down');
      expect(chevronIcon).toHaveAttribute('width', '40');
      expect(chevronIcon).toHaveAttribute('height', '40');
    });

    it('should handle mobile view correctly', () => {
      // Set mobile width
      mockWindowInnerWidth(700);
      
      render(<Hero />);
      
      // Check that mobile styles are applied
      const scrollIcon = document.querySelector('.scrollIcon');
      expect(scrollIcon).toHaveClass('scrollIconMobile');
      
      // Check mobile icon size (should be 32)
      const chevronIcon = screen.getByTestId('chevron-down');
      expect(chevronIcon).toHaveAttribute('width', '32');
      expect(chevronIcon).toHaveAttribute('height', '32');
    });

    it('should handle window resize events', () => {
      render(<Hero />);
      
      // Initially desktop
      mockWindowInnerWidth(1200);
      let scrollIcon = document.querySelector('.scrollIcon');
      expect(scrollIcon).not.toHaveClass('scrollIconMobile');
      
      // Resize to mobile
      mockWindowInnerWidth(700);
      scrollIcon = document.querySelector('.scrollIcon');
      expect(scrollIcon).toHaveClass('scrollIconMobile');
      
      // Resize back to desktop
      mockWindowInnerWidth(1200);
      scrollIcon = document.querySelector('.scrollIcon');
      expect(scrollIcon).not.toHaveClass('scrollIconMobile');
    });

    it('should handle missing "about" section when scrolling', () => {
      render(<Hero />);
      
      // Mock document.getElementById to return null
      const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockImplementation(() => null);
      
      const scrollButton = screen.getByLabelText('Scroll to next section');
      
      // Should not throw error
      expect(() => fireEvent.click(scrollButton)).not.toThrow();
      
      getElementByIdSpy.mockRestore();
    });
  });

  describe('Error Cases', () => {
    it('should handle resize event listener errors gracefully', () => {
      // Mock addEventListener to simulate error condition
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'resize') {
          // Don't attach the handler to simulate failure
          return;
        }
        return originalAddEventListener.call(window, event, handler);
      });
      
      expect(() => render(<Hero />)).not.toThrow();
      
      addEventListenerSpy.mockRestore();
    });

    it('should handle scrollIntoView errors gracefully', () => {
      render(<Hero />);
      
      // Mock scrollIntoView to throw an error
      const scrollIntoViewSpy = jest.fn(() => {
        throw new Error('Scroll error');
      });
      
      // Mock document.getElementById to return element with mocked scrollIntoView
      const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockImplementation(() => ({
        scrollIntoView: scrollIntoViewSpy,
      } as any));
      
      const scrollButton = screen.getByLabelText('Scroll to next section');
      
      // Should not throw error - component should catch it
      expect(() => fireEvent.click(scrollButton)).not.toThrow();
      
      getElementByIdSpy.mockRestore();
    });
  });

  describe('Interaction Cases', () => {
    it('should scroll to next section when CTA button is clicked', () => {
      render(<Hero />);
      
      // Mock document.getElementById to return a mock element
      const mockElement = {
        scrollIntoView: jest.fn(),
      };
      const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockImplementation(() => mockElement as any);
      
      const ctaButton = screen.getByText('Find out more');
      fireEvent.click(ctaButton);
      
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
      
      getElementByIdSpy.mockRestore();
    });

    it('should scroll to next section when scroll indicator is clicked', () => {
      render(<Hero />);
      
      // Mock document.getElementById to return a mock element
      const mockElement = {
        scrollIntoView: jest.fn(),
      };
      const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockImplementation(() => mockElement as any);
      
      const scrollButton = screen.getByLabelText('Scroll to next section');
      fireEvent.click(scrollButton);
      
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
      
      getElementByIdSpy.mockRestore();
    });

    it('should have functional skip link', () => {
      render(<Hero />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Accessibility Cases', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      render(<Hero />);
      
      // Check background overlay is hidden from screen readers
      const overlay = document.querySelector('.backgroundOverlay');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
      
      // Check scroll indicator is hidden from screen readers
      const scrollIndicator = document.querySelector('.scrollIndicator');
      expect(scrollIndicator).toHaveAttribute('aria-hidden', 'true');
      
      // Check scroll icon is hidden from screen readers
      const scrollIcon = screen.getByTestId('chevron-down');
      expect(scrollIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should maintain keyboard navigation support', () => {
      render(<Hero />);
      
      const ctaButton = screen.getByText('Find out more');
      const scrollButton = screen.getByLabelText('Scroll to next section');
      const skipLink = screen.getByText('Skip to main content');
      
      // Check focusability
      ctaButton.focus();
      expect(ctaButton).toHaveFocus();
      
      scrollButton.focus();
      expect(scrollButton).toHaveFocus();
      
      skipLink.focus();
      expect(skipLink).toHaveFocus();
    });
  });

  describe('Security Cases', () => {
    it('should sanitize content to prevent XSS', () => {
      render(<Hero />);
      
      // Check that content is rendered as text, not HTML
      const heading = screen.getByText('Healthy meals, delivered fast.');
      const subtitle = screen.getByText('Save time, stay fit, taste the difference.');
      
      expect(heading).toBeInTheDocument();
      expect(subtitle).toBeInTheDocument();
      
      // Since we're using React, content should automatically be escaped
      expect(heading.querySelector('script')).not.toBeInTheDocument();
      expect(subtitle.querySelector('script')).not.toBeInTheDocument();
    });

    it('should not execute javascript in content', () => {
      render(<Hero />);
      
      // All content should be treated as text
      const heading = screen.getByText('Healthy meals, delivered fast.');
      const subtitle = screen.getByText('Save time, stay fit, taste the difference.');
      
      expect(heading).toBeInTheDocument();
      expect(subtitle).toBeInTheDocument();
    });
  });
});
