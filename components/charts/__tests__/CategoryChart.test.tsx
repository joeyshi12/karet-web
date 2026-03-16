// Unit tests for CategoryChart component

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryChart } from '../CategoryChart';
import { Transaction } from '@/lib/types/transaction';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Chart.js to avoid canvas rendering issues in tests
vi.mock('react-chartjs-2', () => ({
  Doughnut: ({ data }: { data: { labels: string[]; datasets: { data: number[] }[] } }) => (
    <div data-testid="doughnut-chart">
      <div data-testid="chart-labels">{data.labels.join(',')}</div>
      <div data-testid="chart-data">{data.datasets[0].data.join(',')}</div>
    </div>
  ),
}));

describe('CategoryChart', () => {
  const mockTransactions: Transaction[] = [
    { description: 'Grocery Store', date: new Date('2024-01-15'), amount: 150, account_id: 'acc1', category: 'Groceries', merchant: 'Whole Foods' },
    { description: 'Gas Station', date: new Date('2024-01-16'), amount: 50, account_id: 'acc1', category: 'Transportation', merchant: 'Shell' },
    { description: 'Restaurant', date: new Date('2024-01-17'), amount: 75, account_id: 'acc1', category: 'Dining', merchant: 'Chipotle' },
    { description: 'Supermarket', date: new Date('2024-01-18'), amount: 100, account_id: 'acc1', category: 'Groceries', merchant: 'Safeway' },
  ];

  it('renders empty state when no transactions provided', () => {
    render(<CategoryChart transactions={[]} />);
    const emptyState = screen.getByText('No category data available');
    expect(emptyState).toBeDefined();
  });

  it('renders doughnut chart with transaction data', () => {
    render(<CategoryChart transactions={mockTransactions} />);
    const chart = screen.getByTestId('doughnut-chart');
    expect(chart).toBeDefined();
  });

  it('aggregates transactions by category correctly', () => {
    render(<CategoryChart transactions={mockTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent;
    const data = screen.getByTestId('chart-data').textContent;
    
    // Groceries should be aggregated (150 + 100 = 250)
    expect(labels).toContain('Groceries');
    expect(labels).toContain('Transportation');
    expect(labels).toContain('Dining');
    
    // Check that data contains the aggregated values
    expect(data).toContain('250'); // Groceries total
    expect(data).toContain('50');  // Transportation
    expect(data).toContain('75');  // Dining
  });

  it('displays all unique categories', () => {
    render(<CategoryChart transactions={mockTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent;
    
    // Should have 3 unique categories
    const uniqueCategories = labels?.split(',') || [];
    expect(uniqueCategories).toHaveLength(3);
  });
});
