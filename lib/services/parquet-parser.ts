import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import { Transaction, RawParquetRow } from '../types/transaction';

export interface ParquetParser {
  parse(buffer: Buffer): Promise<Transaction[]>;
  parseRow(row: RawParquetRow): Transaction | null;
}

/** Converts all BigInt values in an object to Numbers recursively. */
export function convertBigIntsToNumbers(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value === 'bigint') {
      result[key] = Number(value);
    } else if (value instanceof Date || Buffer.isBuffer(value)) {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item === null || item === undefined) return item;
        if (typeof item === 'bigint') return Number(item);
        if (item instanceof Date || Buffer.isBuffer(item)) return item;
        if (typeof item === 'object') return convertBigIntsToNumbers(item as Record<string, unknown>);
        return item;
      });
    } else if (typeof value === 'object') {
      result[key] = convertBigIntsToNumbers(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const timestamp = value < 1e12 ? value * 1000 : value;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'bigint') {
    const timestamp = Number(value);
    const adjusted = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const date = new Date(adjusted);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const date = new Date(trimmed);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') return isFinite(value) ? value : null;
  if (typeof value === 'bigint') {
    const num = Number(value);
    return isFinite(num) ? num : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const cleaned = trimmed.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isFinite(num) ? num : null;
  }

  return null;
}

/** Parses a single raw Parquet row into a Transaction. Returns null if malformed. */
export function parseRow(row: RawParquetRow): Transaction | null {
  try {
    if (!isNonEmptyString(row.description)) return null;
    const description = row.description.trim();

    const date = parseDate(row.date);
    if (date === null) return null;

    const amount = parseAmount(row.amount);
    if (amount === null) return null;

    if (!isNonEmptyString(row.account_id)) return null;
    const account_id = row.account_id.trim();

    // Category is nullable
    const category = isNonEmptyString(row.category) ? row.category.trim() : null;

    // Merchant is nullable
    const merchant = isNonEmptyString(row.merchant) ? row.merchant.trim() : null;

    return { description, date, amount, account_id, category, merchant };
  } catch {
    return null;
  }
}

/**
 * Parses a Parquet buffer into an array of Transaction objects.
 * Uses hyparquet with compressors for ZSTD and other compression support.
 * Malformed records are silently skipped.
 */
export async function parse(buffer: Buffer): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  try {
    // Convert Buffer to ArrayBuffer for hyparquet
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    // Use hyparquet with compressors (supports ZSTD, gzip, brotli, etc.)
    const rows = await parquetReadObjects({
      file: arrayBuffer,
      compressors,
    }) as Record<string, unknown>[];

    for (const rawRow of rows) {
      const safeRow = convertBigIntsToNumbers(rawRow);
      const row: RawParquetRow = {
        description: safeRow.description,
        date: safeRow.date,
        amount: safeRow.amount,
        account_id: safeRow.account_id,
        category: safeRow.category,
        merchant: safeRow.merchant,
      };
      const transaction = parseRow(row);
      if (transaction !== null) {
        transactions.push(transaction);
      }
    }
  } catch (error) {
    console.warn('Error parsing Parquet file:', error);
  }

  return transactions;
}

export function createParquetParser(): ParquetParser {
  return { parse, parseRow };
}

export const parquetParser: ParquetParser = createParquetParser();
