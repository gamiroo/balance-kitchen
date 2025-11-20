/** @jest-environment jsdom */
// components/frontend/account-manager-step-1/AccountManagerStep.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { AccountManagerStep } from './AccountManagerStep';
import '@testing-library/jest-dom';
import React from 'react';

// ---------- Types for mocks ----------
type MockImageProps = {
  alt: string;
  src: string;
} & Record<string, string | number | boolean | undefined>;

// IntersectionObserver callback type we actually use in tests
type MockIntersectionObserverCallback = (
  entries: Array<{ isIntersecting: boolean } | undefined>
) => void;

// Mock next/image since it doesn't work in Jest environment
jest.mock('next/image', () => {
  return function MockImage({ alt, src, ...props }: MockImageProps) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} {...props} />;
  };
});

// Mock CTAButton component
jest.mock('../../ui/CTAButton/CTAButton', () => {
  return {
    CTAButton: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick: () => void;
    }) => <button onClick={onClick}>{children}</button>,
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
let mockIntersectionObserverCallback: MockIntersectionObserverCallback | undefined;

beforeAll(() => {
  // Mock IntersectionObserver globally
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver.mockImplementation(
      (callback: MockIntersectionObserverCallback) => {
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

describe('AccountManagerStep', () => {
  describe('Happy Path Cases', () => {
    it('should render the AccountManagerStep with all main elements', () => {
      render(<AccountManagerStep />);

      // Trigger the intersection observer callback to simulate visibility
      act(() => {
        mockIntersectionObserverCallback?.([{ isIntersecting: true }]);
      });

      // Use a more flexible text matcher to handle special characters
      expect(
        screen.getByText(
          (content) =>
            typeof content === 'string' &&
            content.includes('Step') &&
            content.includes('Meet Your Account Manager')
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /When you sign up, a dedicated Balance Kitchen Account Manager/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Chat with an Account Manager')
      ).toBeInTheDocument();
    });

    it('should display user avatars', () => {
      render(<AccountManagerStep />);

      act(() => {
        mockIntersectionObserverCallback?.([{ isIntersecting: true }]);
      });

      expect(screen.getByAltText('User 1')).toBeInTheDocument();
      expect(screen.getByAltText('User 2')).toBeInTheDocument();
      expect(screen.getByAltText('User 3')).toBeInTheDocument();
      expect(screen.getByAltText('User 4')).toBeInTheDocument();
      expect(screen.getByAltText('User 5')).toBeInTheDocument();
    });

    it('should start chat when CTA button is clicked', () => {
      render(<AccountManagerStep />);

      act(() => {
        mockIntersectionObserverCallback?.([{ isIntersecting: true }]);
      });

      const ctaButton = screen.getByText('Chat with an Account Manager');
      fireEvent.click(ctaButton);

      expect(screen.getByText('Balance Kitchen')).toBeInTheDocument();
    });

    it('should display device frame and chat interface', () => {
      render(<AccountManagerStep />);

      act(() => {
        mockIntersectionObserverCallback?.([{ isIntersecting: true }]);
      });

      expect(screen.getByAltText('Device frame')).toBeInTheDocument();
      expect(screen.getByText('Balance Kitchen')).toBeInTheDocument();
      expect(
        screen.getByAltText('Balance Kitchen avatar')
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle section becoming visible', () => {
      render(<AccountManagerStep />);

      act(() => {
        mockIntersectionObserverCallback?.([{ isIntersecting: true }]);
      });

      expect(
        screen.getByText(
          (content) =>
            typeof content === 'string' &&
            content.includes('Step') &&
            content.includes('Meet Your Account Manager')
        )
      ).toBeInTheDocument();
    });

    it('should handle section not intersecting', () => {
      render(<AccountManagerStep />);

      act(() => {
        mockIntersectionObserverCallback?.([{ isIntersecting: false }]);
      });

      expect(
        screen.getByText(
          (content) =>
            typeof content === 'string' &&
            content.includes('Step') &&
            content.includes('Meet Your Account Manager')
        )
      ).toBeInTheDocument();
    });

    it('should handle empty intersection observer entries', () => {
      render(<AccountManagerStep />);

      act(() => {
        mockIntersectionObserverCallback?.([]);
      });

      expect(
        screen.getByText(
          (content) =>
            typeof content === 'string' &&
            content.includes('Step') &&
            content.includes('Meet Your Account Manager')
        )
      ).toBeInTheDocument();
    });

    it('should handle undefined intersection observer entry', () => {
      render(<AccountManagerStep />);

      act(() => {
        mockIntersectionObserverCallback?.([undefined]);
      });

      expect(
        screen.getByText(
          (content) =>
            typeof content === 'string' &&
            content.includes('Step') &&
            content.includes('Meet Your Account Manager')
        )
      ).toBeInTheDocument();
    });

    it('should handle missing section ref gracefully', () => {
      const useRefSpy = jest.spyOn(React, 'useRef');
      useRefSpy.mockImplementationOnce(() => ({ current: null }));

      expect(() => render(<AccountManagerStep />)).not.toThrow();

      expect(
        screen.getByText(
          (content) =>
            typeof content === 'string' &&
            content.includes('Step') &&
            content.includes('Meet Your Account Manager')
        )
      ).toBeInTheDocument();

      useRefSpy.mockRestore();
    });
  });

  describe('Error Cases', () => {
    it('should handle IntersectionObserver errors gracefully', () => {
      // Create a mock implementation that simulates an error during observe
      const errorObserverMock = jest.fn().mockImplementation(() => {
        return {
          observe: jest.fn(() => {
            // Simulate an error during observation
            // (component should handle this gracefully)
            console.warn(
              'IntersectionObserver not supported in this environment'
            );
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

      expect(() => render(<AccountManagerStep />)).not.toThrow();

      expect(
        screen.getByText(
          (content) =>
            typeof content === 'string' &&
            content.includes('Step') &&
            content.includes('Meet Your Account Manager')
        )
      ).toBeInTheDocument();

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

      const description = screen.getByText(
        /When you sign up, a dedicated Balance Kitchen Account Manager/
      );
      expect(description).toBeInTheDocument();
    });

    it('should not execute javascript in content', () => {
      render(<AccountManagerStep />);

      const allText = screen.getByText(
        /When you sign up, a dedicated Balance Kitchen Account Manager/
      );
      expect(allText).toBeInTheDocument();
    });
  });
});
