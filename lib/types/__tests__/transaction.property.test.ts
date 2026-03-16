/**
 * Property-Based Tests for Transaction Serialization
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Transaction } from '../transaction';

/**
 * Arbitrary for generating valid non-empty strings
 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid Date objects
 * Constrained to reasonable date range for financial transactions
 * Uses integer timestamps to avoid NaN date issues
 */
const validDateArb = fc.integer({
  min: new Date('1970-01-01').getTime(),
  max: new Date('2100-12-31').getTime(),
}).map(ts => new Date(ts));

/**
 * Arbitrary for generating valid finite amounts
 * Includes both positive and negative values for credits/debits
 */
const validAmountArb = fc.double({
  min: -1e12,
  max: 1e12,
  noNaN: true,
}).filter(n => isFinite(n));

/**
 * Arbitrary for generating valid Transaction objects
 * All fields contain valid data that represents a real transaction
 */
const validTransactionArb: fc.Arbitrary<Transaction> = fc.record({
  description: nonEmptyStringArb,
  date: validDateArb,
  amount: validAmountArb,
  account_id: nonEmptyStringArb,
  category: nonEmptyStringArb,
});

/**
 * Serializes a Transaction to JSON string
 * Handles Date serialization to ISO string format
 */
function serializeTransaction(transaction: Transaction): string {
  return JSON.stringify(transaction);
}

/**
 * Parses a JSON string back to a Transaction object
 * Handles Date deserialization from ISO string format
 */
function parseTransaction(json: string): Transaction {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    date: new Date(parsed.date),
  };
}

/**
 * Checks if two numbers are equivalent for financial purposes
 * Treats -0 and +0 as equal (JSON serialization normalizes -0 to 0)
 */
function numbersAreEqual(a: number, b: number): boolean {
  // Handle the -0 vs +0 case: JSON.stringify(-0) produces "0"
  // which parses back to +0. For financial purposes, they are equivalent.
  if (a === 0 && b === 0) {
    return true;
  }
  return a === b;
}

/**
 * Checks if two Transaction objects are equivalent
 * Compares all fields including Date by timestamp
 */
function transactionsAreEqual(a: Transaction, b: Transaction): boolean {
  return (
    a.description === b.description &&
    a.date.getTime() === b.date.getTime() &&
    numbersAreEqual(a.amount, b.amount) &&
    a.account_id === b.account_id &&
    a.category === b.category
  );
}

describe('Transaction Serialization Round-Trip', () => {
  /**
   * For any valid Transaction object, serializing to JSON then parsing back 
   * SHALL produce an equivalent Transaction object with identical field values.
   */
  it('should produce equivalent Transaction after JSON round-trip', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        // Serialize to JSON
        const serialized = serializeTransaction(original);
        
        // Parse back to Transaction
        const restored = parseTransaction(serialized);
        
        // Verify all fields are identical
        expect(transactionsAreEqual(original, restored)).toBe(true);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve description field exactly through round-trip', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        const serialized = serializeTransaction(original);
        const restored = parseTransaction(serialized);
        
        expect(restored.description).toBe(original.description);
        expect(typeof restored.description).toBe('string');
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve date field exactly through round-trip', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        const serialized = serializeTransaction(original);
        const restored = parseTransaction(serialized);
        
        // Date should be a valid Date object
        expect(restored.date).toBeInstanceOf(Date);
        expect(isNaN(restored.date.getTime())).toBe(false);
        
        // Timestamps should match exactly
        expect(restored.date.getTime()).toBe(original.date.getTime());
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve amount field exactly through round-trip', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        const serialized = serializeTransaction(original);
        const restored = parseTransaction(serialized);
        
        // Use numbersAreEqual to handle -0 vs +0 case
        // JSON.stringify(-0) produces "0" which parses to +0
        expect(numbersAreEqual(restored.amount, original.amount)).toBe(true);
        expect(typeof restored.amount).toBe('number');
        expect(isFinite(restored.amount)).toBe(true);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve account_id field exactly through round-trip', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        const serialized = serializeTransaction(original);
        const restored = parseTransaction(serialized);
        
        expect(restored.account_id).toBe(original.account_id);
        expect(typeof restored.account_id).toBe('string');
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve category field exactly through round-trip', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        const serialized = serializeTransaction(original);
        const restored = parseTransaction(serialized);
        
        expect(restored.category).toBe(original.category);
        expect(typeof restored.category).toBe('string');
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should produce valid JSON during serialization', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        const serialized = serializeTransaction(original);
        
        // Should be valid JSON (no throw on parse)
        expect(() => JSON.parse(serialized)).not.toThrow();
        
        // Parsed JSON should have all expected fields
        const parsed = JSON.parse(serialized);
        expect(parsed).toHaveProperty('description');
        expect(parsed).toHaveProperty('date');
        expect(parsed).toHaveProperty('amount');
        expect(parsed).toHaveProperty('account_id');
        expect(parsed).toHaveProperty('category');
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should be idempotent - multiple round-trips produce same result', () => {
    fc.assert(
      fc.property(validTransactionArb, (original) => {
        // First round-trip
        const serialized1 = serializeTransaction(original);
        const restored1 = parseTransaction(serialized1);
        
        // Second round-trip
        const serialized2 = serializeTransaction(restored1);
        const restored2 = parseTransaction(serialized2);
        
        // Both restored transactions should be equivalent
        expect(transactionsAreEqual(restored1, restored2)).toBe(true);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
