export interface S3Config {
  bucket: string;
  prefix: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

/**
 * Default S3 configuration loaded from environment variables.
 */
export const defaultS3Config: S3Config = {
  bucket: process.env.S3_BUCKET || 'karet-data',
  prefix: process.env.S3_PREFIX || 'clean/',
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === undefined
      || process.env.S3_FORCE_PATH_STYLE === 'true',
};

/** Validates that the S3 configuration has required values. */
export function validateS3Config(config: S3Config): boolean {
  if (!config.bucket) {
    throw new Error('S3 bucket name is required. Set the S3_BUCKET environment variable.');
  }
  if (!config.region) {
    throw new Error('AWS region is required. Set the AWS_REGION environment variable.');
  }
  return true;
}
