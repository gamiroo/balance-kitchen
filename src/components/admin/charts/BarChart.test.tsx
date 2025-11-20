/**
 * @jest-environment jsdom
 */
// components/admin/charts/BarChart.test.tsx
import { render } from '@testing-library/react';
import BarChart from './BarChart';
import '@testing-library/jest-dom';

// Mock canvas context
const mockFillRect = jest.fn();
const mockFillText = jest.fn();
const mockClearRect = jest.fn();
const mockFillStyleSetter = jest.fn();

// Create a mock context object
const mockContext = {
  clearRect: mockClearRect,
  fillRect: mockFillRect,
  fillText: mockFillText,
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  measureText: jest.fn(() => ({ width: 15 })),
  save: jest.fn(),
  restore: jest.fn(),
  fill: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    mockFillStyleSetter(value);
  },
  set font(value: string) {},
  set textAlign(value: CanvasTextAlign) {},
};

const mockGetContext = jest.fn(() => mockContext);

// Mock HTMLCanvasElement.prototype.getContext before tests
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext,
});

describe('BarChart', () => {
  const mockData = [
    { date: '2023-01-01', value: 10 },
    { date: '2023-01-02', value: 20 },
    { date: '2023-01-03', value: 15 },
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Chart',
    color: 'blue' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFillRect.mockClear();
    mockFillText.mockClear();
    mockClearRect.mockClear();
    mockFillStyleSetter.mockClear();
  });

  it('should render canvas element', () => {
    render(<BarChart {...defaultProps} />);
    
    // Query canvas by tag name since we can't add data-testid
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '600');
    expect(canvas).toHaveAttribute('height', '300');
  });

  it('should clear canvas on render', () => {
    render(<BarChart {...defaultProps} />);
    
    expect(mockClearRect).toHaveBeenCalledWith(0, 0, 600, 300);
  });

  it('should draw bars for each data point', () => {
    render(<BarChart {...defaultProps} />);
    
    // Check that fillRect was called for each bar (3 data points = 3 bars)
    expect(mockFillRect).toHaveBeenCalledTimes(3);
  });

  it('should draw value labels for each bar', () => {
    render(<BarChart {...defaultProps} />);
    
    // Check that fillText was called for each value (3 values + 3 dates + 1 title = 7)
    expect(mockFillText).toHaveBeenCalledWith('10', expect.any(Number), expect.any(Number));
    expect(mockFillText).toHaveBeenCalledWith('20', expect.any(Number), expect.any(Number));
    expect(mockFillText).toHaveBeenCalledWith('15', expect.any(Number), expect.any(Number));
  });

  it('should draw date labels for each bar', () => {
    render(<BarChart {...defaultProps} />);
    
    // Check that date labels are rendered
    expect(mockFillText).toHaveBeenCalledWith(
      expect.stringContaining('Jan'), 
      expect.any(Number), 
      expect.any(Number)
    );
  });

  it('should draw chart title', () => {
    render(<BarChart {...defaultProps} />);
    
    expect(mockFillText).toHaveBeenCalledWith('Test Chart', 10, 20);
  });

  it('should use blue color for bars when color prop is blue', () => {
    render(<BarChart {...defaultProps} color="blue" />);
    
    // Check that blue color was used
    expect(mockFillStyleSetter).toHaveBeenCalledWith('#3b82f6');
  });

  it('should use green color for bars when color prop is green', () => {
    render(<BarChart {...defaultProps} color="green" />);
    
    // Check that green color was used
    expect(mockFillStyleSetter).toHaveBeenCalledWith('#10b981');
  });

  it('should use purple color for bars when color prop is not blue or green', () => {
    render(<BarChart {...defaultProps} color="purple" />);
    
    // Check that purple color was used
    expect(mockFillStyleSetter).toHaveBeenCalledWith('#8b5cf6');
  });

  it('should handle empty data array gracefully', () => {
    render(<BarChart {...defaultProps} data={[]} />);
    
    // Should still clear canvas
    expect(mockClearRect).toHaveBeenCalledWith(0, 0, 600, 300);
    
    // Should not draw any bars
    expect(mockFillRect).not.toHaveBeenCalled();
    
    // Should still draw title
    expect(mockFillText).toHaveBeenCalledWith('Test Chart', 10, 20);
  });

  it('should handle single data point', () => {
    const singleData = [{ date: '2023-01-01', value: 50 }];
    render(<BarChart {...defaultProps} data={singleData} />);
    
    // Should draw one bar
    expect(mockFillRect).toHaveBeenCalledTimes(1);
    
    // Should draw one value label
    expect(mockFillText).toHaveBeenCalledWith('50', expect.any(Number), expect.any(Number));
    
    // Should draw one date label
    expect(mockFillText).toHaveBeenCalledWith(
      expect.stringContaining('Jan'), 
      expect.any(Number), 
      expect.any(Number)
    );
  });

  it('should handle zero values in data', () => {
    const zeroData = [
      { date: '2023-01-01', value: 0 },
      { date: '2023-01-02', value: 20 },
    ];
    render(<BarChart {...defaultProps} data={zeroData} />);
    
    // Should draw two bars
    expect(mockFillRect).toHaveBeenCalledTimes(2);
    
    // Should draw value labels including zero
    expect(mockFillText).toHaveBeenCalledWith('0', expect.any(Number), expect.any(Number));
    expect(mockFillText).toHaveBeenCalledWith('20', expect.any(Number), expect.any(Number));
  });

  it('should handle large values and scale appropriately', () => {
    const largeData = [
      { date: '2023-01-01', value: 1000 },
      { date: '2023-01-02', value: 500 },
    ];
    render(<BarChart {...defaultProps} data={largeData} />);
    
    // Should draw two bars
    expect(mockFillRect).toHaveBeenCalledTimes(2);
    
    // Should draw value labels
    expect(mockFillText).toHaveBeenCalledWith('1000', expect.any(Number), expect.any(Number));
    expect(mockFillText).toHaveBeenCalledWith('500', expect.any(Number), expect.any(Number));
  });

  it('should use default color when color prop is not provided', () => {
    const { color, ...propsWithoutColor } = defaultProps;
    render(<BarChart {...propsWithoutColor} />);
    
    // Should use blue as default color
    expect(mockFillStyleSetter).toHaveBeenCalledWith('#3b82f6');
  });

  it('should re-render when data prop changes', () => {
    const { rerender } = render(<BarChart {...defaultProps} />);
    
    // Initial render
    expect(mockClearRect).toHaveBeenCalledTimes(1);
    
    const newData = [
      { date: '2023-01-04', value: 30 },
      { date: '2023-01-05', value: 25 },
    ];
    
    rerender(<BarChart {...defaultProps} data={newData} />);
    
    // Should clear and redraw on data change
    expect(mockClearRect).toHaveBeenCalledTimes(2);
  });

  it('should re-render when title prop changes', () => {
    const { rerender } = render(<BarChart {...defaultProps} />);
    
    // Initial render
    expect(mockFillText).toHaveBeenCalledWith('Test Chart', 10, 20);
    
    rerender(<BarChart {...defaultProps} title="New Chart Title" />);
    
    // Should draw new title
    expect(mockFillText).toHaveBeenCalledWith('New Chart Title', 10, 20);
  });

  it('should re-render when color prop changes', () => {
    const { rerender } = render(<BarChart {...defaultProps} color="blue" />);
    expect(mockFillStyleSetter).toHaveBeenCalledWith('#3b82f6');
    
    rerender(<BarChart {...defaultProps} color="green" />);
    expect(mockFillStyleSetter).toHaveBeenCalledWith('#10b981');
  });
});
