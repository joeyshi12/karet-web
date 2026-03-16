/**
 * Bug Condition Exploration Property Test
 * 
 * This test is designed to surface counterexamples that demonstrate the bug exists.
 * It encodes the EXPECTED behavior - when the bug is fixed, this test will pass.
 * 
 * Bug Condition: When parquetjs-lite returns BigInt values for TIMESTAMP_MILLIS fields,
 * the system should successfully convert them to valid JavaScript Date objects.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseRow, parse } from '../parquet-parser';
import { RawParquetRow } from '../../types/transaction';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Arbitrary for generating valid non-empty strings
 */
const nonEmptyStringArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating BigInt timestamp values
 * These simulate TIMESTAMP_MILLIS values returned by parquetjs-lite
 * Range: 0 to year 2100 in milliseconds
 */
const bigIntTimestampArb = fc.bigInt({ 
  min: 0n, 
  max: 4102444800000n // Year 2100 in milliseconds
});

/**
 * Arbitrary for generating valid amount values (non-BigInt to isolate the date bug)
 */
const validAmountArb = fc.double({ min: -1e10, max: 1e10, noNaN: true }).filter(n => isFinite(n));

/**
 * Arbitrary for generating RawParquetRow objects with BigInt date values
 * This simulates the exact condition where parquetjs-lite returns BigInt for TIMESTAMP_MILLIS
 * 
 * Scoped PBT Approach: Only generates rows where typeof rawRow.date === 'bigint'
 */
const bigIntDateRawParquetRowArb: fc.Arbitrary<RawParquetRow> = fc.record({
  description: nonEmptyStringArb,
  date: bigIntTimestampArb, // Always BigInt - this is the bug condition
  amount: validAmountArb,
  account_id: nonEmptyStringArb,
  category: nonEmptyStringArb,
});

describe('BigInt Timestamp Parsing', () => {
  /**
   * For any RawParquetRow where typeof rawRow.date === 'bigint' (simulating TIMESTAMP_MILLIS),
   * the parseRow function SHALL:
   * 1. NOT throw TypeError: Cannot convert a BigInt value to a number
   * 2. Successfully produce a valid Transaction object with a valid Date
   */
  it('should successfully parse BigInt timestamp values without throwing TypeError', () => {
    fc.assert(
      fc.property(bigIntDateRawParquetRowArb, (rawRow) => {
        // Verify we're testing the bug condition
        expect(typeof rawRow.date).toBe('bigint');
        
        // This should NOT throw - if it throws, the bug exists
        let transaction;
        let thrownError: Error | null = null;
        
        try {
          transaction = parseRow(rawRow);
        } catch (error) {
          thrownError = error as Error;
        }
        
        // Assert no TypeError was thrown
        expect(thrownError).toBeNull();
        
        // If parsing succeeded, verify the result is valid
        if (transaction !== null) {
          // date should be a valid JavaScript Date object
          expect(transaction.date).toBeInstanceOf(Date);
          expect(isNaN(transaction.date.getTime())).toBe(false);
          
          // The date should represent a valid timestamp
          expect(transaction.date.getTime()).toBeGreaterThanOrEqual(0);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Specific test case with known BigInt timestamp value (Jan 1, 2024)
   */
  it('should parse specific BigInt timestamp 1704067200000n (Jan 1, 2024) without error', () => {
    const rawRow: RawParquetRow = {
      description: 'Test Transaction',
      date: 1704067200000n, // BigInt timestamp for Jan 1, 2024
      amount: 100.50,
      account_id: 'ACC001',
      category: 'Shopping',
    };

    // Verify we're testing the bug condition
    expect(typeof rawRow.date).toBe('bigint');

    // This should NOT throw TypeError
    let transaction;
    let thrownError: Error | null = null;
    
    try {
      transaction = parseRow(rawRow);
    } catch (error) {
      thrownError = error as Error;
    }

    // Assert no error was thrown
    expect(thrownError).toBeNull();
    
    // Verify the transaction was parsed correctly
    expect(transaction).not.toBeNull();
    if (transaction !== null) {
      expect(transaction.date).toBeInstanceOf(Date);
      expect(isNaN(transaction.date.getTime())).toBe(false);
      // Verify the date value is correct (Jan 1, 2024 00:00:00 UTC)
      expect(transaction.date.getTime()).toBe(1704067200000);
    }
  });

  /**
   * Test with another specific BigInt timestamp value (Jan 1, 2025)
   */
  it('should parse specific BigInt timestamp 1735689600000n (Jan 1, 2025) without error', () => {
    const rawRow: RawParquetRow = {
      description: 'Another Test Transaction',
      date: 1735689600000n, // BigInt timestamp for Jan 1, 2025
      amount: 250.00,
      account_id: 'ACC002',
      category: 'Utilities',
    };

    // Verify we're testing the bug condition
    expect(typeof rawRow.date).toBe('bigint');

    // This should NOT throw TypeError
    let transaction;
    let thrownError: Error | null = null;
    
    try {
      transaction = parseRow(rawRow);
    } catch (error) {
      thrownError = error as Error;
    }

    // Assert no error was thrown
    expect(thrownError).toBeNull();
    
    // Verify the transaction was parsed correctly
    expect(transaction).not.toBeNull();
    if (transaction !== null) {
      expect(transaction.date).toBeInstanceOf(Date);
      expect(isNaN(transaction.date.getTime())).toBe(false);
      // Verify the date value is correct (Jan 1, 2025 00:00:00 UTC)
      expect(transaction.date.getTime()).toBe(1735689600000);
    }
  });

  /**
   * Test with large BigInt timestamp values that might exceed Number.MAX_SAFE_INTEGER
   */
  it('should handle large BigInt timestamp values within safe integer range', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: nonEmptyStringArb,
          // Use timestamps within safe integer range but as BigInt
          date: fc.bigInt({ min: 0n, max: BigInt(Number.MAX_SAFE_INTEGER) }),
          amount: validAmountArb,
          account_id: nonEmptyStringArb,
          category: nonEmptyStringArb,
        }),
        (rawRow) => {
          // Verify we're testing the bug condition
          expect(typeof rawRow.date).toBe('bigint');
          
          // This should NOT throw
          let transaction;
          let thrownError: Error | null = null;
          
          try {
            transaction = parseRow(rawRow);
          } catch (error) {
            thrownError = error as Error;
          }
          
          // Assert no TypeError was thrown
          expect(thrownError).toBeNull();
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Integration test: Parse actual Parquet file with TIMESTAMP_MILLIS schema
   */
  it('should parse real Parquet file with TIMESTAMP_MILLIS without throwing TypeError', async () => {
    // Path to test Parquet file generated with TIMESTAMP_MILLIS schema
    const testParquetPath = path.join(__dirname, '../../../scripts/output/clean/transactions.parquet');
    
    // Skip test if file doesn't exist
    if (!fs.existsSync(testParquetPath)) {
      console.warn('Test Parquet file not found, skipping integration test');
      return;
    }
    
    const buffer = fs.readFileSync(testParquetPath);
    
    // This should NOT throw TypeError during cursor iteration
    // Currently it DOES throw due to the bug in parquetjs-lite
    let transactions;
    let thrownError: Error | null = null;
    
    try {
      transactions = await parse(buffer);
    } catch (error) {
      thrownError = error as Error;
    }
    
    // Assert no TypeError was thrown (this is the expected behavior after fix)
    // Currently fails because the bug exists
    expect(thrownError).toBeNull();
    
    // Verify transactions were parsed
    expect(transactions).toBeDefined();
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions!.length).toBeGreaterThan(0);
    
    // Verify all transactions have valid dates
    for (const transaction of transactions!) {
      expect(transaction.date).toBeInstanceOf(Date);
      expect(isNaN(transaction.date.getTime())).toBe(false);
    }
  });
});
