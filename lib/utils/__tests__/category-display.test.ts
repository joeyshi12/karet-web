import { describe, it, expect } from 'vitest';
import {
  formatCategoryDisplayName,
  isUncategorizedCategory,
} from '../category-display';

describe('isUncategorizedCategory', () => {
  it('is true for null, blank, or Uncategorized', () => {
    expect(isUncategorizedCategory(null)).toBe(true);
    expect(isUncategorizedCategory('')).toBe(true);
    expect(isUncategorizedCategory('   ')).toBe(true);
    expect(isUncategorizedCategory('Uncategorized')).toBe(true);
    expect(isUncategorizedCategory('uncategorized')).toBe(true);
  });

  it('is false for real categories', () => {
    expect(isUncategorizedCategory('FOOD')).toBe(false);
  });
});

describe('formatCategoryDisplayName', () => {
  it('returns Uncategorized for null, empty, or whitespace', () => {
    expect(formatCategoryDisplayName(null)).toBe('Uncategorized');
    expect(formatCategoryDisplayName('')).toBe('Uncategorized');
    expect(formatCategoryDisplayName('   ')).toBe('Uncategorized');
  });

  it('preserves Uncategorized label', () => {
    expect(formatCategoryDisplayName('Uncategorized')).toBe('Uncategorized');
    expect(formatCategoryDisplayName('uncategorized')).toBe('Uncategorized');
  });

  it('title-cases SNAKE_CASE keys', () => {
    expect(formatCategoryDisplayName('FOOD')).toBe('Food');
    expect(formatCategoryDisplayName('PERSONAL_CARE')).toBe('Personal Care');
    expect(formatCategoryDisplayName('TRANSPORTATION')).toBe('Transportation');
  });

  it('applies overrides for awkward tokens', () => {
    expect(formatCategoryDisplayName('PAYMENT')).toBe('Payments');
    expect(formatCategoryDisplayName('T_AND_T')).toBe('T&T');
  });

  it('handles already human-readable labels', () => {
    expect(formatCategoryDisplayName('Groceries')).toBe('Groceries');
    expect(formatCategoryDisplayName('Dining')).toBe('Dining');
  });
});
