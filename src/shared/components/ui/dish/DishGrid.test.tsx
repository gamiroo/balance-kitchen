/**
 * @jest-environment jsdom
 */
// app/components/DishGrid.test.tsx

'use client'

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DishGrid from './DishGrid';
import { Dish } from './DishCard';

// Mock CSS module
jest.mock('./DishGrid.module.css', () => ({
  dishGridContainer: 'dishGridContainer',
  disabledState: 'disabledState',
  loadingOverlay: 'loadingOverlay',
  loadingOverlayActive: 'loadingOverlayActive',
  loadingSpinner: 'loadingSpinner',
  categoryHeader: 'categoryHeader',
  categoryTitle: 'categoryTitle',
  categoryCarnivore: 'categoryCarnivore',
  categoryBalanced: 'categoryBalanced',
  categoryVegetarian: 'categoryVegetarian',
  categoryKeto: 'categoryKeto',
  categoryDefault: 'categoryDefault',
  categoryDescription: 'categoryDescription',
  ctaButtonContainer: 'ctaButtonContainer',
  gridContainer: 'gridContainer',
  gridItem: 'gridItem',
  gridItemContent: 'gridItemContent',
}));

// Mock DishCard component
jest.mock('./DishCard', () => {
  const MockDishCard = ({ dish, enableSwipe }: { dish: Dish; enableSwipe?: boolean }) => (
    <div 
      data-testid="mock-dish-card" 
      data-enable-swipe={enableSwipe}
      data-dish-id={dish.id}
    >
      <div>Dish: {dish.name}</div>
      <div>Category: {dish.category}</div>
    </div>
  );
  MockDishCard.displayName = 'MockDishCard';
  
  // Mock the Dish type
  const DishType = {};
  
  return {
    __esModule: true,
    default: MockDishCard,
    Dish: DishType,
  };
});

// Mock CTAButton component
jest.mock('../../ui/CTAButton/CTAButton', () => {
  const MockCTAButton = ({ 
    children, 
    onClick 
  }: { 
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button 
      onClick={onClick}
      data-testid="cta-button"
    >
      {children}
    </button>
  );
  MockCTAButton.displayName = 'MockCTAButton';
  return { CTAButton: MockCTAButton };
});

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ 
    children, 
    href
  }: { 
    children: React.ReactNode;
    href: string;
    passHref?: boolean;
  }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('DishGrid', () => {
  const mockDishes: Dish[] = [
    {
      id: '1',
      name: 'Grilled Salmon',
      description: 'Fresh salmon with herbs',
      category: 'Carnivore',
      image: '/images/salmon.jpg',
      allergens: ['fish'],
      ingredients: ['Salmon', 'Herbs'],
      calories: 350,
      protein: 35,
      carbs: 5,
      fat: 20,
      liked: false,
    },
    {
      id: '2',
      name: 'Vegetable Stir Fry',
      description: 'Mixed vegetables with tofu',
      category: 'Vegetarian',
      image: '/images/stir-fry.jpg',
      allergens: ['soy'],
      ingredients: ['Tofu', 'Vegetables'],
      calories: 250,
      protein: 15,
      carbs: 20,
      fat: 10,
      liked: true,
    },
    {
      id: '3',
      name: 'Keto Burger',
      description: 'Low-carb burger',
      category: 'Keto',
      image: '/images/burger.jpg',
      allergens: ['dairy'],
      ingredients: ['Beef', 'Cheese'],
      calories: 450,
      protein: 30,
      carbs: 5,
      fat: 30,
      liked: false,
    },
  ];

  const mockOnViewMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any timers
    jest.useRealTimers();
  });

  it('should render category header with correct information', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

    // ASSERT
    expect(screen.getByText('Carnivore')).toBeTruthy();
    expect(screen.getByText('Discover our delicious carnivore options')).toBeTruthy();
  });

  it('should render all dish cards', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Mixed" onViewMore={mockOnViewMore} />);

    // ASSERT
    const dishCards = screen.getAllByTestId('mock-dish-card');
    expect(dishCards).toHaveLength(3);
    
    // Check that all dishes are rendered
    expect(dishCards[0]).toHaveAttribute('data-dish-id', '1');
    expect(dishCards[1]).toHaveAttribute('data-dish-id', '2');
    expect(dishCards[2]).toHaveAttribute('data-dish-id', '3');
  });

  it('should limit display to 3 dishes even when more are provided', () => {
    // ARRANGE
    const manyDishes = [...mockDishes, ...mockDishes, ...mockDishes]; // 9 dishes
    
    // ACT
    render(<DishGrid dishes={manyDishes} category="Mixed" onViewMore={mockOnViewMore} />);

    // ASSERT
    const dishCards = screen.getAllByTestId('mock-dish-card');
    expect(dishCards).toHaveLength(3); // Should only render 3
  });

  it('should not render anything when no dishes are provided', () => {
    // ARRANGE & ACT
    const { container } = render(<DishGrid dishes={[]} category="Empty" onViewMore={mockOnViewMore} />);

    // ASSERT
    expect(container.firstChild).toBeNull();
  });

  it('should render View More button with correct link', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

    // ASSERT
    const link = screen.getByTestId('mock-link');
    expect(link).toHaveAttribute('href', '/menu#carnivore');
    
    const button = screen.getByTestId('cta-button');
    expect(button).toHaveTextContent('View More');
  });

  it('should call onViewMore when View More button is clicked', () => {
    // ARRANGE
    render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

    // ACT
    const button = screen.getByTestId('cta-button');
    fireEvent.click(button);

    // ASSERT
    expect(mockOnViewMore).toHaveBeenCalledTimes(1);
  });

it('should apply correct category color class based on category', () => {
  // ARRANGE & ACT
  render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

  // ASSERT
  // The categoryCarnivore class is on the h2 title element
  const categoryTitle = screen.getByRole('heading', { level: 2 });
  expect(categoryTitle).toHaveClass('categoryCarnivore');
});

  it('should pass enableSwipe prop to DishCard components', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Mixed" onViewMore={mockOnViewMore} enableSwipe={true} />);

    // ASSERT
    const dishCards = screen.getAllByTestId('mock-dish-card');
    dishCards.forEach(card => {
      expect(card).toHaveAttribute('data-enable-swipe', 'true');
    });
  });

  it('should pass default enableSwipe value as false', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Mixed" onViewMore={mockOnViewMore} />);

    // ASSERT
    const dishCards = screen.getAllByTestId('mock-dish-card');
    dishCards.forEach(card => {
      expect(card).toHaveAttribute('data-enable-swipe', 'false');
    });
  });

  it('should generate correct category slug for URL', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Mixed Category" onViewMore={mockOnViewMore} />);

    // ASSERT
    const link = screen.getByTestId('mock-link');
    expect(link).toHaveAttribute('href', '/menu#mixed-category');
  });

  it('should have proper accessibility attributes', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

    // ASSERT
    const container = screen.getByRole('region');
    expect(container).toHaveAttribute('aria-label', 'Carnivore dishes grid');
    expect(container).toHaveAttribute('aria-busy', 'false');
  });

  it('should show loading state when onViewMore is called', async () => {
    // ARRANGE
    jest.useFakeTimers();
    render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

    // ACT
    const button = screen.getByTestId('cta-button');
    fireEvent.click(button);

    // ASSERT
    // Check that aria-busy is set to true
    const container = screen.getByRole('region');
    expect(container).toHaveAttribute('aria-busy', 'true');
    
    // Fast forward timers wrapped in act
    jest.runAllTimers();
    
    // Cleanup
    jest.useRealTimers();
  });

  it('should apply disabled state class during loading', async () => {
    // ARRANGE
    jest.useFakeTimers();
    render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

    // ACT
    const button = screen.getByTestId('cta-button');
    fireEvent.click(button);

    // ASSERT
    const container = screen.getByRole('region');
    expect(container).toHaveClass('disabledState');
    
    // Fast forward timers
    jest.runAllTimers();
    
    // Cleanup
    jest.useRealTimers();
  });

  it('should render loading overlay during loading state', () => {
    // ARRANGE
    jest.useFakeTimers();
    render(<DishGrid dishes={mockDishes} category="Carnivore" onViewMore={mockOnViewMore} />);

    // ACT
    const button = screen.getByTestId('cta-button');
    fireEvent.click(button);

    // ASSERT
    // The loading overlay should be present (we can check for the spinner)
    const spinners = screen.queryAllByLabelText('Loading more dishes');
    expect(spinners.length).toBeGreaterThan(0);
    
    // Fast forward timers
    jest.advanceTimersByTime(1000);
    
    // Cleanup
    jest.useRealTimers();
  });

  it('should handle special characters in category name for slug generation', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Keto & Low-Carb" onViewMore={mockOnViewMore} />);

    // ASSERT
    const link = screen.getByTestId('mock-link');
    expect(link).toHaveAttribute('href', '/menu#keto-&-low-carb');
  });

  it('should render different category descriptions based on category', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Vegetarian" onViewMore={mockOnViewMore} />);

    // ASSERT
    expect(screen.getByText('Discover our delicious vegetarian options')).toBeTruthy();
  });

  it('should render dish cards in the correct order', () => {
    // ARRANGE & ACT
    render(<DishGrid dishes={mockDishes} category="Mixed" onViewMore={mockOnViewMore} />);

    // ASSERT
    const dishCards = screen.getAllByTestId('mock-dish-card');
    expect(dishCards[0]).toHaveTextContent('Grilled Salmon');
    expect(dishCards[1]).toHaveTextContent('Vegetable Stir Fry');
    expect(dishCards[2]).toHaveTextContent('Keto Burger');
  });
});
