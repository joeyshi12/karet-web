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
import { aggregateByMonth } from '@/lib/utils/transaction-utils';
import { THEME_COLORS } from '@/lib/config/theme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyTrendChartProps {
  transactions: Transaction[];
}

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function MonthlyTrendChart({ transactions }: MonthlyTrendChartProps) {
  const router = useRouter();
  const monthlyTotals = aggregateByMonth(transactions);
  const sortedMonths = Array.from(monthlyTotals.keys()).sort();
  const displayMonths = sortedMonths.slice(-12);
  const amounts = displayMonths.map((month) => monthlyTotals.get(month) ?? 0);
  const labels = displayMonths.map(formatMonthLabel);

  const handleClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const monthKey = displayMonths[index]; // YYYY-MM format
      router.push(`/transactions?month=${monthKey}`);
    }
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Monthly Spending',
        data: amounts,
        backgroundColor: THEME_COLORS.carrotOrange,
        borderColor: THEME_COLORS.carrotOrange,
        borderWidth: 1,
        borderRadius: 3,
        hoverBackgroundColor: THEME_COLORS.chartColors[2],
      },
    ],
  };

  const options = {
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
        grid: { display: false },
        ticks: { maxRotation: 30, minRotation: 30 },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        ticks: {
          callback: (value: number | string) => {
            if (typeof value === 'number') return formatCurrency(value);
            return value;
          },
        },
      },
    },
  };

  if (transactions.length === 0 || displayMonths.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height: '240px' }}>
        No monthly data available
      </div>
    );
  }

  return (
    <div className="w-full cursor-pointer" style={{ height: '260px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
