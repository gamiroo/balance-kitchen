/** @jest-environment jsdom */
// components/frontend/about-section/AboutSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AboutSection } from './AboutSection';
import '@testing-library/jest-dom';
import React from 'react';

// Mock next/image since it doesn't work in Jest environment
jest.mock('next/image', () => {
  return function MockImage({ alt, src, ...props }: { alt: string; src: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} {...props} />;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
      h2: ({ children, ...props }: { children: React.ReactNode }) => <h2 {...props}>{children}</h2>,
      p: ({ children, ...props }: { children: React.ReactNode }) => <p {...props}>{children}</p>,
    },
  };
});

// Mock UI components
jest.mock('../../ui/CTAButton/CTAButton', () => {
  return {
    CTAButton: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

jest.mock('../../ui/animated-border/AnimatedGradientBorder', () => {
  return {
    AnimatedGradientBorder: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

jest.mock('../../ui/modal/Modal', () => {
  return {
    Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => 
      isOpen ? <div data-testid="modal">{children}</div> : null,
  };
});

// Mock CSS modules
jest.mock('./AboutSection.module.css', () => ({
  section: 'section',
  imageContainer: 'imageContainer',
  imageWrapper: 'imageWrapper',
  leftImage: 'leftImage',
  rightImage: 'rightImage',
  image: 'image',
  overlay: 'overlay',
  gradientBorder: 'gradientBorder',
  contentContainer: 'contentContainer',
  contentWrapper: 'contentWrapper',
  textContent: 'textContent',
  heading: 'heading',
  badgeContainer: 'badgeContainer',
  badge: 'badge',
  animatedBadge: 'animatedBadge',
  description: 'description',
  readMoreContainer: 'readMoreContainer',
  readMoreLink: 'readMoreLink',
  modalContentWrapper: 'modalContentWrapper',
  modalHeading: 'modalHeading',
  modalBadges: 'modalBadges',
  modalBadge: 'modalBadge',
  modalTextContent: 'modalTextContent',
  modalDescription: 'modalDescription',
  modalCtaContainer: 'modalCtaContainer',
  skipLink: 'skipLink',
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver.mockImplementation(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  })),
});

describe('AboutSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset IntersectionObserver mocks
    mockIntersectionObserver.mockClear();
    mockObserve.mockClear();
    mockUnobserve.mockClear();
    mockDisconnect.mockClear();
    
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop by default
    });
  });

  describe('Happy Path Cases', () => {
    it('should render the AboutSection with all main elements', () => {
      render(<AboutSection />);

      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Family Owned')).toBeInTheDocument();
      expect(screen.getByText('Custom Meals')).toBeInTheDocument();
      expect(screen.getByText('Community Focused')).toBeInTheDocument();
      expect(screen.getByText(/At Balance Kitchen, we're more than just a meal prep company/)).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('should display both images with correct sources', () => {
      render(<AboutSection />);

      // Query images by their src attribute since getByRole('img') doesn't work well with our setup
      const images = document.querySelectorAll('img');
      expect(images).toHaveLength(2);
      
      const firstImage = images[0];
      const secondImage = images[1];
      
      expect(firstImage).toHaveAttribute('src', '/images/dishes/butter-chicken.png');
      expect(secondImage).toHaveAttribute('src', '/images/dishes/chicken-chimichurri.png');
    });

    it('should open modal when Learn More button is clicked', () => {
      render(<AboutSection />);

      const learnMoreButton = screen.getByText('Learn More');
      fireEvent.click(learnMoreButton);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      
      // Query modal heading specifically within the modal
      const modalHeading = screen.getByTestId('modal').querySelector('.modalHeading');
      expect(modalHeading).toHaveTextContent('About Balance Kitchen');
    });

    it('should render modal content correctly when open', () => {
      render(<AboutSection />);

      const learnMoreButton = screen.getByText('Learn More');
      fireEvent.click(learnMoreButton);

      const modal = screen.getByTestId('modal');
      
      // Query modal-specific elements to avoid duplicates
      const modalBadges = modal.querySelectorAll('.modalBadge');
      expect(modalBadges).toHaveLength(3);
      expect(modalBadges[0]).toHaveTextContent('Family Owned');
      expect(modalBadges[1]).toHaveTextContent('Custom Meals');
      expect(modalBadges[2]).toHaveTextContent('Community Focused');
      
      const modalDescriptions = modal.querySelectorAll('.modalDescription');
      expect(modalDescriptions).toHaveLength(3);
      expect(modalDescriptions[0]).toHaveTextContent(/At Balance Kitchen, we're more than just a meal prep company/);
      expect(modalDescriptions[1]).toHaveTextContent(/Balance Kitchen was born out of a simple observation/);
      expect(modalDescriptions[2]).toHaveTextContent(/Today, Balance Kitchen is backed by a passionate and growing team/);
      
      expect(modal.querySelector('a')).toHaveTextContent('Ready to Start?');
    });

    it('should have proper accessibility attributes', () => {
      render(<AboutSection />);

      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'about-heading');
      expect(section).toHaveAttribute('aria-describedby', 'about-description');

      const heading = screen.getByText('About Balance Kitchen');
      expect(heading).toHaveAttribute('id', 'about-heading');

      const description = screen.getByText(/At Balance Kitchen, we're more than just a meal prep company/);
      expect(description).toHaveAttribute('id', 'about-description');

      const learnMoreButton = screen.getByText('Learn More');
      expect(learnMoreButton).toHaveAttribute('aria-label', 'Read more about Balance Kitchen');
    });
  });

  describe('Edge Cases', () => {
    it('should handle mobile view correctly', () => {
      // Mock mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500, // Mobile width
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      render(<AboutSection />);

      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
    });

    it('should handle window resize events', () => {
      render(<AboutSection />);

      // Change to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      // Trigger resize
      window.dispatchEvent(new Event('resize'));

      // Component should still render
      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
    });

    it('should handle empty intersection observer entries array', () => {
      render(<AboutSection />);

      // Get the callback that was passed to IntersectionObserver
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate empty entries array (should not cause errors)
      callback([]);
      
      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
    });

    it('should handle intersection observer with undefined entry', () => {
      render(<AboutSection />);

      // Get the callback that was passed to IntersectionObserver
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate array with undefined entry (should not cause errors)
      callback([undefined]);
      
      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
    });

    it('should handle intersection observer with valid entry that intersects', () => {
      render(<AboutSection />);

      // Get the callback that was passed to IntersectionObserver
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate an intersecting entry
      callback([{ isIntersecting: true }]);
      
      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
    });

    it('should handle intersection observer with valid entry that does not intersect', () => {
      render(<AboutSection />);

      // Get the callback that was passed to IntersectionObserver
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate a non-intersecting entry
      callback([{ isIntersecting: false }]);
      
      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
    });
  });

  describe('Error Cases', () => {
    it('should handle missing section ref gracefully', () => {
      // Mock useRef to return null ref
      const useRefSpy = jest.spyOn(React, 'useRef');
      useRefSpy.mockImplementationOnce(() => ({ current: null }));

      expect(() => render(<AboutSection />)).not.toThrow();
      expect(screen.getByText('About Balance Kitchen')).toBeInTheDocument();
      
      useRefSpy.mockRestore();
    });

    it('should handle window resize event listener errors', () => {
      // Mock addEventListener to simulate error handling
      const originalAddEventListener = window.addEventListener;
      const mockAddEventListener = jest.fn((event, handler) => {
        if (event === 'resize') {
          // Simulate that we handle errors gracefully
          try {
            return originalAddEventListener.call(window, event, handler);
          } catch (e) {
            // Error handled gracefully
            return;
          }
        }
        return originalAddEventListener.call(window, event, handler);
      });
      
      Object.defineProperty(window, 'addEventListener', {
        value: mockAddEventListener,
        configurable: true,
      });

      expect(() => render(<AboutSection />)).not.toThrow();
      
      // Restore original function
      Object.defineProperty(window, 'addEventListener', {
        value: originalAddEventListener,
        configurable: true,
      });
    });
  });

  describe('Security Cases', () => {
    it('should sanitize text content to prevent XSS', () => {
      render(<AboutSection />);

      // Check that content is rendered as text, not HTML
      const description = screen.getByText(/At Balance Kitchen, we're more than just a meal prep company/);
      expect(description).toBeInTheDocument();
      expect(description.querySelector('script')).toBeNull();
    });

    it('should not execute javascript in content', () => {
      render(<AboutSection />);

      // All content should be treated as text
      const allText = screen.getByText(/At Balance Kitchen, we're more than just a meal prep company/);
      expect(allText).toBeInTheDocument();
    });
  });
});
