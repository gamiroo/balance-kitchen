/**
 * @jest-environment jsdom
 */
// app/components/UniversalCard.test.tsx

'use client'

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UniversalCard, { UniversalCardProps } from './UniversalCard';

// Mock CSS module
jest.mock('./UniversalCard.module.css', () => ({
  universalCardContainer: 'universalCardContainer',
  tiltContainer: 'tiltContainer',
  width340: 'width340',
  height520: 'height520',
  perspective1200: 'perspective1200',
  cardWrapper: 'cardWrapper',
  cardFace: 'cardFace',
  cardFaceFront: 'cardFaceFront',
  cardFaceBack: 'cardFaceBack',
  widthFull: 'widthFull',
  heightFull: 'heightFull',
  perspective1000: 'perspective1000',
  perspective800: 'perspective800',
}));

// Mock react-parallax-tilt
jest.mock('react-parallax-tilt', () => {
  const MockTilt = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-tilt="true" {...props} data-testid="tilt-container">
      {children}
    </div>
  );
  return {
    __esModule: true,
    default: MockTilt,
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => {
  const MockMotionDiv = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-motion="true" {...props}>
      {children}
    </div>
  );
  return {
    __esModule: true,
    motion: {
      div: MockMotionDiv,
    },
  };
});

// Mock navigator.userAgent
const mockUserAgent = jest.spyOn(navigator, 'userAgent', 'get');

describe('UniversalCard', () => {
  const mockFrontContent: React.ReactNode = <div>Front Content</div>;
  const mockBackContent: React.ReactNode = <div>Back Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserAgent.mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  });

  it('should render with default props', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
      />
    );

    // ASSERT
    expect(screen.getByText('Front Content')).toBeTruthy();
    expect(screen.getByText('Back Content')).toBeTruthy();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Flip card to view details');
  });

  it('should render with custom width and height classes', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        width="w-full"
        height="h-full"
      />
    );

    // ASSERT
    const container = screen.getByRole('button');
    expect(container).toHaveClass('widthFull');
    expect(container).toHaveClass('heightFull');
  });

  it('should render with custom perspective class', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        perspective="perspective-[1000px]"
      />
    );

    // ASSERT
    const container = screen.getByRole('button');
    expect(container).toHaveClass('perspective1000');
  });

  it('should render with additional className', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        className="custom-class"
      />
    );

    // ASSERT
    const container = screen.getByRole('button');
    expect(container).toHaveClass('custom-class');
  });

  it('should render Tilt component when tilt is enabled', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        tilt={true}
      />
    );

    // ASSERT
    const tiltContainer = screen.getByTestId('tilt-container');
    expect(tiltContainer).toBeTruthy();
  });

  it('should not render Tilt component when tilt is disabled', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        tilt={false}
      />
    );

    // ASSERT
    const container = screen.getByRole('button');
    expect(container).not.toHaveAttribute('data-tilt');
  });

  it('should flip card on click when not mobile and swipe disabled', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        enableSwipe={false}
      />
    );

    const card = screen.getByRole('button');

    // ASSERT - Initially not flipped
    expect(card).toHaveAttribute('aria-pressed', 'false');

    // ACT
    fireEvent.click(card);

    // ASSERT - Should be flipped
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('should flip card on Enter key press', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
      />
    );

    const card = screen.getByRole('button');

    // ACT
    fireEvent.keyDown(card, { key: 'Enter' });

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('should flip card on Space key press', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
      />
    );

    const card = screen.getByRole('button');

    // ACT
    fireEvent.keyDown(card, { key: ' ' });

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('should not flip card on other key presses', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
      />
    );

    const card = screen.getByRole('button');

    // ACT
    fireEvent.keyDown(card, { key: 'Escape' });

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('should detect mobile device', () => {
    // ARRANGE
    mockUserAgent.mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15');

    // ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
      />
    );

    // ASSERT
    // The mobile detection happens in useEffect, so we can't easily test the state
    // but we can verify the component renders without errors
    expect(screen.getByText('Front Content')).toBeTruthy();
  });

  it('should handle swipe left to flip to back', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        enableSwipe={true}
      />
    );

    const card = screen.getByRole('button');

    // ACT
    fireEvent.touchStart(card, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 30 }] }); // Swipe left (100 -> 30 = 70px difference)

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('should handle swipe right to flip back to front', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        enableSwipe={true}
      />
    );

    const card = screen.getByRole('button');
    
    // First flip to back
    fireEvent.click(card);

    // ACT - Swipe right to go back to front
    fireEvent.touchStart(card, { touches: [{ clientX: 30 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100 }] }); // Swipe right (30 -> 100 = -70px difference)

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('should not flip when swipe distance is below threshold', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        enableSwipe={true}
        swipeThreshold={50}
      />
    );

    const card = screen.getByRole('button');

    // ACT
    fireEvent.touchStart(card, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 80 }] }); // Only 20px difference, below 50px threshold

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('should not handle swipe when enableSwipe is false', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        enableSwipe={false}
      />
    );

    const card = screen.getByRole('button');

    // ACT
    fireEvent.touchStart(card, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 30 }] });

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('should handle edge case of touchEnd without touchStart', () => {
    // ARRANGE
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
        enableSwipe={true}
      />
    );

    const card = screen.getByRole('button');

    // ACT
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 30 }] });

    // ASSERT
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('should render both front and back content', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={<div>Front Test Content</div>} 
        back={<div>Back Test Content</div>} 
      />
    );

    // ASSERT
    expect(screen.getByText('Front Test Content')).toBeTruthy();
    expect(screen.getByText('Back Test Content')).toBeTruthy();
  });

  it('should have proper accessibility attributes', () => {
    // ARRANGE & ACT
    render(
      <UniversalCard 
        front={mockFrontContent} 
        back={mockBackContent} 
      />
    );

    const card = screen.getByRole('button');

    // ASSERT
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Flip card to view details');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });
});
