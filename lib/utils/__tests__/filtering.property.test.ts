/**
 * Property-Based Tests for Filtering Correctness
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterByAccount, filterByDateRange } from '../transaction-utils';
import { Transaction } from '../../types/transaction';

/**
 * Arbitrary for generating valid non-empty strings (for account_id, category, description)
 */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid dates within a reasonable range
 * Uses integer timestamps to avoid NaN date issues
 */
const validDateArb = fc
  .integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2025-12-31').getTime(),
  })
  .map((timestamp) => new Date(timestamp));

/**
 * Arbitrary for generating valid amounts (finite numbers)
 */
const validAmountArb = fc
  .double({ min: -100000, max: 100000, noNaN: true })
  .filter((n) => isFinite(n));

/**
 * Arbitrary for generating a valid Transaction object
 * Ensures all dates are valid (not NaN)
 */
const transactionArb: fc.Arbitrary<Transaction> = fc.record({
  description: nonEmptyStringArb,
  date: validDateArb,
  amount: validAmountArb,
  account_id: nonEmptyStringArb,
  category: nonEmptyStringArb,
  merchant: fc.option(nonEmptyStringArb, { nil: null }),
});

/**
 * Arbitrary for generating a list of transactions
 */
const transactionListArb = fc.array(transactionArb, { minLength: 0, maxLength: 50 });

/**
 * Arbitrary for generating a non-empty list of transactions
 */
const nonEmptyTransactionListArb = fc.array(transactionArb, {
  minLength: 1,
  maxLength: 50,
});

/**
 * Arbitrary for generating a date range where start <= end
 */
const validDateRangeArb = fc
  .tuple(validDateArb, validDateArb)
  .map(([d1, d2]) => (d1 <= d2 ? { start: d1, end: d2 } : { start: d2, end: d1 }));

describe('Filtering Correctness', () => {
  /**
   * All returned transactions SHALL have the specified account_id
   */
  describe('Account Filter', () => {
    it('all returned transactions SHALL have the specified account_id', () => {
      fc.assert(
        fc.property(transactionListArb, nonEmptyStringArb, (transactions, accountId) => {
          const filtered = filterByAccount(transactions, accountId);

          // All returned transactions must have the specified account_id
          for (const t of filtered) {
            expect(t.account_id).toBe(accountId);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return all transactions when accountId is null', () => {
      fc.assert(
        fc.property(transactionListArb, (transactions) => {
          const filtered = filterByAccount(transactions, null);

          // When accountId is null, all transactions should be returned
          expect(filtered.length).toBe(transactions.length);
          expect(filtered).toEqual(transactions);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('no valid transactions matching the account_id SHALL be excluded', () => {
      fc.assert(
        fc.property(nonEmptyTransactionListArb, (transactions) => {
          // Pick an account_id that exists in the transactions
          const existingAccountId = transactions[0].account_id;
          const filtered = filterByAccount(transactions, existingAccountId);

          // Count how many transactions have this account_id in the original list
          const expectedCount = transactions.filter(
            (t) => t.account_id === existingAccountId
          ).length;

          // The filtered result should have exactly that many transactions
          expect(filtered.length).toBe(expectedCount);

          // Verify all matching transactions are included
          const originalMatching = transactions.filter(
            (t) => t.account_id === existingAccountId
          );
          for (const t of originalMatching) {
            expect(filtered).toContainEqual(t);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * All returned transactions SHALL have dates within the inclusive range [startDate, endDate]
   */
  describe('Date Range Filter', () => {
    it('all returned transactions SHALL have dates within the inclusive range [startDate, endDate]', () => {
      fc.assert(
        fc.property(transactionListArb, validDateRangeArb, (transactions, dateRange) => {
          const filtered = filterByDateRange(transactions, dateRange.start, dateRange.end);

          // All returned transactions must have dates within the range
          for (const t of filtered) {
            expect(t.date.getTime()).toBeGreaterThanOrEqual(dateRange.start.getTime());
            expect(t.date.getTime()).toBeLessThanOrEqual(dateRange.end.getTime());
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return all transactions when both start and end are null', () => {
      fc.assert(
        fc.property(transactionListArb, (transactions) => {
          const filtered = filterByDateRange(transactions, null, null);

          // When both dates are null, all transactions should be returned
          expect(filtered.length).toBe(transactions.length);
          expect(filtered).toEqual(transactions);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should filter correctly with only start date specified', () => {
      fc.assert(
        fc.property(transactionListArb, validDateArb, (transactions, startDate) => {
          const filtered = filterByDateRange(transactions, startDate, null);

          // All returned transactions must have dates >= startDate
          for (const t of filtered) {
            expect(t.date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should filter correctly with only end date specified', () => {
      fc.assert(
        fc.property(transactionListArb, validDateArb, (transactions, endDate) => {
          const filtered = filterByDateRange(transactions, null, endDate);

          // All returned transactions must have dates <= endDate
          for (const t of filtered) {
            expect(t.date.getTime()).toBeLessThanOrEqual(endDate.getTime());
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('no valid transactions matching the date range SHALL be excluded', () => {
      fc.assert(
        fc.property(transactionListArb, validDateRangeArb, (transactions, dateRange) => {
          const filtered = filterByDateRange(transactions, dateRange.start, dateRange.end);

          // Count how many transactions are within the date range in the original list
          const expectedMatching = transactions.filter(
            (t) =>
              t.date.getTime() >= dateRange.start.getTime() &&
              t.date.getTime() <= dateRange.end.getTime()
          );

          // The filtered result should have exactly that many transactions
          expect(filtered.length).toBe(expectedMatching.length);

          // Verify all matching transactions are included
          for (const t of expectedMatching) {
            expect(filtered).toContainEqual(t);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * All returned transactions SHALL satisfy both criteria
   */
  describe('Combined Filters', () => {
    it('all returned transactions SHALL satisfy both account and date range criteria', () => {
      fc.assert(
        fc.property(
          transactionListArb,
          nonEmptyStringArb,
          validDateRangeArb,
          (transactions, accountId, dateRange) => {
            // Apply both filters in sequence
            const filteredByAccount = filterByAccount(transactions, accountId);
            const filteredByBoth = filterByDateRange(
              filteredByAccount,
              dateRange.start,
              dateRange.end
            );

            // All returned transactions must satisfy both criteria
            for (const t of filteredByBoth) {
              // Account filter criterion
              expect(t.account_id).toBe(accountId);

              // Date range filter criterion
              expect(t.date.getTime()).toBeGreaterThanOrEqual(dateRange.start.getTime());
              expect(t.date.getTime()).toBeLessThanOrEqual(dateRange.end.getTime());
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filter order should not affect the result (commutativity)', () => {
      fc.assert(
        fc.property(
          transactionListArb,
          nonEmptyStringArb,
          validDateRangeArb,
          (transactions, accountId, dateRange) => {
            // Apply filters in different orders
            const accountFirst = filterByDateRange(
              filterByAccount(transactions, accountId),
              dateRange.start,
              dateRange.end
            );

            const dateFirst = filterByAccount(
              filterByDateRange(transactions, dateRange.start, dateRange.end),
              accountId
            );

            // Results should be the same regardless of order
            expect(accountFirst.length).toBe(dateFirst.length);

            // Both should contain the same transactions
            for (const t of accountFirst) {
              expect(dateFirst).toContainEqual(t);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('no valid transactions matching both criteria SHALL be excluded', () => {
      fc.assert(
        fc.property(
          transactionListArb,
          nonEmptyStringArb,
          validDateRangeArb,
          (transactions, accountId, dateRange) => {
            // Apply both filters
            const filtered = filterByDateRange(
              filterByAccount(transactions, accountId),
              dateRange.start,
              dateRange.end
            );

            // Count how many transactions match both criteria in the original list
            const expectedMatching = transactions.filter(
              (t) =>
                t.account_id === accountId &&
                t.date.getTime() >= dateRange.start.getTime() &&
                t.date.getTime() <= dateRange.end.getTime()
            );

            // The filtered result should have exactly that many transactions
            expect(filtered.length).toBe(expectedMatching.length);

            // Verify all matching transactions are included
            for (const t of expectedMatching) {
              expect(filtered).toContainEqual(t);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Filtering should be idempotent
   */
  describe('Idempotency', () => {
    it('applying the same account filter twice should produce the same result', () => {
      fc.assert(
        fc.property(transactionListArb, nonEmptyStringArb, (transactions, accountId) => {
          const filteredOnce = filterByAccount(transactions, accountId);
          const filteredTwice = filterByAccount(filteredOnce, accountId);

          expect(filteredTwice.length).toBe(filteredOnce.length);
          expect(filteredTwice).toEqual(filteredOnce);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('applying the same date range filter twice should produce the same result', () => {
      fc.assert(
        fc.property(transactionListArb, validDateRangeArb, (transactions, dateRange) => {
          const filteredOnce = filterByDateRange(
            transactions,
            dateRange.start,
            dateRange.end
          );
          const filteredTwice = filterByDateRange(
            filteredOnce,
            dateRange.start,
            dateRange.end
          );

          expect(filteredTwice.length).toBe(filteredOnce.length);
          expect(filteredTwice).toEqual(filteredOnce);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
