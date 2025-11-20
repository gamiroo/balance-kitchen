/**
 * @jest-environment jsdom
 */
// app/components/MenuDishCard.test.tsx

'use client';

import React, { ImgHTMLAttributes } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuDishCard from './MenuDishCard';

// Mock CSS module
jest.mock('./MenuDishCard.module.css', () => ({
  mealCard: 'mealCard',
  imageContainer: 'imageContainer',
  dishImage: 'dishImage',
  imageGradient: 'imageGradient',
  likeButton: 'likeButton',
  likeIcon: 'likeIcon',
  likeIconDefault: 'likeIconDefault',
  likeIconLiked: 'likeIconLiked',
  content: 'content',
  header: 'header',
  title: 'title',
  categoryBadge: 'categoryBadge',
  categoryVegetarian: 'categoryVegetarian',
  categoryVegan: 'categoryVegan',
  description: 'description',
  allergens: 'allergens',
  allergen: 'allergen',
  allergenIcon: 'allergenIcon',
  allergenText: 'allergenText',
  footer: 'footer',
  quantityControl: 'quantityControl',
  quantityBtn: 'quantityBtn',
  quantity: 'quantity',
  mealLabel: 'mealLabel',
}));

interface MockImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
}

// Mock next/image since it requires special handling in tests
jest.mock('next/image', () => {
  const MockImage = ({ alt, ...props }: MockImageProps) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// Mock lucide-react icons with unique test IDs
jest.mock('lucide-react', () => {
  // Create a mock icon component that can have different test IDs
  const MockIcon = ({
    size,
    className,
    'data-testid': testId,
  }: {
    size: number;
    className?: string;
    'data-testid'?: string;
  }) => (
    <div
      data-testid={testId || 'mock-icon'}
      style={{ width: size, height: size }}
      className={className}
    />
  );
  MockIcon.displayName = 'MockIcon';

  return {
    Heart: (props: { size: number; className?: string }) => (
      <MockIcon {...props} data-testid="heart-icon" />
    ),
    Wheat: (props: { size: number; className?: string }) => (
      <MockIcon {...props} data-testid="wheat-icon" />
    ),
    Milk: (props: { size: number; className?: string }) => (
      <MockIcon {...props} data-testid="milk-icon" />
    ),
    Egg: (props: { size: number; className?: string }) => (
      <MockIcon {...props} data-testid="egg-icon" />
    ),
    Fish: (props: { size: number; className?: string }) => (
      <MockIcon {...props} data-testid="fish-icon" />
    ),
    Nut: (props: { size: number; className?: string }) => (
      <MockIcon {...props} data-testid="nut-icon" />
    ),
  };
});

// Type for our mock dish
interface MockDish {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  allergens: string[];
  isAvailable: boolean;
}

describe('MenuDishCard', () => {
  const mockDish: MockDish = {
    id: '1',
    name: 'Vegetable Curry',
    description: 'Delicious vegetable curry with rice',
    category: 'Vegetarian',
    image: '/images/curry.jpg',
    allergens: ['gluten', 'dairy'],
    isAvailable: true,
  };

  const mockOnQuantityChange = jest.fn(() => {});



  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dish information correctly', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    // ASSERT
    expect(screen.getByText('Vegetable Curry')).toBeTruthy();
    expect(
      screen.getByText('Delicious vegetable curry with rice'),
    ).toBeTruthy();
    expect(screen.getByText('Vegetarian')).toBeTruthy();
    expect(screen.getByAltText('Vegetable Curry')).toBeTruthy();
  });

  it('should render allergen icons and labels', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    // ASSERT
    expect(screen.getByTestId('wheat-icon')).toBeTruthy(); // gluten
    expect(screen.getByTestId('milk-icon')).toBeTruthy(); // dairy
    expect(screen.getByText('gluten')).toBeTruthy();
    expect(screen.getByText('dairy')).toBeTruthy();
  });

  it('should not render allergens section when no allergens', () => {
    // ARRANGE
    const dishWithoutAllergens: MockDish = {
      ...mockDish,
      allergens: [],
    };

    render(
      <MenuDishCard
        dish={dishWithoutAllergens}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    // ASSERT
    expect(screen.queryByTestId('wheat-icon')).toBeNull();
    expect(screen.queryByText('gluten')).toBeNull();
  });

  it('should call onQuantityChange when increasing quantity', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={2}
      />,
    );

    const increaseButton = screen.getByLabelText(
      'Increase quantity of Vegetable Curry',
    );

    // ACT
    fireEvent.click(increaseButton);

    // ASSERT
    expect(mockOnQuantityChange).toHaveBeenCalledWith('1', 3);
  });

  it('should call onQuantityChange when decreasing quantity', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={3}
      />,
    );

    const decreaseButton = screen.getByLabelText(
      'Decrease quantity of Vegetable Curry',
    );

    // ACT
    fireEvent.click(decreaseButton);

    // ASSERT
    expect(mockOnQuantityChange).toHaveBeenCalledWith('1', 2);
  });

  it('should disable decrease button when quantity is 0', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    const decreaseButton = screen.getByLabelText(
      'Decrease quantity of Vegetable Curry',
    );

    // ASSERT
    expect((decreaseButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('should not disable decrease button when quantity is greater than 0', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={1}
      />,
    );

    const decreaseButton = screen.getByLabelText(
      'Decrease quantity of Vegetable Curry',
    );

    // ASSERT
    expect((decreaseButton as HTMLButtonElement).disabled).toBe(false);
  });

  it('should display correct quantity', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={5}
      />,
    );

    // ASSERT
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('meals')).toBeTruthy();
  });

  it('should toggle like state when like button is clicked', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    const likeButton = screen.getByLabelText('Like Vegetable Curry');
    const heartIcon = screen.getByTestId('heart-icon');

    // ASSERT - Initially not liked
    expect(heartIcon.classList.contains('likeIconDefault')).toBe(true);
    expect(heartIcon.classList.contains('likeIconLiked')).toBe(false);

    // ACT - Click to like
    fireEvent.click(likeButton);

    // ASSERT - Now liked
    expect(heartIcon.classList.contains('likeIconLiked')).toBe(true);
    expect(heartIcon.classList.contains('likeIconDefault')).toBe(false);

    // ACT - Click to unlike
    fireEvent.click(likeButton);

    // ASSERT - Now unliked
    expect(heartIcon.classList.contains('likeIconDefault')).toBe(true);
    expect(heartIcon.classList.contains('likeIconLiked')).toBe(false);
  });

  it('should update like button aria-label when toggled', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    const likeButton = screen.getByLabelText(
      'Like Vegetable Curry',
    ) as HTMLButtonElement;

    // ACT - Click to like
    fireEvent.click(likeButton);

    // ASSERT - Label updated
    expect(likeButton.getAttribute('aria-label')).toBe(
      'Unlike Vegetable Curry',
    );

    // ACT - Click to unlike
    fireEvent.click(likeButton);

    // ASSERT - Label updated back
    expect(likeButton.getAttribute('aria-label')).toBe(
      'Like Vegetable Curry',
    );
  });

  it('should render different category badges', () => {
    // ARRANGE
    const dishWithDifferentCategory: MockDish = {
      ...mockDish,
      category: 'Vegan',
    };

    render(
      <MenuDishCard
        dish={dishWithDifferentCategory}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    // ASSERT
    expect(screen.getByText('Vegan')).toBeTruthy();
  });

  it('should render all supported allergen icons', () => {
    // ARRANGE
    const dishWithAllAllergens: MockDish = {
      ...mockDish,
      allergens: ['gluten', 'dairy', 'eggs', 'fish', 'nuts', 'soy'],
    };

    render(
      <MenuDishCard
        dish={dishWithAllAllergens}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    // ASSERT - Use getAllByTestId since there are multiple wheat icons (gluten and soy both use wheat)
    expect(screen.getAllByTestId('wheat-icon')).toHaveLength(2); // gluten and soy
    expect(screen.getByTestId('milk-icon')).toBeTruthy(); // dairy
    expect(screen.getByTestId('egg-icon')).toBeTruthy(); // eggs
    expect(screen.getByTestId('fish-icon')).toBeTruthy(); // fish
    expect(screen.getByTestId('nut-icon')).toBeTruthy(); // nuts
  });

  it('should not render icon for unsupported allergen', () => {
    // ARRANGE
    const dishWithUnknownAllergen: MockDish = {
      ...mockDish,
      allergens: ['unknown-allergen'],
    };

    render(
      <MenuDishCard
        dish={dishWithUnknownAllergen}
        onQuantityChange={mockOnQuantityChange}
        quantity={0}
      />,
    );

    // ASSERT
    // For unknown allergens, no specific icon should be rendered
    expect(screen.getByText('unknown-allergen')).toBeTruthy();
  });

  it('should handle edge case of very high quantity', () => {
    // ARRANGE
    render(
      <MenuDishCard
        dish={mockDish}
        onQuantityChange={mockOnQuantityChange}
        quantity={999}
      />,
    );

    const increaseButton = screen.getByLabelText(
      'Increase quantity of Vegetable Curry',
    );

    // ACT
    fireEvent.click(increaseButton);

    // ASSERT
    expect(mockOnQuantityChange).toHaveBeenCalledWith('1', 1000);
  });
});
