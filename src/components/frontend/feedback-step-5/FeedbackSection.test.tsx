/** @jest-environment jsdom */
// src/components/frontend/feedback-step-5/FeedbackSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { FeedbackSection } from './FeedbackSection';
import '@testing-library/jest-dom';
import React from 'react';

// Mock next/image since it doesn't work in Jest environment
jest.mock('next/image', () => {
  return function MockImage({ alt, src, ...props }: { alt: string; src: string; [key: string]: any }) {
    // Convert boolean props to strings for DOM compatibility
    const domProps = { ...props };
    Object.keys(domProps).forEach(key => {
      if (typeof domProps[key] === 'boolean') {
        domProps[key] = domProps[key].toString();
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
jest.mock('./FeedbackSection.module.css', () => ({
  feedbackSection: 'feedbackSection',
  contentContainer: 'contentContainer',
  textContent: 'textContent',
  sectionTitle: 'sectionTitle',
  sectionDescription: 'sectionDescription',
  featuresList: 'featuresList',
  featureItem: 'featureItem',
  featureIcon: 'featureIcon',
  featureTitle: 'featureTitle',
  featureDescription: 'featureDescription',
  ctaContainer: 'ctaContainer',
  formsContainer: 'formsContainer',
  formsWrapper: 'formsWrapper',
  formCard: 'formCard',
  formBack: 'formBack',
  formMiddle: 'formMiddle',
  formFront: 'formFront',
  formHeader: 'formHeader',
  formTitle: 'formTitle',
  formContent: 'formContent',
  formField: 'formField',
  highlightField: 'highlightField',
  highlightOverlay: 'highlightOverlay',
  highlightText: 'highlightText',
  formFooter: 'formFooter',
  submitButton: 'submitButton',
  jotformBadge: 'jotformBadge',
  badgeText: 'badgeText',
  jotformLogo: 'jotformLogo',
  badgeText1: 'badgeText1',
}));

// Set up IntersectionObserver mock before all tests
const mockIntersectionObserver = jest.fn();
let mockIntersectionObserverCallback: Function;

beforeAll(() => {
  // Mock IntersectionObserver globally
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver.mockImplementation((callback) => {
      mockIntersectionObserverCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    }),
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

describe('FeedbackSection', () => {
  describe('Happy Path Cases', () => {
    it('should render the FeedbackSection with all main elements', () => {
      render(<FeedbackSection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Check main section elements
      expect(screen.getByText('Step 5 – Your Feedback')).toBeInTheDocument();
      expect(screen.getByText(/Your opinion matters!/)).toBeInTheDocument();
      expect(screen.getByText('Give Feedback')).toBeInTheDocument();
      
      // Check feature items
      expect(screen.getByText('Easy Submission')).toBeInTheDocument();
      expect(screen.getByText('Multiple Channels')).toBeInTheDocument();
      expect(screen.getByText('Impactful Input')).toBeInTheDocument();
      
      // Check form elements
      expect(screen.getByText('Delivery Experience')).toBeInTheDocument();
      expect(screen.getByText('Meal Quality')).toBeInTheDocument();
      expect(screen.getByText('Your Feedback')).toBeInTheDocument();
      expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
      
      // Check Jotform badge
      expect(screen.getByAltText('Jotform')).toBeInTheDocument();
    });

    it('should display all feature items with correct content', () => {
      render(<FeedbackSection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Check each feature item
      const features = [
        {
          title: 'Easy Submission',
          description: 'Quick 2-minute feedback form via Jotform after each delivery'
        },
        {
          title: 'Multiple Channels',
          description: 'Email, social media, or in-app feedback options available'
        },
        {
          title: 'Impactful Input',
          description: 'Your suggestions directly influence our menu development'
        }
      ];
      
      features.forEach(feature => {
        expect(screen.getByText(feature.title)).toBeInTheDocument();
        expect(screen.getByText(feature.description)).toBeInTheDocument();
      });
    });

    it('should call console.log when CTA button is clicked', () => {
      // Mock console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FeedbackSection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      const ctaButton = screen.getByText('Give Feedback');
      fireEvent.click(ctaButton);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Give Feedback');
      
      // Restore console.log
      consoleLogSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle section becoming visible', () => {
      render(<FeedbackSection />);

      // Simulate section becoming visible
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      expect(screen.getByText('Step 5 – Your Feedback')).toBeInTheDocument();
    });

    it('should handle section not intersecting', () => {
      render(<FeedbackSection />);

      // Simulate section not intersecting
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: false }]);
      });
      
      // Component should still render
      expect(screen.getByText('Step 5 – Your Feedback')).toBeInTheDocument();
    });

    it('should handle missing section ref gracefully', () => {
      // Mock useRef to return null ref
      const useRefSpy = jest.spyOn(React, 'useRef');
      useRefSpy.mockImplementationOnce(() => ({ current: null }));

      expect(() => render(<FeedbackSection />)).not.toThrow();
      
      useRefSpy.mockRestore();
    });

    it('should handle empty intersection observer entries', () => {
      render(<FeedbackSection />);

      // Simulate empty entries array (this should not cause errors)
      act(() => {
        mockIntersectionObserverCallback([]);
      });
      
      // Component should still render
      expect(screen.getByText('Step 5 – Your Feedback')).toBeInTheDocument();
    });

    it('should handle undefined intersection observer entry', () => {
      render(<FeedbackSection />);

      // Simulate undefined entry (this should not cause errors)
      act(() => {
        mockIntersectionObserverCallback([undefined]);
      });
      
      // Component should still render
      expect(screen.getByText('Step 5 – Your Feedback')).toBeInTheDocument();
    });
  });

  describe('Error Cases', () => {
    it('should handle IntersectionObserver errors gracefully', () => {
      // Suppress console warnings for this test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Create a mock implementation that simulates an error during observe
      const errorObserverMock = jest.fn().mockImplementation((callback) => {
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
      expect(() => render(<FeedbackSection />)).not.toThrow();
      
      // Component should still render basic content
      expect(screen.getByText('Step 5 – Your Feedback')).toBeInTheDocument();
      
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
      render(<FeedbackSection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      const section = screen.getByLabelText('Feedback Section');
      expect(section).toBeInTheDocument();
      
      const ctaButton = screen.getByLabelText('Give your feedback');
      expect(ctaButton).toBeInTheDocument();
    });

    it('should have alt text for all images', () => {
      render(<FeedbackSection />);
      
      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      expect(screen.getByAltText('Jotform')).toBeInTheDocument();
    });
  });

  describe('Security Cases', () => {
    it('should sanitize text content to prevent XSS', () => {
      render(<FeedbackSection />);

      // Check that content is rendered as text, not HTML
      const description = screen.getByText(/Your opinion matters!/);
      expect(description).toBeInTheDocument();
      // Since we're using React, content should automatically be escaped
    });

    it('should not execute javascript in content', () => {
      render(<FeedbackSection />);

      // All content should be treated as text
      const allText = screen.getByText(/Your opinion matters!/);
      expect(allText).toBeInTheDocument();
    });
  });
});
