/**
 * @jest-environment jsdom
 */
// components/admin/charts/SimpleChart.test.tsx
import { render, screen } from '@testing-library/react';
import SimpleChart from './SimpleChart';
import '@testing-library/jest-dom';

describe('SimpleChart', () => {
  const defaultProps = {
    title: 'Total Revenue',
    value: '$12,345',
    icon: '💰',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render chart with title, value, and icon', () => {
    render(<SimpleChart {...defaultProps} />);
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,345')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('should render chart with numeric value', () => {
    render(<SimpleChart {...defaultProps} value={12345} />);
    
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('should render chart with positive change indicator', () => {
    render(<SimpleChart {...defaultProps} change="+12.5%" />);
    
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    const changeElement = screen.getByText('+12.5%');
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('should render chart with negative change indicator', () => {
    render(<SimpleChart {...defaultProps} change="-5.2%" />);
    
    expect(screen.getByText('-5.2%')).toBeInTheDocument();
    const changeElement = screen.getByText('-5.2%');
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('should not render change indicator when not provided', () => {
    render(<SimpleChart {...defaultProps} />);
    
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
  });

  it('should apply correct styling classes', () => {
    render(<SimpleChart {...defaultProps} />);
    
    // Get the main container using querySelector
    const mainContainer = document.querySelector('.bg-white.shadow.rounded-lg.p-6');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('bg-white', 'shadow', 'rounded-lg', 'p-6');
    
    const iconContainer = screen.getByText('💰').closest('div');
    expect(iconContainer).toHaveClass('rounded-full', 'bg-blue-100', 'p-3');
    
    const icon = screen.getByText('💰');
    expect(icon).toHaveClass('text-blue-600', 'text-xl');
    
    const title = screen.getByText('Total Revenue');
    expect(title).toHaveClass('text-sm', 'font-medium', 'text-gray-500');
    
    const value = screen.getByText('$12,345');
    expect(value).toHaveClass('text-2xl', 'font-semibold', 'text-gray-900');
  });

  it('should render change indicator with correct styling for positive values', () => {
    render(<SimpleChart {...defaultProps} change="+8.3%" />);
    
    const changeElement = screen.getByText('+8.3%');
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('should render change indicator with correct styling for negative values', () => {
    render(<SimpleChart {...defaultProps} change="-3.7%" />);
    
    const changeElement = screen.getByText('-3.7%');
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('should handle zero change value', () => {
    render(<SimpleChart {...defaultProps} change="0%" />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    const changeElement = screen.getByText('0%');
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('should handle empty change string', () => {
    render(<SimpleChart {...defaultProps} change="" />);
    
    // Should still render the component without errors
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,345')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
    
    // Should not have any change text
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/-/)).not.toBeInTheDocument();
  });

  it('should handle special characters in title', () => {
    render(<SimpleChart {...defaultProps} title="Revenue & Growth" />);
    
    expect(screen.getByText('Revenue & Growth')).toBeInTheDocument();
  });

  it('should handle special characters in value', () => {
    render(<SimpleChart {...defaultProps} value="€12,345.67" />);
    
    expect(screen.getByText('€12,345.67')).toBeInTheDocument();
  });

  it('should handle emoji icons', () => {
    render(<SimpleChart {...defaultProps} icon="📈" />);
    
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('should handle long title text', () => {
    const longTitle = 'Very Long Chart Title That Might Cause Layout Issues';
    render(<SimpleChart {...defaultProps} title={longTitle} />);
    
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('should handle long value text', () => {
    const longValue = '$12,345,678.90 USD';
    render(<SimpleChart {...defaultProps} value={longValue} />);
    
    expect(screen.getByText(longValue)).toBeInTheDocument();
  });

  it('should handle long change text', () => {
    const longChange = '+123.456% YoY Growth';
    render(<SimpleChart {...defaultProps} change={longChange} />);
    
    expect(screen.getByText(longChange)).toBeInTheDocument();
  });

  it('should render correctly with all props provided', () => {
    render(
      <SimpleChart 
        title="Orders" 
        value="1,234" 
        change="+15.3%" 
        icon="📦" 
      />
    );
    
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('+15.3%')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
  });
});
