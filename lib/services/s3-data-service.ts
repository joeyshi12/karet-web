import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { S3Config, defaultS3Config, validateS3Config } from '../config/s3-config';
import { Transaction } from '../types/transaction';

export interface S3DataService {
  fetchTransactions(): Promise<Transaction[]>;
  listParquetFiles(prefix: string): Promise<string[]>;
}

export class S3ConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'S3ConnectionError';
  }
}

function createS3Client(config: S3Config): S3Client {
  return new S3Client({
    region: config.region,
    ...(config.endpoint && { endpoint: config.endpoint }),
    ...(config.forcePathStyle && { forcePathStyle: true }),
  });
}

/** Lists all .parquet files under the given S3 prefix, handling pagination. */
export async function listParquetFiles(
  client: S3Client,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const parquetFiles: string[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response: ListObjectsV2CommandOutput = await client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.endsWith('.parquet')) {
            parquetFiles.push(object.Key);
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return parquetFiles;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new S3ConnectionError(
      `Failed to list Parquet files from s3://${bucket}/${prefix}: ${errorMessage}`,
      error instanceof Error ? error : undefined
    );
  }
}

/** Fetches a single Parquet file from S3 as a Buffer. */
export async function fetchParquetFile(
  client: S3Client,
  bucket: string,
  key: string
): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(command);

    if (!response.Body) {
      throw new Error('Empty response body');
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new S3ConnectionError(
      `Failed to fetch Parquet file s3://${bucket}/${key}: ${errorMessage}`,
      error instanceof Error ? error : undefined
    );
  }
}

/** Creates an S3DataService that fetches and parses Parquet transaction data. */
export function createS3DataService(
  config: S3Config = defaultS3Config,
  parquetParser: (buffer: Buffer) => Promise<Transaction[]>
): S3DataService {
  validateS3Config(config);
  const client = createS3Client(config);

  return {
    async fetchTransactions(): Promise<Transaction[]> {
      const parquetFileKeys = await listParquetFiles(client, config.bucket, config.prefix);
      if (parquetFileKeys.length === 0) return [];

      const allTransactions: Transaction[] = [];
      for (const key of parquetFileKeys) {
        try {
          const buffer = await fetchParquetFile(client, config.bucket, key);
          const transactions = await parquetParser(buffer);
          allTransactions.push(...transactions);
        } catch (error) {
          console.warn(`Skipping file ${key} due to error:`, error);
        }
      }

      return allTransactions;
    },

    async listParquetFiles(prefix: string): Promise<string[]> {
      return listParquetFiles(client, config.bucket, prefix);
    },
  };
}
