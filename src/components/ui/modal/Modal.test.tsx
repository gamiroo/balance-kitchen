/**
 * @jest-environment jsdom
 */
// src/components/ui/modal/Modal.test.tsx
'use client'

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

// Mock CSS module
jest.mock('./Modal.module.css', () => ({
  modalOverlay: 'modalOverlay',
  modalContent: 'modalContent',
  modalHeader: 'modalHeader',
  modalLogoWrapper: 'modalLogoWrapper',
  modalTitle: 'modalTitle',
  modalCloseButton: 'modalCloseButton',
  modalBody: 'modalBody',
}));

// Mock next/image
jest.mock('next/image', () => {
  const MockImage = ({ alt, ...props }: { alt: string; [key: string]: any }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

describe('Modal', () => {
  const mockOnClose = jest.fn();
  const mockTitle = 'Test Modal';
  const mockChildren = <div>Modal Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clean up any body styles that might persist between tests
    document.body.style.overflow = '';
    document.body.removeAttribute('data-scroll-position');
  });

  it('should not render when isOpen is false', () => {
    // ARRANGE & ACT
    const { container } = render(
      <Modal 
        isOpen={false} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // ASSERT
    expect(container.children.length).toBe(0);
  });

  it('should render when isOpen is true', () => {
    // ARRANGE & ACT
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // ASSERT
    expect(screen.getByText('Test Modal')).toBeTruthy();
    expect(screen.getByText('Modal Content')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('should call onClose when overlay is clicked', () => {
    // ARRANGE
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    const overlay = screen.getByRole('dialog');

    // ACT
    fireEvent.click(overlay);

    // ASSERT
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close modal when content is clicked', () => {
    // ARRANGE
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    const content = screen.getByText('Modal Content').parentElement as HTMLElement;

    // ACT
    fireEvent.click(content);

    // ASSERT
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    // ARRANGE
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');

    // ACT
    fireEvent.click(closeButton);

    // ASSERT
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    // ARRANGE
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // ACT
    fireEvent.keyDown(document, { key: 'Escape' });

    // ASSERT
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when other keys are pressed', () => {
    // ARRANGE
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // ACT
    fireEvent.keyDown(document, { key: 'Enter' });

    // ASSERT
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should prevent body scroll when modal is open', () => {
    // ARRANGE & ACT
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // ASSERT
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when modal is closed', () => {
    // ARRANGE
    const { rerender } = render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // Verify scroll is hidden
    expect(document.body.style.overflow).toBe('hidden');

    // ACT - Close modal by rerendering with isOpen=false
    rerender(
      <Modal 
        isOpen={false} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // ASSERT
    expect(document.body.style.overflow).toBe('');
  });

  it('should store and restore scroll position', () => {
    // ARRANGE
    // Mock window scroll position
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    
    // Spy on scrollTo
    const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // ACT - Open modal
    const { rerender } = render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // Verify scroll position is stored
    expect(document.body.getAttribute('data-scroll-position')).toBe('100');

    // ACT - Close modal
    rerender(
      <Modal 
        isOpen={false} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // ASSERT
    expect(scrollToSpy).toHaveBeenCalledWith(0, 100);
    expect(document.body.getAttribute('data-scroll-position')).toBeNull();

    // Cleanup
    scrollToSpy.mockRestore();
  });

  it('should have proper accessibility attributes', () => {
    // ARRANGE & ACT
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    const dialog = screen.getByRole('dialog') as HTMLElement;
    const titleElement = screen.getByText('Test Modal') as HTMLElement;

    // ASSERT
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('modal-title');
    expect(titleElement.getAttribute('id')).toBe('modal-title');
  });

  it('should clean up event listeners on unmount', () => {
    // ARRANGE
    const { unmount } = render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    // Spy on removeEventListener
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    // ACT
    unmount();

    // ASSERT
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    // Cleanup
    removeEventListenerSpy.mockRestore();
  });

  it('should handle edge case of missing scroll position gracefully', () => {
    // ARRANGE
    // Remove any existing scroll position attribute
    document.body.removeAttribute('data-scroll-position');
    
    // Spy on scrollTo
    const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // ACT - Render and immediately unmount
    const { unmount } = render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title={mockTitle}
      >
        {mockChildren}
      </Modal>
    );

    unmount();

    // ASSERT
    // Should not throw error and scrollTo should not be called with invalid values
    expect(scrollToSpy).not.toHaveBeenCalledWith(0, NaN);

    // Cleanup
    scrollToSpy.mockRestore();
  });
});
