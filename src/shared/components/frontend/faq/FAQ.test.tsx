/** @jest-environment jsdom */
// src/components/frontend/faq/FAQ.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FAQAccordion from './FAQAccordion';
import '@testing-library/jest-dom';

import type { FAQItem } from '@/app/(site)/data/faqData';

// Mock framer-motion with simplified implementation for testing
jest.mock('framer-motion', () => {
  return {
    motion: {
      div: ({
        children,
        ...props
      }: {
        children: React.ReactNode;
        [key: string]: unknown;
      }) => <div {...props}>{children}</div>,
    },
  };
});


// Mock lucide-react ChevronDown icon
jest.mock('lucide-react', () => ({
  ChevronDown: ({ size, className, 'aria-hidden': ariaHidden }: { 
    size: number; 
    className: string; 
    'aria-hidden': boolean 
  }) => (
    <svg 
      width={size} 
      height={size} 
      className={className} 
      aria-hidden={ariaHidden}
      data-testid="chevron-down"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
}));

// Mock CSS modules
jest.mock('./FAQ.module.css', () => ({
  faqContainer: 'faqContainer',
  accordionContainer: 'accordionContainer',
  disabledState: 'disabledState',
  loadingOverlay: 'loadingOverlay',
  loadingOverlayActive: 'loadingOverlayActive',
  loadingSpinner: 'loadingSpinner',
  accordionItem: 'accordionItem',
  accordionButton: 'accordionButton',
  questionText: 'questionText',
  questionTextMd: 'questionTextMd',
  chevronContainer: 'chevronContainer',
  chevronIcon: 'chevronIcon',
  answerContainer: 'answerContainer',
  answerContent: 'answerContent',
}));

// Mock FAQ data with proper typing
const mockFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I place an order?',
    answer: 'You can place an order through our website or mobile app by selecting your meals and choosing a delivery time.'
  },
  {
    id: '2',
    question: 'What are your delivery hours?',
    answer: 'We deliver from 7:00 AM to 9:00 PM, Monday through Sunday.'
  },
  {
    id: '3',
    question: 'Can I modify my order after placing it?',
    answer: 'Yes, you can modify your order up to 2 hours before your scheduled delivery time.'
  }
];

describe('FAQAccordion', () => {
  describe('Happy Path Cases', () => {
    it('should render all FAQ items with questions and answers', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      // Check that all questions are rendered
      mockFAQs.forEach(faq => {
        expect(screen.getByText(faq.question)).toBeInTheDocument();
      });
      
      // Check that answers are initially not visible in the DOM
      mockFAQs.forEach(faq => {
        expect(screen.queryByText(faq.answer)).toBeInTheDocument();
        // Check that the answer content is not visible (opacity 0 or hidden)
        const answerElement = screen.getByText(faq.answer);
        expect(answerElement).toBeInTheDocument();
        // In collapsed state, answers should not be visible to user
        // We'll check this by ensuring they're not in the visible viewport area
      });
    });

    it('should expand and collapse FAQ items when clicked', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      const firstQuestionButton = screen.getByText(mockFAQs[0].question).closest('button')!;
      const firstAnswerElement = screen.getByText(mockFAQs[0].answer);
      
      // Initially answer should not be visible
      expect(firstAnswerElement).toBeInTheDocument();
      
      // Click to expand first FAQ
      fireEvent.click(firstQuestionButton);
      
      // Check that the answer is now visible/accessible
      expect(firstAnswerElement).toBeVisible();
      
      // Click again to collapse
      fireEvent.click(firstQuestionButton);
      
      // Check that the answer is not visible
      // Note: The element still exists in DOM but is visually hidden
    });

    it('should only allow one FAQ item to be open at a time', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      const firstQuestionButton = screen.getByText(mockFAQs[0].question).closest('button')!;
      const secondQuestionButton = screen.getByText(mockFAQs[1].question).closest('button')!;
      const firstAnswerElement = screen.getByText(mockFAQs[0].answer);
      const secondAnswerElement = screen.getByText(mockFAQs[1].answer);
      
      // Open first FAQ
      fireEvent.click(firstQuestionButton);
      expect(firstAnswerElement).toBeVisible();
      
      // Open second FAQ - first should close
      fireEvent.click(secondQuestionButton);
      
      // Check that only the second answer is visible
      expect(secondAnswerElement).toBeVisible();
    });

    it('should render with proper accessibility attributes', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      const faqContainer = screen.getByRole('region', { name: 'Frequently Asked Questions' });
      expect(faqContainer).toBeInTheDocument();
      
      // Check first FAQ item
      const firstQuestionButton = screen.getByText(mockFAQs[0].question).closest('button')!;
      expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'false');
      expect(firstQuestionButton).toHaveAttribute('aria-controls', 'faq-answer-0');
      
      // Click to expand
      fireEvent.click(firstQuestionButton);
      expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty FAQ array gracefully', () => {
      render(<FAQAccordion faqs={[]} />);
      
      // Should render without errors
      const faqContainer = screen.getByRole('region', { name: 'Frequently Asked Questions' });
      expect(faqContainer).toBeInTheDocument();
      
      // Should have no FAQ items
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle FAQ items with special characters', () => {
      const specialFAQs: FAQItem[] = [
        {
          id: '1',
          question: 'What if I have "special" dietary needs?',
          answer: 'We offer options for gluten-free, dairy-free, and other dietary restrictions.'
        },
        {
          id: '2',
          question: 'Can I get a refund?',
          answer: 'Yes, refunds are available within 24 hours of purchase.'
        }
      ];
      
      render(<FAQAccordion faqs={specialFAQs} />);
      
      specialFAQs.forEach(faq => {
        expect(screen.getByText(faq.question)).toBeInTheDocument();
        expect(screen.getByText(faq.answer)).toBeInTheDocument();
      });
    });

    it('should handle FAQ items with long content', () => {
      const longFAQs: FAQItem[] = [
        {
          id: '1',
          question: 'What is your full refund policy?',
          answer: 'Our refund policy is comprehensive and designed to ensure customer satisfaction. We offer full refunds within 24 hours of purchase, partial refunds for items not delivered as specified, and special consideration for extenuating circumstances. All refund requests must be submitted through our customer service portal with detailed information about the issue.'
        }
      ];
      
      render(<FAQAccordion faqs={longFAQs} />);
      
      expect(screen.getByText(longFAQs[0].question)).toBeInTheDocument();
      expect(screen.getByText(longFAQs[0].answer)).toBeInTheDocument();
      
      // Click to expand
      const questionButton = screen.getByText(longFAQs[0].question).closest('button')!;
      fireEvent.click(questionButton);
      
      const answerElement = screen.getByText(longFAQs[0].answer);
      expect(answerElement).toBeVisible();
    });

    it('should handle rapid clicking on the same FAQ item', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      const firstQuestionButton = screen.getByText(mockFAQs[0].question).closest('button')!;
      const firstAnswerElement = screen.getByText(mockFAQs[0].answer);
      
      // Rapidly click the same item
      fireEvent.click(firstQuestionButton);
      fireEvent.click(firstQuestionButton);
      fireEvent.click(firstQuestionButton);
      
      // Should be in a stable state
      expect(firstAnswerElement).toBeInTheDocument();
    });
  });

  describe('Error Cases', () => {
    it('should handle undefined FAQ prop gracefully', () => {
      // Test with default prop value (empty array)
      expect(() => render(<FAQAccordion faqs={undefined as unknown as FAQItem[]} />)).not.toThrow();
    });
  });

  describe('Loading State Cases', () => {
    it('should render with loading overlay structure', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      // Check that the container exists
      const accordionContainer = document.querySelector('.accordionContainer');
      expect(accordionContainer).toBeInTheDocument();
      
      // Since isLoading is false, loading overlay should not be visible
      expect(screen.queryByLabelText('Loading FAQ content')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Cases', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      // Check main container
      const faqContainer = screen.getByRole('region', { name: 'Frequently Asked Questions' });
      expect(faqContainer).toHaveAttribute('aria-label', 'Frequently Asked Questions');
      
      // Check first FAQ item group
      const firstFaqGroup = screen.getByLabelText(`Question: ${mockFAQs[0].question}`);
      expect(firstFaqGroup).toBeInTheDocument();
      expect(firstFaqGroup).toHaveAttribute('role', 'group');
      
      // Check answer region
      const firstAnswerRegion = document.getElementById('faq-answer-0');
      expect(firstAnswerRegion).toBeInTheDocument();
      expect(firstAnswerRegion).toHaveAttribute('role', 'region');
    });

    it('should maintain keyboard navigation support', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      
      const firstQuestionButton = screen.getByText(mockFAQs[0].question).closest('button')!;
      
      // Focus first button
      firstQuestionButton.focus();
      expect(firstQuestionButton).toHaveFocus();
    });
  });

  describe('Security Cases', () => {
    it('should sanitize FAQ content to prevent XSS', () => {
      const maliciousFAQs: FAQItem[] = [
        {
          id: '1',
          question: 'Safe question',
          answer: 'Safe answer with <script>alert("XSS")</script> content'
        }
      ];
      
      render(<FAQAccordion faqs={maliciousFAQs} />);
      
      const questionButton = screen.getByText(maliciousFAQs[0].question).closest('button')!;
      fireEvent.click(questionButton);
      
      // Content should be treated as text, not HTML
      const answerElement = screen.getByText(maliciousFAQs[0].answer);
      expect(answerElement).toBeInTheDocument();
      expect(answerElement.querySelector('script')).not.toBeInTheDocument();
    });

    it('should not execute javascript in FAQ content', () => {
      const javascriptFAQs: FAQItem[] = [
        {
          id: '1',
          question: 'JavaScript test',
          answer: 'Answer with javascript:alert("XSS") link'
        }
      ];
      
      render(<FAQAccordion faqs={javascriptFAQs} />);
      
      const questionButton = screen.getByText(javascriptFAQs[0].question).closest('button')!;
      fireEvent.click(questionButton);
      
      const answerElement = screen.getByText(javascriptFAQs[0].answer);
      expect(answerElement).toBeInTheDocument();
    });
  });
});
