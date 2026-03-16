// Unit tests for MonthlyTrendChart component

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonthlyTrendChart } from '../MonthlyTrendChart';
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
  Bar: ({ data }: { data: { labels: string[]; datasets: { data: number[] }[] } }) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-labels">{data.labels.join(',')}</div>
      <div data-testid="chart-data">{data.datasets[0].data.join(',')}</div>
    </div>
  ),
}));

describe('MonthlyTrendChart', () => {
  const mockTransactions: Transaction[] = [
    { description: 'Grocery Store', date: new Date('2024-01-15'), amount: 150, account_id: 'acc1', category: 'Groceries', merchant: 'Whole Foods' },
    { description: 'Gas Station', date: new Date('2024-01-20'), amount: 50, account_id: 'acc1', category: 'Transportation', merchant: 'Shell' },
    { description: 'Restaurant', date: new Date('2024-02-10'), amount: 75, account_id: 'acc1', category: 'Dining', merchant: 'Chipotle' },
    { description: 'Supermarket', date: new Date('2024-02-15'), amount: 100, account_id: 'acc1', category: 'Groceries', merchant: 'Safeway' },
    { description: 'Coffee Shop', date: new Date('2024-03-05'), amount: 25, account_id: 'acc1', category: 'Dining', merchant: 'Starbucks' },
  ];

  it('renders empty state when no transactions provided', () => {
    render(<MonthlyTrendChart transactions={[]} />);
    const emptyState = screen.getByText('No monthly data available');
    expect(emptyState).toBeDefined();
  });

  it('renders bar chart with transaction data', () => {
    render(<MonthlyTrendChart transactions={mockTransactions} />);
    const chart = screen.getByTestId('bar-chart');
    expect(chart).toBeDefined();
  });

  it('aggregates transactions by month correctly', () => {
    render(<MonthlyTrendChart transactions={mockTransactions} />);
    
    const data = screen.getByTestId('chart-data').textContent;
    
    // January: 150 + 50 = 200
    // February: 75 + 100 = 175
    // March: 25
    expect(data).toContain('200'); // January total
    expect(data).toContain('175'); // February total
    expect(data).toContain('25');  // March total
  });

  it('displays months in chronological order', () => {
    render(<MonthlyTrendChart transactions={mockTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent;
    
    // Labels should be in chronological order: Jan 2024, Feb 2024, Mar 2024
    expect(labels).toMatch(/Jan.*Feb.*Mar/);
  });

  it('formats month labels correctly', () => {
    render(<MonthlyTrendChart transactions={mockTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent;
    
    // Should contain formatted month labels
    expect(labels).toContain('Jan 2024');
    expect(labels).toContain('Feb 2024');
    expect(labels).toContain('Mar 2024');
  });

  it('displays at most 12 months when more data is available', () => {
    // Create transactions spanning 14 months
    const manyMonthsTransactions: Transaction[] = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(2023, i, 15); // Starting from Jan 2023
      manyMonthsTransactions.push({
        description: `Transaction ${i}`,
        date,
        amount: 100 + i * 10,
        account_id: 'acc1',
        category: 'Test',
        merchant: null,
      });
    }

    render(<MonthlyTrendChart transactions={manyMonthsTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent;
    const monthCount = labels?.split(',').length || 0;
    
    // Should display exactly 12 months (the most recent ones)
    expect(monthCount).toBe(12);
  });

  it('shows most recent 12 months when more data available', () => {
    // Create transactions spanning 14 months
    const manyMonthsTransactions: Transaction[] = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(2023, i, 15); // Jan 2023 to Feb 2024
      manyMonthsTransactions.push({
        description: `Transaction ${i}`,
        date,
        amount: 100,
        account_id: 'acc1',
        category: 'Test',
        merchant: null,
      });
    }

    render(<MonthlyTrendChart transactions={manyMonthsTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent;
    
    // Should NOT contain Jan 2023 (oldest month, should be cut off)
    expect(labels).not.toContain('Jan 2023');
    // Should contain Feb 2024 (most recent month)
    expect(labels).toContain('Feb 2024');
  });
});
