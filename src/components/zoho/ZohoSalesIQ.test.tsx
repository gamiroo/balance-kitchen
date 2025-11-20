/**
 * @jest-environment jsdom
 */
// src/components/ZohoSalesIQ.test.tsx

'use client'

import React from 'react';
import { render } from '@testing-library/react';
import { ZohoSalesIQ } from './ZohoSalesIQ';

// Type for the Zoho global object
interface ZohoSalesIQGlobal {
  salesiq?: {
    widgetcode: string;
    values: object;
    ready: () => void;
  };
}

describe('ZohoSalesIQ', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window.$zoho
    if (typeof window !== 'undefined') {
      delete (window as unknown as { $zoho?: ZohoSalesIQGlobal }).$zoho;
    }
    
    // Clear any existing scripts
    const existingScript = document.getElementById('zsiqscript');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Add a mock script to the document head to avoid null parentNode issues
    const mockScript = document.createElement('script');
    mockScript.src = 'https://example.com/mock-script.js';
    document.head.appendChild(mockScript);
  });

  afterEach(() => {
    // Restore environment
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = originalNodeEnv;
    
    // Clean up mock script
    const mockScripts = document.querySelectorAll('script[src="https://example.com/mock-script.js"]');
    mockScripts.forEach(script => script.remove());
  });

  it('should not render any visible content', () => {
    // ARRANGE & ACT
    const { container } = render(<ZohoSalesIQ />);

    // ASSERT
    expect(container.children.length).toBe(0);
  });

  it('should not load script in development environment', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'development';
    
    // ACT
    render(<ZohoSalesIQ />);

    // ASSERT
    const script = document.getElementById('zsiqscript');
    expect(script).toBeNull();
  });

  it('should not load script when disabled prop is false', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    
    // ACT
    render(<ZohoSalesIQ enabled={false} />);

    // ASSERT
    const script = document.getElementById('zsiqscript');
    expect(script).toBeNull();
  });

  it('should load script in production environment when enabled', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    
    // ACT
    render(<ZohoSalesIQ />);

    // ASSERT
    const script = document.getElementById('zsiqscript');
    expect(script).toBeTruthy();
    if (script) {
      expect(script.getAttribute('src')).toBe('https://salesiq.zoho.com.au/widget');
      expect(script.getAttribute('type')).toBe('text/javascript');
      expect(script.hasAttribute('defer')).toBe(true);
    }
  });

  it('should initialize window.$zoho object with correct widget code', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    
    // ACT
    render(<ZohoSalesIQ />);

    // ASSERT
    const zohoWindow = window as unknown as { $zoho?: ZohoSalesIQGlobal };
    expect(zohoWindow.$zoho).toBeDefined();
    expect(zohoWindow.$zoho?.salesiq).toBeDefined();
    expect(zohoWindow.$zoho?.salesiq?.widgetcode).toBe("3274da875261252d9d22d19e914f360abb6bd28b6476690a2aa7ae9d06a44145");
    expect(zohoWindow.$zoho?.salesiq?.values).toEqual({});
    expect(typeof zohoWindow.$zoho?.salesiq?.ready).toBe('function');
  });

  it('should not reinitialize if already loaded', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    
    // Pre-initialize Zoho
    const zohoWindow = window as unknown as { $zoho?: ZohoSalesIQGlobal };
    zohoWindow.$zoho = {
      salesiq: {
        widgetcode: "existing-code",
        values: {},
        ready: function() {}
      }
    };

    // Spy on document.createElement to detect if script creation is attempted
    const createElementSpy = jest.spyOn(document, 'createElement');

    // ACT
    render(<ZohoSalesIQ />);

    // ASSERT
    expect(zohoWindow.$zoho?.salesiq?.widgetcode).toBe("existing-code"); // Should not change
    expect(createElementSpy).not.toHaveBeenCalledWith('script'); // Should not create new script
    
    // Cleanup
    createElementSpy.mockRestore();
  });

  it('should clean up script on unmount', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    const { unmount } = render(<ZohoSalesIQ />);

    // Verify script exists before unmount
    let script = document.getElementById('zsiqscript');
    expect(script).toBeTruthy();

    // ACT
    unmount();

    // ASSERT
    script = document.getElementById('zsiqscript');
    expect(script).toBeNull();
  });

  it('should handle cleanup when script does not exist', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    const { unmount } = render(<ZohoSalesIQ />);

    // Remove script manually before unmount
    const script = document.getElementById('zsiqscript');
    if (script) {
      script.remove();
    }

    // ACT & ASSERT
    expect(() => {
      unmount();
    }).not.toThrow(); // Should not throw error when script doesn't exist
  });

  it('should use default enabled value of true', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    
    // ACT
    render(<ZohoSalesIQ />); // No enabled prop passed

    // ASSERT
    const script = document.getElementById('zsiqscript');
    expect(script).toBeTruthy();
  });

  it('should handle edge case of missing script parent node gracefully', () => {
    // ARRANGE
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = 'production';
    
    // Remove all scripts to simulate edge case
    document.querySelectorAll('script').forEach(script => script.remove());
    
    // Mock document.getElementsByTagName to return script without parent
    const mockScript = document.createElement('script');
    Object.defineProperty(mockScript, 'parentNode', {
      value: null,
      writable: true
    });
    
    const originalGetElementsByTagName = document.getElementsByTagName;
    document.getElementsByTagName = jest.fn().mockReturnValue([mockScript]);

    // ACT
    expect(() => {
      render(<ZohoSalesIQ />);
    }).not.toThrow(); // Should not throw error even when parentNode is null

    // Restore original function
    document.getElementsByTagName = originalGetElementsByTagName;
  });
});
