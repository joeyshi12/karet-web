import { NextResponse } from 'next/server';
import { createS3DataService, S3ConnectionError } from '@/lib/services/s3-data-service';
import { parse } from '@/lib/services/parquet-parser';
import { Transaction } from '@/lib/types/transaction';

interface TransactionsResponse {
  transactions: Transaction[];
  error?: string;
  message?: string;
}

function serializeTransaction(transaction: Transaction): Record<string, unknown> {
  return {
    ...transaction,
    date: transaction.date.toISOString(),
  };
}

/** GET /api/transactions — fetches transaction data from S3 Parquet files. */
export async function GET(): Promise<NextResponse<TransactionsResponse>> {
  try {
    const s3DataService = createS3DataService(undefined, parse);
    const transactions = await s3DataService.fetchTransactions();

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          transactions: [],
          message: 'No transaction data found. Upload transactions to get started.',
        },
        { status: 200 }
      );
    }

    const serializedTransactions = transactions.map(serializeTransaction);

    return NextResponse.json({
      transactions: serializedTransactions as unknown as Transaction[],
    });
  } catch (error) {
    if (error instanceof S3ConnectionError) {
      console.error('S3 connection error:', error.message);
      
      let userMessage = 'Unable to connect to data source. Please check configuration.';
      
      if (error.message.includes('Access Denied') || error.message.includes('AccessDenied')) {
        userMessage = 'Access denied to data source. Please check permissions.';
      } else if (error.message.includes('NoSuchBucket') || error.message.includes('not found')) {
        userMessage = 'Data source not found. Please verify S3 bucket settings.';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        userMessage = 'Connection timed out. Please try again.';
      }

      return NextResponse.json(
        { transactions: [], error: userMessage },
        { status: 503 }
      );
    }

    console.error('Unexpected error fetching transactions:', error);
    return NextResponse.json(
      { transactions: [], error: 'An unexpected error occurred while fetching transaction data.' },
      { status: 500 }
    );
  }
}
