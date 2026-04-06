import { describe, it, expect } from 'vitest';
import { transactionMatchesCategoryFilter } from '../transaction-utils';
import { Transaction } from '@/lib/types/transaction';

const base: Omit<Transaction, 'category'> = {
  description: 'Test',
  date: new Date('2024-01-01'),
  amount: 1000,
  account_id: 'A',
  merchant: null,
};

describe('transactionMatchesCategoryFilter', () => {
  it('matches Uncategorized filter to null category', () => {
    const t: Transaction = { ...base, category: null };
    expect(transactionMatchesCategoryFilter(t, 'Uncategorized')).toBe(true);
  });

  it('matches Uncategorized filter to whitespace-only category', () => {
    const t: Transaction = { ...base, category: '   ' };
    expect(transactionMatchesCategoryFilter(t, 'Uncategorized')).toBe(true);
  });

  it('does not match Uncategorized to a real category', () => {
    const t: Transaction = { ...base, category: 'FOOD' };
    expect(transactionMatchesCategoryFilter(t, 'Uncategorized')).toBe(false);
  });

  it('matches literal Uncategorized string if present in data', () => {
    const t: Transaction = { ...base, category: 'Uncategorized' };
    expect(transactionMatchesCategoryFilter(t, 'Uncategorized')).toBe(true);
  });

  it('matches exact category string for normal filters', () => {
    const t: Transaction = { ...base, category: 'FOOD' };
    expect(transactionMatchesCategoryFilter(t, 'FOOD')).toBe(true);
    expect(transactionMatchesCategoryFilter(t, 'TRANSPORTATION')).toBe(false);
  });
});
