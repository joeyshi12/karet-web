import { Transaction } from '../types/transaction';

/** Filters transactions to only include spending (positive amounts, excluding Payment category). */
export function filterSpendingOnly(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.amount > 0 && t.category !== 'PAYMENT');
}

/** Filters transactions to only include payments (Payment category). */
export function filterPaymentsOnly(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.category === 'PAYMENT');
}

/** Calculates total payments (sum of absolute payment amounts, deduplicated). */
export function calculateTotalPayments(transactions: Transaction[]): number {
  // Only count the negative side (Visa) to avoid double-counting
  const visaPayments = transactions.filter((t) => t.category === 'PAYMENT' && t.amount < 0);
  return Math.abs(visaPayments.reduce((total, t) => total + t.amount, 0));
}

/** Filters transactions by account ID. Returns all if accountId is null. */
export function filterByAccount(
  transactions: Transaction[],
  accountId: string | null
): Transaction[] {
  if (accountId === null) {
    return transactions;
  }
  return transactions.filter((t) => t.account_id === accountId);
}

/** Filters transactions by date range (inclusive). Returns all if both dates are null. */
export function filterByDateRange(
  transactions: Transaction[],
  start: Date | null,
  end: Date | null
): Transaction[] {
  if (start === null && end === null) {
    return transactions;
  }

  return transactions.filter((t) => {
    if (start !== null && t.date < start) return false;
    if (end !== null && t.date > end) return false;
    return true;
  });
}

/**
 * Whether a transaction matches the category query param from the URL.
 * The chart uses the label "Uncategorized" for null/empty category; those rows
 * store `category: null`, so we must not compare with strict equality to the string.
 */
export function transactionMatchesCategoryFilter(
  transaction: Transaction,
  categoryFilter: string
): boolean {
  if (categoryFilter === 'Uncategorized') {
    const c = transaction.category;
    if (c == null || c.trim() === '') return true;
    return c === 'Uncategorized';
  }
  return transaction.category === categoryFilter;
}

/** Aggregates transactions by category. Returns Map of category name to total amount. */
export function aggregateByCategory(
  transactions: Transaction[]
): Map<string, number> {
  const categoryMap = new Map<string, number>();
  for (const transaction of transactions) {
    const category = transaction.category ?? 'Uncategorized';
    const currentTotal = categoryMap.get(category) ?? 0;
    categoryMap.set(category, currentTotal + transaction.amount);
  }
  return categoryMap;
}

/** Aggregates transactions by month. Returns Map of "YYYY-MM" to total amount. */
export function aggregateByMonth(
  transactions: Transaction[]
): Map<string, number> {
  const monthMap = new Map<string, number>();
  for (const transaction of transactions) {
    const date = transaction.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const currentTotal = monthMap.get(monthKey) ?? 0;
    monthMap.set(monthKey, currentTotal + transaction.amount);
  }
  return monthMap;
}

/** Aggregates transactions by description (merchant). Returns Map of description to total amount. */
export function aggregateByDescription(
  transactions: Transaction[]
): Map<string, number> {
  const descriptionMap = new Map<string, number>();
  for (const transaction of transactions) {
    const currentTotal = descriptionMap.get(transaction.description) ?? 0;
    descriptionMap.set(transaction.description, currentTotal + transaction.amount);
  }
  return descriptionMap;
}

/** Aggregates transactions by merchant. Uses merchant field if available, falls back to description. */
export function aggregateByMerchant(
  transactions: Transaction[]
): Map<string, number> {
  const merchantMap = new Map<string, number>();
  for (const transaction of transactions) {
    const key = transaction.merchant ?? transaction.description;
    const currentTotal = merchantMap.get(key) ?? 0;
    merchantMap.set(key, currentTotal + transaction.amount);
  }
  return merchantMap;
}

/** Calculates total spending from a list of transactions. */
export function calculateTotalSpending(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

/** Calculates average monthly spending. Returns 0 if no transactions. */
export function calculateAverageMonthlySpending(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  const totalSpending = calculateTotalSpending(transactions);
  const numberOfMonths = aggregateByMonth(transactions).size;
  if (numberOfMonths === 0) return 0;
  return totalSpending / numberOfMonths;
}

/** Finds the top spending category. Returns null if no transactions. */
export function findTopCategory(
  transactions: Transaction[]
): { category: string; amount: number } | null {
  if (transactions.length === 0) return null;

  const categoryTotals = aggregateByCategory(transactions);
  let topCategory: string | null = null;
  let topAmount = -Infinity;

  categoryTotals.forEach((amount, category) => {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = category;
    }
  });

  if (topCategory === null) return null;
  return { category: topCategory, amount: topAmount };
}

/** Formats an amount in cents as a USD currency string with 2 decimal places. */
export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

/**
 * Paginates an array of transactions.
 * Returns the slice for the requested page.
 */
export function paginateTransactions(
  transactions: Transaction[],
  page: number,
  pageSize: number
): Transaction[] {
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;
  return transactions.slice(startIndex, endIndex);
}

/**
 * Calculates total number of pages.
 */
export function calculateTotalPages(
  totalItems: number,
  pageSize: number
): number {
  return Math.ceil(totalItems / pageSize);
}

/**
 * Calculates the range of items being displayed.
 * Returns { start, end } (1-indexed, inclusive).
 */
export function calculateDisplayRange(
  page: number,
  pageSize: number,
  totalItems: number
): { start: number; end: number } {
  if (totalItems === 0) {
    return { start: 0, end: 0 };
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return { start, end };
}

/**
 * Performs case-insensitive fuzzy search on transactions.
 * Matches against description, merchant, and category fields.
 * Returns all transactions if query is empty or whitespace-only.
 */
export function fuzzySearchTransactions(
  transactions: Transaction[],
  query: string
): Transaction[] {
  const trimmedQuery = query.trim().toLowerCase();

  if (trimmedQuery === '') {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const description = transaction.description.toLowerCase();
    const merchant = (transaction.merchant ?? '').toLowerCase();
    const category = (transaction.category ?? '').toLowerCase();
    const account_id = (transaction.account_id ?? '').toLowerCase();

    return (
      description.includes(trimmedQuery) ||
      merchant.includes(trimmedQuery) ||
      category.includes(trimmedQuery) ||
      account_id.includes(trimmedQuery)
    );
  });
}
