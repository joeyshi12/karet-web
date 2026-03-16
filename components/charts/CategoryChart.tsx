'use client';

import { useRouter } from 'next/navigation';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem, ActiveElement, ChartEvent } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Transaction } from '@/lib/types/transaction';
import { aggregateByCategory } from '@/lib/utils/transaction-utils';
import { THEME_COLORS } from '@/lib/config/theme';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  transactions: Transaction[];
}

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

export function CategoryChart({ transactions }: CategoryChartProps) {
  const router = useRouter();
  const categoryTotals = aggregateByCategory(transactions);
  const categories = Array.from(categoryTotals.keys());
  const amounts = Array.from(categoryTotals.values());

  const backgroundColors = categories.map(
    (_, index) => THEME_COLORS.chartColors[index % THEME_COLORS.chartColors.length]
  );

  const handleClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const category = categories[index];
      router.push(`/transactions?category=${encodeURIComponent(category)}`);
    }
  };

  const data = {
    labels: categories,
    datasets: [
      {
        data: amounts,
        backgroundColor: backgroundColors,
        borderColor: THEME_COLORS.softCream,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 4,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 10 },
          boxWidth: 6,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const category = context.label || '';
            const amount = (context.raw as number) || 0;
            return `${category}: ${formatCurrency(amount)}`;
          },
          footer: () => 'Click to view transactions',
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: THEME_COLORS.softCream,
        bodyColor: THEME_COLORS.softCream,
        footerColor: THEME_COLORS.carrotOrange,
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  if (transactions.length === 0 || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No category data available
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square cursor-pointer">
      <Doughnut data={data} options={options} />
    </div>
  );
}
