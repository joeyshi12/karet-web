// Unit tests for SpendingSummary component

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpendingSummary } from '../SpendingSummary';
import { Transaction } from '@/lib/types/transaction';

// Mock the transaction-utils module
vi.mock('@/lib/utils/transaction-utils', () => ({
  calculateTotalSpending: vi.fn(),
  calculateAverageMonthlySpending: vi.fn(),
  findTopCategory: vi.fn(),
  formatCurrency: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
}));

import {
  calculateTotalSpending,
  calculateAverageMonthlySpending,
  findTopCategory,
} from '@/lib/utils/transaction-utils';

const mockCalculateTotalSpending = vi.mocked(calculateTotalSpending);
const mockCalculateAverageMonthlySpending = vi.mocked(calculateAverageMonthlySpending);
const mockFindTopCategory = vi.mocked(findTopCategory);

describe('SpendingSummary', () => {
  const sampleTransactions: Transaction[] = [
    {
      description: 'Grocery Store',
      date: new Date('2024-01-15'),
      amount: 150.00,
      account_id: 'acc-001',
      category: 'Groceries',
      merchant: 'Whole Foods',
    },
    {
      description: 'Electric Company',
      date: new Date('2024-01-20'),
      amount: 100.00,
      account_id: 'acc-001',
      category: 'Utilities',
      merchant: 'PG&E',
    },
    {
      description: 'Restaurant',
      date: new Date('2024-02-10'),
      amount: 50.00,
      account_id: 'acc-001',
      category: 'Dining',
      merchant: 'Chipotle',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders total spending card with formatted value', () => {
    mockCalculateTotalSpending.mockReturnValue(300);
    mockCalculateAverageMonthlySpending.mockReturnValue(150);
    mockFindTopCategory.mockReturnValue({ category: 'Groceries', amount: 150 });

    render(<SpendingSummary transactions={sampleTransactions} />);

    expect(screen.getByText('Total Spending')).toBeDefined();
    expect(screen.getByText('$300.00')).toBeDefined();
  });

  it('renders monthly average card with formatted value', () => {
    mockCalculateTotalSpending.mockReturnValue(300);
    mockCalculateAverageMonthlySpending.mockReturnValue(150);
    mockFindTopCategory.mockReturnValue({ category: 'Groceries', amount: 150 });

    render(<SpendingSummary transactions={sampleTransactions} />);

    expect(screen.getByText('Monthly Average')).toBeDefined();
    expect(screen.getByText('$150.00')).toBeDefined();
  });

  it('renders top category card with category name and amount', () => {
    mockCalculateTotalSpending.mockReturnValue(300);
    mockCalculateAverageMonthlySpending.mockReturnValue(150);
    mockFindTopCategory.mockReturnValue({ category: 'Groceries', amount: 150 });

    render(<SpendingSummary transactions={sampleTransactions} />);

    expect(screen.getByText('Top Category')).toBeDefined();
    expect(screen.getByText('Groceries ($150.00)')).toBeDefined();
  });

  it('displays "No data" when no top category is found', () => {
    mockCalculateTotalSpending.mockReturnValue(0);
    mockCalculateAverageMonthlySpending.mockReturnValue(0);
    mockFindTopCategory.mockReturnValue(null);

    render(<SpendingSummary transactions={[]} />);

    expect(screen.getByText('No data')).toBeDefined();
  });

  it('calls utility functions with transactions prop', () => {
    mockCalculateTotalSpending.mockReturnValue(300);
    mockCalculateAverageMonthlySpending.mockReturnValue(150);
    mockFindTopCategory.mockReturnValue({ category: 'Groceries', amount: 150 });

    render(<SpendingSummary transactions={sampleTransactions} />);

    expect(mockCalculateTotalSpending).toHaveBeenCalledWith(sampleTransactions);
    expect(mockCalculateAverageMonthlySpending).toHaveBeenCalledWith(sampleTransactions);
    expect(mockFindTopCategory).toHaveBeenCalledWith(sampleTransactions);
  });

  it('renders all three summary cards', () => {
    mockCalculateTotalSpending.mockReturnValue(1000);
    mockCalculateAverageMonthlySpending.mockReturnValue(500);
    mockFindTopCategory.mockReturnValue({ category: 'Shopping', amount: 400 });

    render(<SpendingSummary transactions={sampleTransactions} />);

    expect(screen.getByText('Total Spending')).toBeDefined();
    expect(screen.getByText('Monthly Average')).toBeDefined();
    expect(screen.getByText('Top Category')).toBeDefined();
  });

  it('handles large currency values correctly', () => {
    mockCalculateTotalSpending.mockReturnValue(12500.50);
    mockCalculateAverageMonthlySpending.mockReturnValue(6250.25);
    mockFindTopCategory.mockReturnValue({ category: 'Rent', amount: 5000 });

    render(<SpendingSummary transactions={sampleTransactions} />);

    expect(screen.getByText('$12500.50')).toBeDefined();
    expect(screen.getByText('$6250.25')).toBeDefined();
    expect(screen.getByText('Rent ($5000.00)')).toBeDefined();
  });
});
