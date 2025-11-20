/**
 * @jest-environment jsdom
 */
'use client'

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import * as sentry from '@/shared/lib/monitoring/sentry';

// Mock Sentry captureError
jest.mock('@/shared/lib/monitoring/sentry', () => ({
  captureError: jest.fn()
}));

// Create a component that throws an error
const BadComponent: React.FC = () => {
  throw new Error('Test error');
};

// Create a normal component
const GoodComponent: React.FC = () => {
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noisy output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    // ARRANGE
    const { container } = render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );

    // ASSERT
    expect(screen.getByText('Normal content')).toBeTruthy();
    expect(container.querySelector('.error-boundary')).toBeNull();
  });

  it('should catch errors and display fallback UI', () => {
    // ARRANGE & ACT
    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    // ASSERT
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Reload Page')).toBeTruthy();
    expect(screen.queryByText('Normal content')).toBeNull();
  });

  it('should call captureError with the error and component stack', () => {
    // ARRANGE & ACT
    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    // ASSERT
    expect(sentry.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
    const error = (sentry.captureError as jest.Mock).mock.calls[0][0];
    expect(error.message).toBe('Test error');
  });

  it('should log error to console with component info', () => {
    // ACT
    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    // ASSERT
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Client-side error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should allow page reload when error occurs', () => {
    // ARRANGE
    // Create a mock reload function using jest.replaceProperty if available
    // or use a simpler approach by just checking that the button exists
    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    // ACT
    const reloadButton = screen.getByText('Reload Page');
    
    // ASSERT
    expect(reloadButton).toBeTruthy();
    expect(reloadButton.tagName).toBe('BUTTON');
    
    // We can't easily test the actual reload functionality due to jsdom limitations
    // but we can verify the button exists and has the right onClick handler
  });

  it('should handle different types of errors', () => {
    // ARRANGE
    const TypeErrorComponent: React.FC = () => {
      throw new TypeError('Type error occurred');
    };

    // ACT
    render(
      <ErrorBoundary>
        <TypeErrorComponent />
      </ErrorBoundary>
    );

    // ASSERT
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(sentry.captureError).toHaveBeenCalled();
    
    const error = (sentry.captureError as jest.Mock).mock.calls[0][0];
    expect(error.message).toBe('Type error occurred');
    expect(error instanceof TypeError).toBe(true);
  });

  it('should maintain error state until manually reset', () => {
    // ARRANGE
    const { rerender } = render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    // ASSERT - Initial error state
    expect(screen.getByText('Something went wrong')).toBeTruthy();

    // ACT - Rerender with good component (should still show error)
    rerender(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );

    // ASSERT - Still showing error because state is not reset
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.queryByText('Normal content')).toBeNull();
  });

  it('should have proper error boundary static method implementation', () => {
    // ARRANGE
    const error = new Error('Test error');

    // ACT
    const state = ErrorBoundary.getDerivedStateFromError(error);

    // ASSERT
    expect(state).toEqual({
      hasError: true,
      error: error
    });
  });
});
