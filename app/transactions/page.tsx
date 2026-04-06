'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Transaction } from '@/lib/types/transaction';
import {
  filterByAccount,
  filterByDateRange,
  filterSpendingOnly,
  formatCurrency,
  fuzzySearchTransactions,
  paginateTransactions,
  calculateTotalPages,
  calculateDisplayRange,
  transactionMatchesCategoryFilter,
} from '@/lib/utils/transaction-utils';
import {
  formatDisplayName,
  formatCategoryDisplayName,
  isUncategorizedCategory,
} from '@/lib/utils/category-display';

interface TransactionsResponse {
  transactions: Array<{
    description: string;
    date: string;
    amount: number;
    account_id: string;
    category: string | null;
    merchant: string | null;
  }>;
  error?: string;
}

type SortField = 'date' | 'amount' | 'merchant' | 'category';
type SortDirection = 'asc' | 'desc';

function SummaryStats({ transactions }: { transactions: Transaction[] }) {
  const stats = useMemo(() => {
    const spending = transactions.filter((t) => t.amount > 0);
    const credits = transactions.filter((t) => t.amount < 0);
    const totalSpent = spending.reduce((s, t) => s + t.amount, 0);
    const totalCredits = credits.reduce((s, t) => s + t.amount, 0);
    const largest = transactions.reduce(
      (max, t) => (t.amount > max ? t.amount : max),
      -Infinity,
    );
    return { totalSpent, totalCredits, largest: largest === -Infinity ? 0 : largest };
  }, [transactions]);

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">Total Spent</div>
        <div className="text-sm font-semibold text-gray-900">{formatCurrency(stats.totalSpent)}</div>
      </div>
      {stats.totalCredits < 0 && (
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Credits / Refunds</div>
          <div className="text-sm font-semibold text-green-600">{formatCurrency(stats.totalCredits)}</div>
        </div>
      )}
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">Largest</div>
        <div className="text-sm font-semibold text-gray-900">{formatCurrency(stats.largest)}</div>
      </div>
    </div>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters from URL params
  const categoryFilter = searchParams.get('category');
  const merchantFilter = searchParams.get('merchant');
  const monthFilter = searchParams.get('month');
  const accountFilter = searchParams.get('account');
  const spendingOnly = searchParams.get('spending') === 'true';

  const setFilterParam = useCallback((param: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(param, value);
    } else {
      params.delete(param);
    }
    const qs = params.toString();
    router.push(`/transactions${qs ? `?${qs}` : ''}`);
  }, [searchParams, router]);

  // Local state for sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce effect for search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, merchantFilter, monthFilter, accountFilter, spendingOnly]);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/transactions');
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const data: TransactionsResponse = await response.json();
        if (data.error) throw new Error(data.error);

        const parsed: Transaction[] = data.transactions.map((t) => ({
          ...t,
          date: new Date(t.date),
        }));
        setTransactions(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (spendingOnly) result = filterSpendingOnly(result);
    // Apply URL filters
    if (accountFilter) result = filterByAccount(result, accountFilter);
    if (categoryFilter) {
      result = result.filter((t) =>
        transactionMatchesCategoryFilter(t, categoryFilter)
      );
    }
    if (merchantFilter) result = result.filter((t) => (t.merchant ?? t.description) === merchantFilter);
    if (monthFilter) {
      const [year, month] = monthFilter.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      result = filterByDateRange(result, startDate, endDate);
    }
    // Apply fuzzy search after URL filters
    result = fuzzySearchTransactions(result, debouncedSearch);
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date': comparison = a.date.getTime() - b.date.getTime(); break;
        case 'amount': comparison = a.amount - b.amount; break;
        case 'merchant': comparison = (a.merchant ?? a.description).localeCompare(b.merchant ?? b.description); break;
        case 'category': comparison = (a.category ?? '').localeCompare(b.category ?? ''); break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [transactions, spendingOnly, accountFilter, categoryFilter, merchantFilter, monthFilter, debouncedSearch, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = calculateTotalPages(filteredTransactions.length, pageSize);
  const displayRange = calculateDisplayRange(currentPage, pageSize, filteredTransactions.length);
  const paginatedTransactions = paginateTransactions(filteredTransactions, currentPage, pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const activeFilters = [
    spendingOnly && { param: 'spending', label: 'Payments excluded' },
    categoryFilter && { param: 'category', label: `Category: ${formatCategoryDisplayName(categoryFilter)}` },
    merchantFilter && { param: 'merchant', label: `Merchant: ${formatDisplayName(merchantFilter)}` },
    monthFilter && { param: 'month', label: `Month: ${monthFilter}` },
    accountFilter && { param: 'account', label: `Account: ${accountFilter}` },
  ].filter((f): f is { param: string; label: string } => Boolean(f));

  const removeFilterHref = (param: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    const qs = params.toString();
    return `/transactions${qs ? `?${qs}` : ''}`;
  };

  const filterOptions = useMemo(() => {
    const categories = Array.from(new Set(
      transactions.map((t) => t.category ?? 'Uncategorized')
    )).sort((a, b) => a.localeCompare(b));

    const merchants = Array.from(new Set(
      transactions.map((t) => t.merchant).filter((m): m is string => m != null)
    )).sort((a, b) => a.localeCompare(b));

    const accounts = Array.from(new Set(
      transactions.map((t) => t.account_id)
    )).sort((a, b) => a.localeCompare(b));

    const months = Array.from(new Set(
      transactions.map((t) => {
        const y = t.date.getFullYear();
        const m = String(t.date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
      })
    )).sort().reverse();

    return { categories, merchants, accounts, months };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-9 h-9 border-3 border-soft-cream border-t-carrot-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <h2 className="text-lg text-carrot-orange mb-2">Error loading transactions</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-4 bg-white rounded-lg shadow-sm px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={categoryFilter ?? ''}
            onChange={(e) => setFilterParam('category', e.target.value || null)}
            className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-carrot-orange/50 focus:border-carrot-orange bg-white"
          >
            <option value="">All Categories</option>
            {filterOptions.categories.map((c) => (
              <option key={c} value={c}>{formatCategoryDisplayName(c)}</option>
            ))}
          </select>

          <select
            value={merchantFilter ?? ''}
            onChange={(e) => setFilterParam('merchant', e.target.value || null)}
            className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-carrot-orange/50 focus:border-carrot-orange bg-white"
          >
            <option value="">All Merchants</option>
            {filterOptions.merchants.map((m) => (
              <option key={m} value={m}>{formatDisplayName(m)}</option>
            ))}
          </select>

          <select
            value={accountFilter ?? ''}
            onChange={(e) => setFilterParam('account', e.target.value || null)}
            className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-carrot-orange/50 focus:border-carrot-orange bg-white"
          >
            <option value="">All Accounts</option>
            {filterOptions.accounts.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={monthFilter ?? ''}
            onChange={(e) => setFilterParam('month', e.target.value || null)}
            className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-carrot-orange/50 focus:border-carrot-orange bg-white"
          >
            <option value="">All Months</option>
            {filterOptions.months.map((m) => {
              const [y, mo] = m.split('-');
              const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
                .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>

          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={spendingOnly}
              onChange={(e) => setFilterParam('spending', e.target.checked ? 'true' : null)}
              className="rounded border-gray-300 text-carrot-orange focus:ring-carrot-orange/50"
            />
            Exclude payments
          </label>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2 items-center">
            {activeFilters.map((filter) => (
              <span key={filter.param} className="inline-flex items-center gap-1 px-2 py-0.5 bg-carrot-orange/10 text-carrot-orange text-xs rounded">
                {filter.label}
                <Link
                  href={removeFilterHref(filter.param)}
                  className="ml-0.5 hover:text-dark-orange"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <Link href="/transactions" className="text-xs text-gray-500 hover:text-carrot-orange ml-1">
                Clear all
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transactions..."
          className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-carrot-orange/50 focus:border-carrot-orange bg-white"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filteredTransactions.length > 0 && (
        <SummaryStats transactions={filteredTransactions} />
      )}

      <div className="mb-3 text-sm text-gray-500">
        {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        {debouncedSearch && ` matching "${debouncedSearch}"`}
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-leafy-green cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                  Date <SortIcon field="date" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-leafy-green">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-leafy-green cursor-pointer hover:bg-gray-100" onClick={() => handleSort('merchant')}>
                  Merchant <SortIcon field="merchant" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-leafy-green cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                  Category <SortIcon field="category" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-leafy-green">Account</th>
                <th className="px-4 py-3 text-right font-semibold text-leafy-green cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                  Amount <SortIcon field="amount" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={t.description}>{t.description}</td>
                  <td className="px-4 py-3">{t.merchant ? formatDisplayName(t.merchant) : <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3">
                    {isUncategorizedCategory(t.category) ? (
                      <span className="text-gray-400">Uncategorized</span>
                    ) : (
                      formatCategoryDisplayName(t.category)
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.account_id}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {debouncedSearch ? 'No transactions match your search.' : 'No transactions found matching the current filters.'}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-gray-500">Show:</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-carrot-orange/50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-500">per page</span>
          </div>

          <div className="text-gray-500">
            Showing {displayRange.start}-{displayRange.end} of {filteredTransactions.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-9 h-9 border-3 border-soft-cream border-t-carrot-orange rounded-full animate-spin" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
