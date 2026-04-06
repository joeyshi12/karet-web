import { describe, it, expect } from 'vitest';
import {
  formatDisplayName,
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

describe('formatDisplayName', () => {
  it('title-cases SNAKE_CASE keys', () => {
    expect(formatDisplayName('FOOD')).toBe('Food');
    expect(formatDisplayName('PERSONAL_CARE')).toBe('Personal Care');
    expect(formatDisplayName('TRANSPORTATION')).toBe('Transportation');
  });

  it('applies overrides for awkward tokens', () => {
    expect(formatDisplayName('PAYMENT')).toBe('Payments');
    expect(formatDisplayName('T_AND_T')).toBe('T&T');
    expect(formatDisplayName('A_AND_W')).toBe('A&W');
  });

  it('handles already human-readable labels', () => {
    expect(formatDisplayName('Groceries')).toBe('Groceries');
    expect(formatDisplayName('Dining')).toBe('Dining');
  });

  it('returns empty string for blank input', () => {
    expect(formatDisplayName('')).toBe('');
    expect(formatDisplayName('   ')).toBe('');
  });

  it('formats merchant-style UPPER keys', () => {
    expect(formatDisplayName('STARBUCKS')).toBe('Starbucks');
    expect(formatDisplayName('CHIPOTLE')).toBe('Chipotle');
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
