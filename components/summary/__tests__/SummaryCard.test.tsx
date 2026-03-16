// Unit tests for SummaryCard component

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../SummaryCard';

describe('SummaryCard', () => {
  it('renders title and value', () => {
    render(<SummaryCard title="Total Spending" value="$1,234.56" />);
    
    expect(screen.getByText('Total Spending')).toBeDefined();
    expect(screen.getByText('$1,234.56')).toBeDefined();
  });

  it('renders with an icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">🥕</span>;
    
    render(
      <SummaryCard 
        title="Top Category" 
        value="Groceries" 
        icon={<TestIcon />} 
      />
    );
    
    expect(screen.getByText('Top Category')).toBeDefined();
    expect(screen.getByText('Groceries')).toBeDefined();
    expect(screen.getByTestId('test-icon')).toBeDefined();
  });

  it('renders without icon when not provided', () => {
    const { container } = render(
      <SummaryCard title="Average Monthly" value="$500.00" />
    );
    
    expect(screen.getByText('Average Monthly')).toBeDefined();
    expect(screen.getByText('$500.00')).toBeDefined();
    // Icon container should not be present
    expect(container.querySelector('[data-testid="test-icon"]')).toBeNull();
  });
});
