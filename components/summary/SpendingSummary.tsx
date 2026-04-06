'use client';

import React from 'react';
import { Transaction } from '@/lib/types/transaction';
import { SummaryCard } from './SummaryCard';
import {
  calculateTotalSpending,
  calculateAverageMonthlySpending,
  findTopCategory,
  formatCurrency,
} from '@/lib/utils/transaction-utils';
import { formatCategoryDisplayName } from '@/lib/utils/category-display';

interface SpendingSummaryProps {
  transactions: Transaction[];
}

export function SpendingSummary({ transactions }: SpendingSummaryProps) {
  const totalSpending = calculateTotalSpending(transactions);
  const averageMonthly = calculateAverageMonthlySpending(transactions);
  const topCategory = findTopCategory(transactions);

  const totalSpendingFormatted = formatCurrency(totalSpending);
  const averageMonthlyFormatted = formatCurrency(averageMonthly);
  const topCategoryDisplay = topCategory
    ? `${formatCategoryDisplayName(topCategory.category)} (${formatCurrency(topCategory.amount)})`
    : 'No data';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-3">
      <SummaryCard
        title="Total Spending"
        value={totalSpendingFormatted}
        icon={<TotalIcon />}
      />
      <SummaryCard
        title="Monthly Average"
        value={averageMonthlyFormatted}
        icon={<AverageIcon />}
      />
      <SummaryCard
        title="Top Category"
        value={topCategoryDisplay}
        icon={<CategoryIcon />}
      />
    </div>
  );
}

function TotalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
    </svg>
  );
}

function AverageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
    </svg>
  );
}

export default SpendingSummary;
