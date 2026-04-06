'use client';

import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ActiveElement,
  ChartEvent,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Transaction } from '@/lib/types/transaction';
import { aggregateByMerchant } from '@/lib/utils/transaction-utils';
import { THEME_COLORS } from '@/lib/config/theme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TopMerchantsChartProps {
  transactions: Transaction[];
  limit?: number;
}

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

export function TopMerchantsChart({ transactions, limit = 5 }: TopMerchantsChartProps) {
  const router = useRouter();
  const merchantTotals = aggregateByMerchant(transactions);

  const sortedMerchants = Array.from(merchantTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const labels = sortedMerchants.map(([description]) => description);
  const amounts = sortedMerchants.map(([, amount]) => amount);

  const backgroundColors = labels.map(
    (_, index) => THEME_COLORS.chartColors[index % THEME_COLORS.chartColors.length]
  );

  const handleClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const merchant = labels[index];
      router.push(`/transactions?merchant=${encodeURIComponent(merchant)}&spending=true`);
    }
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Spending',
        data: amounts,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (context: TooltipItem<'bar'>[]) => context[0]?.label || '',
          label: (context: TooltipItem<'bar'>) => {
            const amount = (context.raw as number) || 0;
            return `Total: ${formatCurrency(amount)}`;
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
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        ticks: {
          callback: (value: number | string) => {
            if (typeof value === 'number') return formatCurrency(value);
            return value;
          },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          callback: function(this: unknown, _value: number | string, index: number) {
            const label = labels[index];
            if (label && label.length > 20) return label.substring(0, 17) + '...';
            return label;
          },
        },
      },
    },
  };

  if (transactions.length === 0 || sortedMerchants.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        No merchant data available
      </div>
    );
  }

  return (
    <div className="w-full cursor-pointer" style={{ height: '160px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
