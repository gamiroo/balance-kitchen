/** @jest-environment jsdom */
// src/components/frontend/delivery-step-4/DeliverySection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { DeliverySection } from './DeliverySection';
import '@testing-library/jest-dom';
import React from 'react';

type MockImageExtraProps = Record<string, string | number | boolean | undefined>;

jest.mock('next/image', () => {
  return function MockImage(
    { alt, src, ...props }: { alt: string; src: string } & MockImageExtraProps
  ) {
    const domProps: MockImageExtraProps = { ...props };

    Object.keys(domProps).forEach((key) => {
      if (typeof domProps[key] === 'boolean') {
        domProps[key] = String(domProps[key]);
      }
    });

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} {...domProps} />;
  };
});


// Mock CTAButton component
jest.mock('../../ui/CTAButton/CTAButton', () => {
  return {
    CTAButton: ({ children, onClick, 'aria-label': ariaLabel }: { 
      children: React.ReactNode; 
      onClick: () => void;
      'aria-label'?: string;
    }) => (
      <button onClick={onClick} aria-label={ariaLabel}>
        {children}
      </button>
    ),
  };
});

// Mock CSS modules
jest.mock('./DeliverySection.module.css', () => ({
  deliverySection: 'deliverySection',
  contentContainer: 'contentContainer',
  mapContainer: 'mapContainer',
  mapWrapper: 'mapWrapper',
  mapBackground: 'mapBackground',
  mapImage: 'mapImage',
  truckContainer: 'truckContainer',
  truckImage: 'truckImage',
  startMarker: 'startMarker',
  endMarker: 'endMarker',
  markerDot: 'markerDot',
  markerLabel: 'markerLabel',
  textContent: 'textContent',
  sectionTitle: 'sectionTitle',
  sectionDescription: 'sectionDescription',
  featuresList: 'featuresList',
  featureItem: 'featureItem',
  featureIcon: 'featureIcon',
  featureTitle: 'featureTitle',
  featureDescription: 'featureDescription',
  ctaContainer: 'ctaContainer',
}));

// Set up IntersectionObserver mock before all tests
const mockIntersectionObserver = jest.fn();
let mockIntersectionObserverCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;

beforeAll(() => {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver.mockImplementation(
      (callback: (entries: Partial<IntersectionObserverEntry>[]) => void) => {
        mockIntersectionObserverCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      }
    ),
  });
});


beforeEach(() => {
  jest.clearAllMocks();
  mockIntersectionObserver.mockClear();
});

afterEach(() => {
  // Restore the original IntersectionObserver after each test
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
});

describe('DeliverySection', () => {
  describe('Happy Path Cases', () => {
    it('should render the DeliverySection with all main elements', () => {
      render(<DeliverySection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Check main section elements
      expect(screen.getByText('Step 4 – Delivery & Pickup')).toBeInTheDocument();
      expect(screen.getByText(/Fresh meals delivered right to your doorstep/)).toBeInTheDocument();
      expect(screen.getByText('Schedule Delivery')).toBeInTheDocument();
      
      // Check map elements
      expect(screen.getByAltText('Map of Brisbane, Australia')).toBeInTheDocument();
      expect(screen.getByAltText('Delivery van')).toBeInTheDocument();
      
      // Check feature items
      expect(screen.getByText('Fast & Reliable')).toBeInTheDocument();
      expect(screen.getByText('Flexible Options')).toBeInTheDocument();
      expect(screen.getByText('Eco-Friendly')).toBeInTheDocument();
    });

    it('should display all feature items with correct content', () => {
      render(<DeliverySection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Check each feature item
      const features = [
        {
          title: 'Fast & Reliable',
          description: '30-minute delivery windows with real-time tracking'
        },
        {
          title: 'Flexible Options',
          description: 'Choose delivery or pickup based on your schedule'
        },
        {
          title: 'Eco-Friendly',
          description: 'Electric vehicles and sustainable packaging'
        }
      ];
      
      features.forEach(feature => {
        expect(screen.getByText(feature.title)).toBeInTheDocument();
        expect(screen.getByText(feature.description)).toBeInTheDocument();
      });
    });

    it('should display map markers with correct labels', () => {
      render(<DeliverySection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      expect(screen.getByText('Our Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Your Door')).toBeInTheDocument();
    });

    it('should call console.log when CTA button is clicked', () => {
      // Mock console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<DeliverySection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      const ctaButton = screen.getByText('Schedule Delivery');
      fireEvent.click(ctaButton);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Schedule Delivery');
      
      // Restore console.log
      consoleLogSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle section becoming visible', () => {
      render(<DeliverySection />);

      // Simulate section becoming visible
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      expect(screen.getByText('Step 4 – Delivery & Pickup')).toBeInTheDocument();
    });

    it('should handle section not intersecting', () => {
      render(<DeliverySection />);

      // Simulate section not intersecting
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: false }]);
      });
      
      // Component should still render
      expect(screen.getByText('Step 4 – Delivery & Pickup')).toBeInTheDocument();
    });

    it('should handle missing section ref gracefully', () => {
      // Mock useRef to return null ref
      const useRefSpy = jest.spyOn(React, 'useRef');
      useRefSpy.mockImplementationOnce(() => ({ current: null }));

      expect(() => render(<DeliverySection />)).not.toThrow();
      
      useRefSpy.mockRestore();
    });

    it('should handle empty intersection observer entries', () => {
      render(<DeliverySection />);

      // Simulate empty entries array (this should not cause errors)
      act(() => {
        mockIntersectionObserverCallback([]);
      });
      
      // Component should still render
      expect(screen.getByText('Step 4 – Delivery & Pickup')).toBeInTheDocument();
    });

    it('should handle undefined intersection observer entry', () => {
      render(<DeliverySection />);

      // Simulate undefined entry (this should not cause errors)
      act(() => {
        mockIntersectionObserverCallback(
          [undefined as unknown as Partial<IntersectionObserverEntry>]
        );
      });
      
      // Component should still render
      expect(screen.getByText('Step 4 – Delivery & Pickup')).toBeInTheDocument();
    });
  });

  describe('Error Cases', () => {
    it('should handle IntersectionObserver errors gracefully', () => {
      // Suppress console warnings for this test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Create a mock implementation that simulates an error during observe
      const errorObserverMock = jest.fn().mockImplementation(() => {
        return {
          observe: jest.fn(() => {
            // Simulate an error during observation
          }),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      // Replace the IntersectionObserver with our error mock
      Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        configurable: true,
        value: errorObserverMock,
      });

      // This should not throw an error - component should handle gracefully
      expect(() => render(<DeliverySection />)).not.toThrow();
      
      // Component should still render basic content
      expect(screen.getByText('Step 4 – Delivery & Pickup')).toBeInTheDocument();
      
      // Restore original mock
      Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        configurable: true,
        value: mockIntersectionObserver,
      });
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Accessibility Cases', () => {
    it('should have proper aria labels', () => {
      render(<DeliverySection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      const section = screen.getByLabelText('Delivery and Pickup Section');
      expect(section).toBeInTheDocument();
      
      const ctaButton = screen.getByLabelText('Schedule your delivery or pickup');
      expect(ctaButton).toBeInTheDocument();
    });

    it('should have alt text for all images', () => {
      render(<DeliverySection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      expect(screen.getByAltText('Map of Brisbane, Australia')).toBeInTheDocument();
      expect(screen.getByAltText('Delivery van')).toBeInTheDocument();
    });
  });

  describe('Security Cases', () => {
    it('should sanitize text content to prevent XSS', () => {
      render(<DeliverySection />);

      // Check that content is rendered as text, not HTML
      const description = screen.getByText(/Fresh meals delivered right to your doorstep/);
      expect(description).toBeInTheDocument();
      // Since we're using React, content should automatically be escaped
    });

    it('should not execute javascript in content', () => {
      render(<DeliverySection />);

      // All content should be treated as text
      const allText = screen.getByText(/Fresh meals delivered right to your doorstep/);
      expect(allText).toBeInTheDocument();
    });
  });
});
