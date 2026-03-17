'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, FilterState } from '@/lib/types/transaction';
import { filterByAccount, filterByDateRange, filterSpendingOnly } from '@/lib/utils/transaction-utils';
import { AccountFilter } from '@/components/filters/AccountFilter';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { SpendingSummary } from '@/components/summary/SpendingSummary';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { TopMerchantsChart } from '@/components/charts/TopMerchantsChart';
import Image from 'next/image';

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

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterState, setFilterState] = useState<FilterState>({
    accountId: null,
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/transactions');

        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.statusText}`);
        }

        const data: TransactionsResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const parsedTransactions: Transaction[] = data.transactions.map((t) => ({
          ...t,
          date: new Date(t.date),
        }));

        setTransactions(parsedTransactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching transactions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const accounts = useMemo(() => {
    const uniqueAccounts = new Set(transactions.map((t) => t.account_id));
    return Array.from(uniqueAccounts).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    result = filterByAccount(result, filterState.accountId);
    result = filterByDateRange(result, filterState.startDate, filterState.endDate);
    return result;
  }, [transactions, filterState]);

  // Separate spending (positive) from payments (negative)
  const spendingTransactions = useMemo(() => {
    return filterSpendingOnly(filteredTransactions);
  }, [filteredTransactions]);

  const handleAccountChange = useCallback((accountId: string | null) => {
    setFilterState((prev) => ({ ...prev, accountId }));
  }, []);

  const handleDateRangeChange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setFilterState((prev) => ({ ...prev, startDate, endDate }));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-4 text-leafy-green">
        <div className="w-9 h-9 border-3 border-soft-cream border-t-carrot-orange rounded-full animate-spin mb-3" />
        <p>Loading your financial data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-4">
        <h2 className="text-lg text-carrot-orange mb-2">Unable to load data</h2>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-semibold bg-carrot-orange text-white border-none rounded-md cursor-pointer hover:bg-dark-orange"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-4 bg-white rounded-xl shadow-md">
        <div className="text-5xl mb-3 opacity-50">
          <Image src="/karet-logo.svg" alt="" width={48} height={48} className="inline-block opacity-50" />
        </div>
        <h2 className="text-lg text-carrot-orange mb-2">No transaction data found</h2>
        <p className="text-sm text-gray-500 mb-4">Upload transactions to get started with your financial dashboard.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-semibold bg-carrot-orange text-white border-none rounded-md cursor-pointer hover:bg-dark-orange"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="flex flex-col gap-3 mb-3 px-3 py-2 bg-white rounded-lg shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:px-4 sm:py-2.5 lg:mb-4" aria-label="Filters">
        <AccountFilter
          accounts={accounts}
          selectedAccount={filterState.accountId}
          onAccountChange={handleAccountChange}
        />
        <DateRangeFilter
          startDate={filterState.startDate}
          endDate={filterState.endDate}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Main Grid */}
      <main className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 lg:gap-4 xl:gap-5">
        {/* Summary Cards */}
        <section className="col-span-full" aria-label="Spending Summary">
          <SpendingSummary transactions={spendingTransactions} />
        </section>

        {/* Category Chart */}
        <div className="bg-white rounded-lg p-3 shadow-sm min-w-0 overflow-hidden sm:p-3.5 lg:col-span-1 lg:p-4">
          <h2 className="text-[0.8125rem] font-semibold text-leafy-green mb-2 lg:text-sm">By Category</h2>
          <div className="relative w-full max-w-[240px] mx-auto sm:max-w-[260px] lg:max-w-[280px]">
            <CategoryChart transactions={spendingTransactions} />
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg p-3 shadow-sm min-w-0 overflow-hidden sm:p-3.5 lg:col-span-2 lg:p-4">
          <h2 className="text-[0.8125rem] font-semibold text-leafy-green mb-2 lg:text-sm">Monthly Trend</h2>
          <div className="relative w-full h-[220px] sm:h-[240px] lg:h-[260px] xl:h-[280px]">
            <MonthlyTrendChart transactions={spendingTransactions} />
          </div>
        </div>

        {/* Top Merchants Chart */}
        <div className="bg-white rounded-lg p-3 shadow-sm min-w-0 overflow-hidden col-span-full sm:p-3.5 lg:p-4">
          <h2 className="text-[0.8125rem] font-semibold text-leafy-green mb-2 lg:text-sm">Top Merchants</h2>
          <div className="relative w-full h-[150px] sm:h-[160px] lg:h-[180px] xl:h-[200px]">
            <TopMerchantsChart transactions={spendingTransactions} limit={5} />
          </div>
        </div>
      </main>
    </>
  );
}
