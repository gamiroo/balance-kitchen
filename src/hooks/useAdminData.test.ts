/**
 * @jest-environment jsdom
 */
// hooks/useAdminData.test.tsx
'use client';

import { renderHook, act } from '@testing-library/react';
import { useAdminData } from './useAdminData';

// Mock dependencies
jest.mock('../lib/utils/error-utils');
jest.mock('../lib/logging/logger');

// Mock fetch globally
global.fetch = jest.fn();

describe('useAdminData', () => {
  const mockEndpoint = '/api/admin/test';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Reset document visibility state for each test
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
      writable: true,
    });
  });

  describe('initial fetch', () => {
    it('should fetch data successfully', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '1', name: 'Test Data' }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // ASSERT - Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT - After fetch
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({ id: '1', name: 'Test Data' });
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(mockEndpoint, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    });

    it('should handle array data', async () => {
      // ARRANGE
      const mockData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockData
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown[]>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.data).toEqual(mockData);
    });

    it('should handle HTTP errors', async () => {
      // ARRANGE
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Not Found' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Not Found');
    });

    it('should handle HTTP errors without error message', async () => {
      // ARRANGE
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({})
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.error).toBe('HTTP error! status: 500');
    });

    it('should handle API success=false responses', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Database connection failed'
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.error).toBe('Database connection failed');
    });

    it('should handle API success=false without error message', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.error).toBe('Failed to fetch data');
    });

    it('should handle fetch errors', async () => {
      // ARRANGE
      const error = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValue(error);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.error).toBe('Network error');
    });

    it('should handle non-Error objects', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockRejectedValue('String error');

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.error).toBe('An error occurred');
    });

    it('should handle JSON parsing errors', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.error).toBe('Invalid JSON');
    });
  });

  describe('refetch', () => {
    it('should refetch data when refetch function is called', async () => {
      // ARRANGE
      const mockResponse1 = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '1', name: 'Initial Data' }
        })
      };
      const mockResponse2 = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '2', name: 'Updated Data' }
        })
      };
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Refetch
      await act(async () => {
        result.current.refetch();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT
      expect(result.current.data).toEqual({ id: '2', name: 'Updated Data' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('revalidateOnFocus', () => {
    it('should setup and cleanup focus event listeners', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '1', name: 'Test Data' }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Spy on addEventListener
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      // ACT
      const { unmount } = renderHook(() => useAdminData<unknown>(mockEndpoint, {
        revalidateOnFocus: true
      }));

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT - Event listeners added
      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

      // Unmount to trigger cleanup
      unmount();

      // ASSERT - Event listeners removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

      // Cleanup
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('revalidateOnReconnect', () => {
    it('should setup and cleanup online event listeners', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '1', name: 'Test Data' }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Spy on addEventListener
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      // ACT
      const { unmount } = renderHook(() => useAdminData<unknown>(mockEndpoint, {
        revalidateOnReconnect: true
      }));

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT - Event listeners added
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));

      // Unmount to trigger cleanup
      unmount();

      // ASSERT - Event listeners removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));

      // Cleanup
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('refreshInterval', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should setup interval', () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '1', name: 'Test Data' }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Spy on setInterval
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      // ACT
      renderHook(() => useAdminData<unknown>(mockEndpoint, {
        refreshInterval: 1000
      }));

      // ASSERT - Interval set
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      // Cleanup
      setIntervalSpy.mockRestore();
    });
  });

  describe('state management', () => {
    it('should manage loading state correctly', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '1', name: 'Test Data' }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // ACT
      const { result } = renderHook(() => useAdminData<unknown>(mockEndpoint));

      // ASSERT - During initial fetch
      expect(result.current.loading).toBe(true);

      // Wait for fetch to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // ASSERT - After fetch
      expect(result.current.loading).toBe(false);
    });
  });
});
