export interface Transaction {
  description: string;
  date: Date;
  amount: number;
  account_id: string;
  category: string | null;
  merchant: string | null;
}

export interface RawParquetRow {
  description: unknown;
  date: unknown;
  amount: unknown;
  account_id: unknown;
  category: unknown;
  merchant: unknown;
}

export interface CategorySpending {
  category: string;
  total: number;
  percentage: number;
}

export interface MonthlySpending {
  month: string; // "YYYY-MM" format
  total: number;
}

export interface MerchantSpending {
  description: string;
  total: number;
  transactionCount: number;
}

export interface FilterState {
  accountId: string | null;
  startDate: Date | null;
  endDate: Date | null;
}
