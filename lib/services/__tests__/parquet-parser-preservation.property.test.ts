/**
 * Preservation Property Tests
 * 
 * These tests verify that the existing behavior for non-BigInt inputs is preserved.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseRow } from '../parquet-parser';
import { RawParquetRow } from '../../types/transaction';

/**
 * Arbitrary for generating valid non-empty strings
 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid numeric timestamps (non-BigInt)
 * Range: year 2000 to year 2100 in milliseconds
 */
const numericTimestampArb = fc.integer({ 
  min: 946684800000, // Jan 1, 2000
  max: 4102444800000 // Year 2100
});

/**
 * Arbitrary for generating valid ISO date strings
 * Uses integer timestamps to avoid invalid date issues
 */
const isoDateStringArb = fc.integer({ 
  min: 946684800000, // Jan 1, 2000
  max: 4102444800000 // Year 2100
}).map(ts => new Date(ts).toISOString());

/**
 * Arbitrary for generating valid date strings in various formats
 */
const dateStringArb = fc.oneof(
  isoDateStringArb,
  fc.integer({ 
    min: 946684800000, // Jan 1, 2000
    max: 4102444800000 // Year 2100
  }).map(ts => new Date(ts).toISOString().split('T')[0]) // YYYY-MM-DD format
);

/**
 * Arbitrary for generating valid amount values (DOUBLE type - finite numbers)
 */
const validAmountArb = fc.double({ 
  min: -1e10, 
  max: 1e10, 
  noNaN: true 
}).filter(n => isFinite(n));

/**
 * Arbitrary for generating valid RawParquetRow with numeric timestamp
 */
const numericTimestampRowArb: fc.Arbitrary<RawParquetRow> = fc.record({
  description: nonEmptyStringArb,
  date: numericTimestampArb,
  amount: validAmountArb,
  account_id: nonEmptyStringArb,
  category: nonEmptyStringArb,
});

/**
 * Arbitrary for generating valid RawParquetRow with string date
 */
const stringDateRowArb: fc.Arbitrary<RawParquetRow> = fc.record({
  description: nonEmptyStringArb,
  date: dateStringArb,
  amount: validAmountArb,
  account_id: nonEmptyStringArb,
  category: nonEmptyStringArb,
});

/**
 * Arbitrary for generating valid RawParquetRow with Date object
 * Uses integer timestamps to ensure valid dates
 */
const dateObjectRowArb: fc.Arbitrary<RawParquetRow> = fc.record({
  description: nonEmptyStringArb,
  date: fc.integer({
    min: 946684800000, // Jan 1, 2000
    max: 4102444800000 // Year 2100
  }).map(ts => new Date(ts)),
  amount: validAmountArb,
  account_id: nonEmptyStringArb,
  category: nonEmptyStringArb,
});

/**
 * Arbitrary for generating malformed rows (missing or invalid required fields)
 * Note: category is nullable/optional in the schema, so null/empty category is valid
 */
const malformedRowArb: fc.Arbitrary<RawParquetRow> = fc.oneof(
  // Missing description
  fc.record({
    description: fc.constant(null as unknown as string),
    date: numericTimestampArb,
    amount: validAmountArb,
    account_id: nonEmptyStringArb,
    category: nonEmptyStringArb,
  }),
  // Empty description
  fc.record({
    description: fc.constant(''),
    date: numericTimestampArb,
    amount: validAmountArb,
    account_id: nonEmptyStringArb,
    category: nonEmptyStringArb,
  }),
  // Whitespace-only description
  fc.record({
    description: fc.constant('   '),
    date: numericTimestampArb,
    amount: validAmountArb,
    account_id: nonEmptyStringArb,
    category: nonEmptyStringArb,
  }),
  // Invalid date (null)
  fc.record({
    description: nonEmptyStringArb,
    date: fc.constant(null),
    amount: validAmountArb,
    account_id: nonEmptyStringArb,
    category: nonEmptyStringArb,
  }),
  // Invalid date (unparseable string)
  fc.record({
    description: nonEmptyStringArb,
    date: fc.constant('not-a-date'),
    amount: validAmountArb,
    account_id: nonEmptyStringArb,
    category: nonEmptyStringArb,
  }),
  // Invalid amount (NaN)
  fc.record({
    description: nonEmptyStringArb,
    date: numericTimestampArb,
    amount: fc.constant(NaN),
    account_id: nonEmptyStringArb,
    category: nonEmptyStringArb,
  }),
  // Invalid amount (Infinity)
  fc.record({
    description: nonEmptyStringArb,
    date: numericTimestampArb,
    amount: fc.constant(Infinity),
    account_id: nonEmptyStringArb,
    category: nonEmptyStringArb,
  }),
  // Missing account_id
  fc.record({
    description: nonEmptyStringArb,
    date: numericTimestampArb,
    amount: validAmountArb,
    account_id: fc.constant(null as unknown as string),
    category: nonEmptyStringArb,
  }),
  // Empty account_id
  fc.record({
    description: nonEmptyStringArb,
    date: numericTimestampArb,
    amount: validAmountArb,
    account_id: fc.constant(''),
    category: nonEmptyStringArb,
  })
);

describe('Preservation - Non-BigInt Input Behavior', () => {
  
  /**
   * For all RawParquetRow objects with numeric (non-BigInt) timestamps,
   * parseRow SHALL produce a valid Transaction with a valid Date.
   */
  describe('Numeric Timestamp Preservation', () => {
    it('should parse numeric timestamps and produce valid Transaction objects', () => {
      fc.assert(
        fc.property(numericTimestampRowArb, (rawRow) => {
          // Verify we're testing non-BigInt date
          expect(typeof rawRow.date).toBe('number');
          
          const transaction = parseRow(rawRow);
          
          // Should produce a valid Transaction
          expect(transaction).not.toBeNull();
          
          if (transaction !== null) {
            // Date should be a valid JavaScript Date object
            expect(transaction.date).toBeInstanceOf(Date);
            expect(isNaN(transaction.date.getTime())).toBe(false);
            
            // Amount should be a finite number
            expect(typeof transaction.amount).toBe('number');
            expect(isFinite(transaction.amount)).toBe(true);
            
            // String fields should be preserved
            expect(typeof transaction.description).toBe('string');
            expect(transaction.description.length).toBeGreaterThan(0);
            expect(typeof transaction.account_id).toBe('string');
            expect(transaction.account_id.length).toBeGreaterThan(0);
            expect(typeof transaction.category).toBe('string');
            expect(transaction.category.length).toBeGreaterThan(0);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly convert specific numeric timestamp 1704067200000 (Jan 1, 2024)', () => {
      const rawRow: RawParquetRow = {
        description: 'Test Transaction',
        date: 1704067200000, // Numeric timestamp for Jan 1, 2024
        amount: 100.50,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.date).toBeInstanceOf(Date);
        expect(transaction.date.getTime()).toBe(1704067200000);
      }
    });
  });

  /**
   * For all RawParquetRow objects with string date values,
   * parseRow SHALL produce a valid Transaction with a valid Date.
   */
  describe('String Date Preservation', () => {
    it('should parse string dates and produce valid Transaction objects', () => {
      fc.assert(
        fc.property(stringDateRowArb, (rawRow) => {
          // Verify we're testing string date
          expect(typeof rawRow.date).toBe('string');
          
          const transaction = parseRow(rawRow);
          
          // Should produce a valid Transaction
          expect(transaction).not.toBeNull();
          
          if (transaction !== null) {
            // Date should be a valid JavaScript Date object
            expect(transaction.date).toBeInstanceOf(Date);
            expect(isNaN(transaction.date.getTime())).toBe(false);
            
            // Amount should be a finite number
            expect(typeof transaction.amount).toBe('number');
            expect(isFinite(transaction.amount)).toBe(true);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly parse ISO date string "2024-01-01"', () => {
      const rawRow: RawParquetRow = {
        description: 'Test Transaction',
        date: '2024-01-01',
        amount: 250.00,
        account_id: 'ACC002',
        category: 'Utilities',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.date).toBeInstanceOf(Date);
        expect(isNaN(transaction.date.getTime())).toBe(false);
      }
    });

    it('should correctly parse full ISO date string "2024-01-01T00:00:00.000Z"', () => {
      const rawRow: RawParquetRow = {
        description: 'Test Transaction',
        date: '2024-01-01T00:00:00.000Z',
        amount: 75.25,
        account_id: 'ACC003',
        category: 'Food',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.date).toBeInstanceOf(Date);
        expect(transaction.date.getTime()).toBe(1704067200000);
      }
    });
  });

  /**
   * Property 2.3: Date Object Preservation
   * 
   * For all RawParquetRow objects with Date object values,
   * parseRow SHALL produce a valid Transaction with a valid Date.
   */
  describe('Date Object Preservation', () => {
    it('should parse Date objects and produce valid Transaction objects', () => {
      fc.assert(
        fc.property(dateObjectRowArb, (rawRow) => {
          // Verify we're testing Date object
          expect(rawRow.date).toBeInstanceOf(Date);
          
          const transaction = parseRow(rawRow);
          
          // Should produce a valid Transaction
          expect(transaction).not.toBeNull();
          
          if (transaction !== null) {
            // Date should be a valid JavaScript Date object
            expect(transaction.date).toBeInstanceOf(Date);
            expect(isNaN(transaction.date.getTime())).toBe(false);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * For all valid Transaction inputs (non-BigInt dates),
   * output SHALL have valid Date and finite number amount.
   */
  describe('Valid Transaction Output Structure', () => {
    it('should produce properly typed Transaction objects for all valid inputs', () => {
      // Combine all valid input types
      const validInputArb = fc.oneof(
        numericTimestampRowArb,
        stringDateRowArb,
        dateObjectRowArb
      );

      fc.assert(
        fc.property(validInputArb, (rawRow) => {
          const transaction = parseRow(rawRow);
          
          // Should produce a valid Transaction
          expect(transaction).not.toBeNull();
          
          if (transaction !== null) {
            // Verify Transaction structure
            expect(transaction).toHaveProperty('description');
            expect(transaction).toHaveProperty('date');
            expect(transaction).toHaveProperty('amount');
            expect(transaction).toHaveProperty('account_id');
            expect(transaction).toHaveProperty('category');
            
            // Verify types
            expect(typeof transaction.description).toBe('string');
            expect(transaction.date).toBeInstanceOf(Date);
            expect(typeof transaction.amount).toBe('number');
            expect(typeof transaction.account_id).toBe('string');
            expect(typeof transaction.category).toBe('string');
            
            // Verify validity
            expect(isNaN(transaction.date.getTime())).toBe(false);
            expect(isFinite(transaction.amount)).toBe(true);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * For all malformed records, parseRow SHALL return null.
   */
  describe('Malformed Record Handling', () => {
    it('should return null for all malformed records', () => {
      fc.assert(
        fc.property(malformedRowArb, (rawRow) => {
          const transaction = parseRow(rawRow);
          
          // Malformed records should return null
          expect(transaction).toBeNull();
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for row with null description', () => {
      const rawRow: RawParquetRow = {
        description: null as unknown as string,
        date: 1704067200000,
        amount: 100.00,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      expect(parseRow(rawRow)).toBeNull();
    });

    it('should return null for row with empty description', () => {
      const rawRow: RawParquetRow = {
        description: '',
        date: 1704067200000,
        amount: 100.00,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      expect(parseRow(rawRow)).toBeNull();
    });

    it('should return null for row with invalid date string', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 'not-a-valid-date',
        amount: 100.00,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      expect(parseRow(rawRow)).toBeNull();
    });

    it('should return null for row with NaN amount', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 1704067200000,
        amount: NaN,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      expect(parseRow(rawRow)).toBeNull();
    });

    it('should return null for row with Infinity amount', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 1704067200000,
        amount: Infinity,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      expect(parseRow(rawRow)).toBeNull();
    });
  });

  /**
   * For all valid amount values (DOUBLE type),
   * parseRow SHALL convert them to JavaScript numbers correctly.
   */
  describe('Amount Parsing Preservation', () => {
    it('should correctly convert DOUBLE type amounts to JavaScript numbers', () => {
      fc.assert(
        fc.property(numericTimestampRowArb, (rawRow) => {
          const transaction = parseRow(rawRow);
          
          expect(transaction).not.toBeNull();
          
          if (transaction !== null) {
            // Amount should be a finite JavaScript number
            expect(typeof transaction.amount).toBe('number');
            expect(isFinite(transaction.amount)).toBe(true);
            
            // The amount should match the input (within floating point precision)
            const inputAmount = rawRow.amount as number;
            expect(Math.abs(transaction.amount - inputAmount)).toBeLessThan(1e-10);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle positive amounts correctly', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 1704067200000,
        amount: 1234.56,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.amount).toBe(1234.56);
      }
    });

    it('should handle negative amounts correctly', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 1704067200000,
        amount: -500.25,
        account_id: 'ACC001',
        category: 'Refund',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.amount).toBe(-500.25);
      }
    });

    it('should handle zero amount correctly', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 1704067200000,
        amount: 0,
        account_id: 'ACC001',
        category: 'Adjustment',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.amount).toBe(0);
      }
    });

    it('should handle string amounts correctly', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 1704067200000,
        amount: '99.99' as unknown as number,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.amount).toBe(99.99);
      }
    });

    it('should handle amounts with currency symbols', () => {
      const rawRow: RawParquetRow = {
        description: 'Test',
        date: 1704067200000,
        amount: '$1,234.56' as unknown as number,
        account_id: 'ACC001',
        category: 'Shopping',
      };

      const transaction = parseRow(rawRow);
      
      expect(transaction).not.toBeNull();
      if (transaction !== null) {
        expect(transaction.amount).toBe(1234.56);
      }
    });
  });
});
