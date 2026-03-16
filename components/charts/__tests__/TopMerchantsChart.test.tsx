// Unit tests for TopMerchantsChart component

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopMerchantsChart } from '../TopMerchantsChart';
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
  Bar: ({ data, options }: { data: { labels: string[]; datasets: { data: number[] }[] }; options: { indexAxis?: string } }) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-labels">{data.labels.join(',')}</div>
      <div data-testid="chart-data">{data.datasets[0].data.join(',')}</div>
      <div data-testid="chart-orientation">{options.indexAxis}</div>
    </div>
  ),
}));

describe('TopMerchantsChart', () => {
  const mockTransactions: Transaction[] = [
    { description: 'Amazon', date: new Date('2024-01-15'), amount: 200, account_id: 'acc1', category: 'Shopping', merchant: 'Amazon' },
    { description: 'Walmart', date: new Date('2024-01-16'), amount: 150, account_id: 'acc1', category: 'Groceries', merchant: 'Walmart' },
    { description: 'Amazon', date: new Date('2024-01-17'), amount: 100, account_id: 'acc1', category: 'Shopping', merchant: 'Amazon' },
    { description: 'Target', date: new Date('2024-01-18'), amount: 75, account_id: 'acc1', category: 'Shopping', merchant: 'Target' },
    { description: 'Costco', date: new Date('2024-01-19'), amount: 250, account_id: 'acc1', category: 'Groceries', merchant: 'Costco' },
  ];

  it('renders empty state when no transactions provided', () => {
    render(<TopMerchantsChart transactions={[]} />);
    const emptyState = screen.getByText('No merchant data available');
    expect(emptyState).toBeDefined();
  });

  it('renders horizontal bar chart with transaction data', () => {
    render(<TopMerchantsChart transactions={mockTransactions} />);
    const chart = screen.getByTestId('bar-chart');
    expect(chart).toBeDefined();
    
    // Verify horizontal orientation (indexAxis: 'y')
    const orientation = screen.getByTestId('chart-orientation').textContent;
    expect(orientation).toBe('y');
  });

  it('aggregates transactions by description correctly', () => {
    render(<TopMerchantsChart transactions={mockTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent;
    const data = screen.getByTestId('chart-data').textContent;
    
    // Amazon should be aggregated (200 + 100 = 300)
    expect(labels).toContain('Amazon');
    expect(labels).toContain('Walmart');
    expect(labels).toContain('Target');
    expect(labels).toContain('Costco');
    
    // Check that data contains the aggregated values
    expect(data).toContain('300'); // Amazon total
    expect(data).toContain('150'); // Walmart
    expect(data).toContain('75');  // Target
    expect(data).toContain('250'); // Costco
  });

  it('sorts merchants by amount in descending order', () => {
    render(<TopMerchantsChart transactions={mockTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent?.split(',') || [];
    
    // Should be sorted: Amazon (300), Costco (250), Walmart (150), Target (75)
    expect(labels[0]).toBe('Amazon');
    expect(labels[1]).toBe('Costco');
    expect(labels[2]).toBe('Walmart');
    expect(labels[3]).toBe('Target');
  });

  it('respects the limit prop for number of merchants shown', () => {
    render(<TopMerchantsChart transactions={mockTransactions} limit={2} />);
    
    const labels = screen.getByTestId('chart-labels').textContent?.split(',') || [];
    
    // Should only show top 2 merchants
    expect(labels).toHaveLength(2);
    expect(labels[0]).toBe('Amazon');
    expect(labels[1]).toBe('Costco');
  });

  it('defaults to showing top 5 merchants (compact layout)', () => {
    // Create 15 unique merchants
    const manyTransactions: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
      description: `Merchant ${i + 1}`,
      date: new Date('2024-01-15'),
      amount: (15 - i) * 10, // Descending amounts
      account_id: 'acc1',
      category: 'Shopping',
      merchant: `Merchant ${i + 1}`,
    }));

    render(<TopMerchantsChart transactions={manyTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent?.split(',') || [];
    
    // Should show only top 5 by default (compact layout)
    expect(labels).toHaveLength(5);
  });

  it('displays all unique merchants when fewer than limit', () => {
    render(<TopMerchantsChart transactions={mockTransactions} />);
    
    const labels = screen.getByTestId('chart-labels').textContent?.split(',') || [];
    
    // Should have 4 unique merchants (less than default limit of 10)
    expect(labels).toHaveLength(4);
  });
});
