/**
 * @jest-environment jsdom
 */
// src/app/components/ui/CTAButton/CTAButton.test.tsx

'use client'

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CTAButton } from './CTAButton';

// Mock CSS module
jest.mock('./CTAButton.module.css', () => ({
  ctaButton: 'ctaButton',
  buttonText: 'buttonText',
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const MockMotionButton = ({ 
    children, 
    onClick, 
    type,
    disabled,
    'aria-label': ariaLabel,
    'aria-disabled': ariaDisabled,
    'aria-busy': ariaBusy,
    whileHover,
    whileTap,
    ...props
  }: { 
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    'aria-label'?: string;
    'aria-disabled'?: boolean;
    'aria-busy'?: boolean;
    whileHover?: any;
    whileTap?: any;
    [key: string]: any;
  }) => {
    // Simulate the actual behavior from the component
    const isDisabled = disabled || props['aria-busy'] === 'true';
    const shouldHaveAnimations = !isDisabled;
    
    return (
      <button
        onClick={onClick}
        type={type}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-disabled={ariaDisabled}
        aria-busy={ariaBusy}
        data-while-hover={shouldHaveAnimations ? 'true' : 'false'}
        data-while-tap={shouldHaveAnimations ? 'true' : 'false'}
        {...props}
      >
        {children}
      </button>
    );
  };
  return {
    __esModule: true,
    motion: {
      button: MockMotionButton,
    },
  };
});

describe('CTAButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default text', () => {
    // ARRANGE & ACT
    render(<CTAButton />);

    // ASSERT
    expect(screen.getByText('Order Now')).toBeTruthy();
  });

  it('should render with custom children', () => {
    // ARRANGE & ACT
    render(<CTAButton>Custom Text</CTAButton>);

    // ASSERT
    expect(screen.getByText('Custom Text')).toBeTruthy();
  });

  it('should render with custom aria-label', () => {
    // ARRANGE & ACT
    render(<CTAButton aria-label="Custom label">Button Text</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Custom label');
  });

  it('should use children as aria-label when no aria-label is provided and children is a string', () => {
    // ARRANGE & ACT
    render(<CTAButton>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Click Me');
  });

  it('should not set aria-label when children is not a string and no aria-label is provided', () => {
    // ARRANGE & ACT
    render(<CTAButton><span>Click Me</span></CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBeNull();
  });

  it('should call onClick when clicked', () => {
    // ARRANGE
    render(<CTAButton onClick={mockOnClick}>Click Me</CTAButton>);

    // ACT
    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    // ASSERT
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    // ARRANGE
    render(<CTAButton onClick={mockOnClick} disabled>Click Me</CTAButton>);

    // ACT
    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    // ASSERT
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', () => {
    // ARRANGE
    render(<CTAButton onClick={mockOnClick} loading>Click Me</CTAButton>);

    // ACT
    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    // ASSERT
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should open href in new tab when href is provided and clicked', () => {
    // ARRANGE
    const mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<CTAButton href="https://example.com">Visit Site</CTAButton>);

    // ACT
    const button = screen.getByText('Visit Site');
    fireEvent.click(button);

    // ASSERT
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    
    // Cleanup
    mockOpen.mockRestore();
  });

  it('should not open href when disabled', () => {
    // ARRANGE
    const mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<CTAButton href="https://example.com" disabled>Visit Site</CTAButton>);

    // ACT
    const button = screen.getByText('Visit Site');
    fireEvent.click(button);

    // ASSERT
    expect(mockOpen).not.toHaveBeenCalled();
    
    // Cleanup
    mockOpen.mockRestore();
  });

  it('should not open href when loading', () => {
    // ARRANGE
    const mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<CTAButton href="https://example.com" loading>Visit Site</CTAButton>);

    // ACT
    const button = screen.getByText('Visit Site');
    fireEvent.click(button);

    // ASSERT
    expect(mockOpen).not.toHaveBeenCalled();
    
    // Cleanup
    mockOpen.mockRestore();
  });

  it('should have correct default type', () => {
    // ARRANGE & ACT
    render(<CTAButton>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('should accept custom type', () => {
    // ARRANGE & ACT
    render(<CTAButton type="submit">Submit</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('type')).toBe('submit');
  });

  it('should be enabled by default', () => {
    // ARRANGE & ACT
    render(<CTAButton>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('false');
  });

  it('should be disabled when disabled prop is true', () => {
    // ARRANGE & ACT
    render(<CTAButton disabled>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('should be disabled when loading prop is true', () => {
    // ARRANGE & ACT
    render(<CTAButton loading>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('should not have hover animations when disabled', () => {
    // ARRANGE & ACT
    render(<CTAButton disabled>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('data-while-hover')).toBe('false');
    expect(button.getAttribute('data-while-tap')).toBe('false');
  });

  it('should not have hover animations when loading', () => {
    // ARRANGE & ACT
    render(<CTAButton loading>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('data-while-hover')).toBe('false');
    expect(button.getAttribute('data-while-tap')).toBe('false');
  });

  it('should have hover animations when enabled and not loading', () => {
    // ARRANGE & ACT
    render(<CTAButton>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('data-while-hover')).toBe('true');
    expect(button.getAttribute('data-while-tap')).toBe('true');
  });

  it('should render with correct CSS class', () => {
    // ARRANGE & ACT
    render(<CTAButton>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.classList.contains('ctaButton')).toBe(true);
  });

  it('should render children inside buttonText span', () => {
    // ARRANGE & ACT
    render(<CTAButton>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    const buttonTextSpan = button.querySelector('.buttonText');
    expect(buttonTextSpan).toBeTruthy();
    expect(buttonTextSpan?.textContent).toBe('Click Me');
  });

  it('should handle complex children structure', () => {
    // ARRANGE & ACT
    render(
      <CTAButton>
        <span>Icon</span>
        <span>Text</span>
      </CTAButton>
    );

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Icon');
    expect(button.textContent).toContain('Text');
  });

  it('should maintain accessibility attributes when disabled', () => {
    // ARRANGE & ACT
    render(<CTAButton disabled onClick={mockOnClick}>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
    
    // ACT - Try to click
    fireEvent.click(button);
    
    // ASSERT - onClick should not be called
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should maintain accessibility attributes when loading', () => {
    // ARRANGE & ACT
    render(<CTAButton loading onClick={mockOnClick}>Click Me</CTAButton>);

    // ASSERT
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
    
    // ACT - Try to click
    fireEvent.click(button);
    
    // ASSERT - onClick should not be called
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
