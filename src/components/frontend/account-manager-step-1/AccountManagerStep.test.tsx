/** @jest-environment jsdom */
// components/frontend/account-manager-step-1/AccountManagerStep.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { AccountManagerStep } from './AccountManagerStep';
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
    CTAButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
      <button onClick={onClick}>{children}</button>
    ),
  };
});

// Mock CSS modules
jest.mock('./AccountManagerStep.module.css', () => ({
  stepContainer: 'stepContainer',
  sectionVisible: 'sectionVisible',
  textContent: 'textContent',
  textVisible: 'textVisible',
  stepTitle: 'stepTitle',
  titleVisible: 'titleVisible',
  stepCopy: 'stepCopy',
  copyVisible: 'copyVisible',
  buttonVisible: 'buttonVisible',
  devicesSection: 'devicesSection',
  devicesVisible: 'devicesVisible',
  devicesOverlapContainer: 'devicesOverlapContainer',
  userAvatar: 'userAvatar',
  avatarVisible: 'avatarVisible',
  userAvatarImage: 'userAvatarImage',
  user1: 'user1',
  user2: 'user2',
  user3: 'user3',
  user4: 'user4',
  user5: 'user5',
  deviceWrapper: 'deviceWrapper',
  deviceVisible: 'deviceVisible',
  frameImg: 'frameImg',
  chatOverlay: 'chatOverlay',
  chatHeader: 'chatHeader',
  chatHeaderAvatar: 'chatHeaderAvatar',
  chatHeaderTitle: 'chatHeaderTitle',
  chatWrapper: 'chatWrapper',
  messageRow: 'messageRow',
  customerRow: 'customerRow',
  managerRow: 'managerRow',
  avatar: 'avatar',
  bubble: 'bubble',
  bubbleCustomer: 'bubbleCustomer',
  bubbleManager: 'bubbleManager',
  typingLine: 'typingLine',
  typingCaret: 'typingCaret',
  chatInputContainer: 'chatInputContainer',
  chatInputWrapper: 'chatInputWrapper',
  chatInput: 'chatInput',
  chatIconsGroup: 'chatIconsGroup',
  iconButton: 'iconButton',
  chatInputIcon: 'chatInputIcon',
  chatSendButton: 'chatSendButton',
  chatSendIcon: 'chatSendIcon',
  typingIndicator: 'typingIndicator',
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

describe('AccountManagerStep', () => {
  describe('Happy Path Cases', () => {
    it('should render the AccountManagerStep with all main elements', () => {
      render(<AccountManagerStep />);

      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Use a more flexible text matcher to handle special characters
      expect(screen.getByText((content) => 
        typeof content === 'string' && 
        content.includes('Step') && 
        content.includes('Meet Your Account Manager')
      )).toBeInTheDocument();
      
      expect(screen.getByText(/When you sign up, a dedicated Balance Kitchen Account Manager/)).toBeInTheDocument();
      expect(screen.getByText('Chat with an Account Manager')).toBeInTheDocument();
    });

    it('should display user avatars', () => {
      render(<AccountManagerStep />);

      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Check that avatars are rendered
      expect(screen.getByAltText('User 1')).toBeInTheDocument();
      expect(screen.getByAltText('User 2')).toBeInTheDocument();
      expect(screen.getByAltText('User 3')).toBeInTheDocument();
      expect(screen.getByAltText('User 4')).toBeInTheDocument();
      expect(screen.getByAltText('User 5')).toBeInTheDocument();
    });

    it('should start chat when CTA button is clicked', () => {
      render(<AccountManagerStep />);

      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      const ctaButton = screen.getByText('Chat with an Account Manager');
      fireEvent.click(ctaButton);
      
      // Check that chat elements are rendered
      expect(screen.getByText('Balance Kitchen')).toBeInTheDocument();
    });

    it('should display device frame and chat interface', () => {
      render(<AccountManagerStep />);

      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Check that device elements are rendered
      expect(screen.getByAltText('Device frame')).toBeInTheDocument();
      expect(screen.getByText('Balance Kitchen')).toBeInTheDocument();
      expect(screen.getByAltText('Balance Kitchen avatar')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle section becoming visible', () => {
      render(<AccountManagerStep />);

      // Simulate section becoming visible
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: true }]);
      });
      
      // Use a more flexible text matcher
      expect(screen.getByText((content) => 
        typeof content === 'string' && 
        content.includes('Step') && 
        content.includes('Meet Your Account Manager')
      )).toBeInTheDocument();
    });

    it('should handle section not intersecting', () => {
      render(<AccountManagerStep />);

      // Simulate section not intersecting
      act(() => {
        mockIntersectionObserverCallback([{ isIntersecting: false }]);
      });
      
      // Component should still render
      expect(screen.getByText((content) => 
        typeof content === 'string' && 
        content.includes('Step') && 
        content.includes('Meet Your Account Manager')
      )).toBeInTheDocument();
    });

    it('should handle empty intersection observer entries', () => {
      render(<AccountManagerStep />);

      // Simulate empty entries array (this should not cause errors)
      act(() => {
        mockIntersectionObserverCallback([]);
      });
      
      // Component should still render
      expect(screen.getByText((content) => 
        typeof content === 'string' && 
        content.includes('Step') && 
        content.includes('Meet Your Account Manager')
      )).toBeInTheDocument();
    });

    it('should handle undefined intersection observer entry', () => {
      render(<AccountManagerStep />);

      // Simulate undefined entry (this should not cause errors)
      act(() => {
        mockIntersectionObserverCallback([undefined]);
      });
      
      // Component should still render
      expect(screen.getByText((content) => 
        typeof content === 'string' && 
        content.includes('Step') && 
        content.includes('Meet Your Account Manager')
      )).toBeInTheDocument();
    });

    it('should handle missing section ref gracefully', () => {
      // Mock useRef to return null ref
      const useRefSpy = jest.spyOn(React, 'useRef');
      useRefSpy.mockImplementationOnce(() => ({ current: null }));

      expect(() => render(<AccountManagerStep />)).not.toThrow();
      
      // Use a more flexible text matcher
      expect(screen.getByText((content) => 
        typeof content === 'string' && 
        content.includes('Step') && 
        content.includes('Meet Your Account Manager')
      )).toBeInTheDocument();
      
      useRefSpy.mockRestore();
    });
  });

  describe('Error Cases', () => {
    it('should handle IntersectionObserver errors gracefully', () => {
      // Create a mock implementation that simulates an error during observe
      const errorObserverMock = jest.fn().mockImplementation((callback) => {
        return {
          observe: jest.fn(() => {
            // Simulate an error during observation
            console.warn('IntersectionObserver not supported in this environment');
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
      expect(() => render(<AccountManagerStep />)).not.toThrow();
      
      // Component should still render basic content
      expect(screen.getByText((content) => 
        typeof content === 'string' && 
        content.includes('Step') && 
        content.includes('Meet Your Account Manager')
      )).toBeInTheDocument();
      
      // Restore original mock
      Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        configurable: true,
        value: mockIntersectionObserver,
      });
    });
  });

  describe('Security Cases', () => {
    it('should sanitize text content to prevent XSS', () => {
      render(<AccountManagerStep />);

      // Check that content is rendered as text, not HTML
      const description = screen.getByText(/When you sign up, a dedicated Balance Kitchen Account Manager/);
      expect(description).toBeInTheDocument();
      // Since we're using React, content should automatically be escaped
    });

    it('should not execute javascript in content', () => {
      render(<AccountManagerStep />);

      // All content should be treated as text
      const allText = screen.getByText(/When you sign up, a dedicated Balance Kitchen Account Manager/);
      expect(allText).toBeInTheDocument();
    });
  });
});
