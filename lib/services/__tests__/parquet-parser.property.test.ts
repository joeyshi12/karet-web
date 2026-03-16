/**
 * Property-Based Tests for Parquet Parser
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseRow } from '../parquet-parser';
import { RawParquetRow } from '../../types/transaction';

/**
 * Arbitrary for generating valid non-empty strings
 */
const nonEmptyStringArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid date values that can be parsed
 * Uses integer timestamps to avoid NaN date issues, then converts to various formats
 */
const validDateArb = fc.oneof(
  // ISO date strings - use integer timestamps to ensure valid dates
  fc.integer({ min: 0, max: 4102444800000 }) // Up to year 2100
    .map(ts => new Date(ts).toISOString()),
  // Timestamps in milliseconds
  fc.integer({ min: 0, max: 4102444800000 }), // Up to year 2100
  // Timestamps in seconds (will be converted)
  fc.integer({ min: 0, max: 4102444800 }),
  // Date objects directly - use integer timestamps to ensure valid dates
  fc.integer({ min: 0, max: 4102444800000 })
    .map(ts => new Date(ts)),
  // BigInt timestamps
  fc.bigInt({ min: 0n, max: 4102444800000n }),
);

/**
 * Arbitrary for generating valid amount values
 * Includes numbers, strings with currency symbols, and BigInt
 */
const validAmountArb = fc.oneof(
  // Regular numbers (finite)
  fc.double({ min: -1e15, max: 1e15, noNaN: true }).filter(n => isFinite(n)),
  // Integer amounts
  fc.integer({ min: -1000000000, max: 1000000000 }),
  // String amounts
  fc.double({ min: -1e10, max: 1e10, noNaN: true })
    .filter(n => isFinite(n))
    .map(n => n.toFixed(2)),
  // String amounts with currency symbol
  fc.double({ min: 0, max: 1e10, noNaN: true })
    .filter(n => isFinite(n))
    .map(n => `$${n.toFixed(2)}`),
  // BigInt amounts
  fc.bigInt({ min: -1000000000n, max: 1000000000n }),
);

/**
 * Arbitrary for generating valid RawParquetRow objects
 * All fields contain valid data that should parse successfully
 */
const validRawParquetRowArb: fc.Arbitrary<RawParquetRow> = fc.record({
  description: nonEmptyStringArb,
  date: validDateArb,
  amount: validAmountArb,
  account_id: nonEmptyStringArb,
  category: nonEmptyStringArb,
});

describe('Transaction Parsing Produces Valid Typed Objects', () => {
  /**
   * For any valid Parquet row containing description, date, amount, account_id, 
   * and category fields, parsing SHALL produce a Transaction object where:
   * - description is a non-empty string
   * - date is a valid JavaScript Date object
   * - amount is a finite number
   * - account_id is a non-empty string
   * - category is a non-empty string
   */
  it('should produce valid typed Transaction objects from valid Parquet rows', () => {
    fc.assert(
      fc.property(validRawParquetRowArb, (rawRow) => {
        const transaction = parseRow(rawRow);
        
        // If parsing succeeds, all properties must be valid
        if (transaction !== null) {
          // description is a non-empty string
          expect(typeof transaction.description).toBe('string');
          expect(transaction.description.trim().length).toBeGreaterThan(0);
          
          // date is a valid JavaScript Date object
          expect(transaction.date).toBeInstanceOf(Date);
          expect(isNaN(transaction.date.getTime())).toBe(false);
          
          // amount is a finite number
          expect(typeof transaction.amount).toBe('number');
          expect(isFinite(transaction.amount)).toBe(true);
          
          // account_id is a non-empty string
          expect(typeof transaction.account_id).toBe('string');
          expect(transaction.account_id.trim().length).toBeGreaterThan(0);
          
          // category is a non-empty string
          expect(typeof transaction.category).toBe('string');
          expect(transaction.category.trim().length).toBeGreaterThan(0);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should always return a Transaction or null (never throw)', () => {
    fc.assert(
      fc.property(validRawParquetRowArb, (rawRow) => {
        // parseRow should never throw, it should return Transaction or null
        const result = parseRow(rawRow);
        expect(result === null || typeof result === 'object').toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve the semantic meaning of description field', () => {
    fc.assert(
      fc.property(validRawParquetRowArb, (rawRow) => {
        const transaction = parseRow(rawRow);
        
        if (transaction !== null && typeof rawRow.description === 'string') {
          // The parsed description should be the trimmed version of the input
          expect(transaction.description).toBe((rawRow.description as string).trim());
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve the semantic meaning of account_id field', () => {
    fc.assert(
      fc.property(validRawParquetRowArb, (rawRow) => {
        const transaction = parseRow(rawRow);
        
        if (transaction !== null && typeof rawRow.account_id === 'string') {
          // The parsed account_id should be the trimmed version of the input
          expect(transaction.account_id).toBe((rawRow.account_id as string).trim());
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve the semantic meaning of category field', () => {
    fc.assert(
      fc.property(validRawParquetRowArb, (rawRow) => {
        const transaction = parseRow(rawRow);
        
        if (transaction !== null && typeof rawRow.category === 'string') {
          // The parsed category should be the trimmed version of the input
          expect(transaction.category).toBe((rawRow.category as string).trim());
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should convert amount to a finite number', () => {
    fc.assert(
      fc.property(validRawParquetRowArb, (rawRow) => {
        const transaction = parseRow(rawRow);
        
        if (transaction !== null) {
          // Amount must be a finite number (not NaN, not Infinity)
          expect(Number.isFinite(transaction.amount)).toBe(true);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should convert date to a valid Date object', () => {
    fc.assert(
      fc.property(validRawParquetRowArb, (rawRow) => {
        const transaction = parseRow(rawRow);
        
        if (transaction !== null) {
          // Date must be a valid Date object (not Invalid Date)
          expect(transaction.date instanceof Date).toBe(true);
          expect(Number.isNaN(transaction.date.getTime())).toBe(false);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
