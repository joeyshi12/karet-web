# karet-web

A personal finance dashboard that visualizes spending data from Parquet files stored in S3.

## Features

- Category breakdown pie chart
- Monthly spending trends
- Top merchants analysis
- Account and date range filtering

## Prerequisites

- Node.js 18+
- AWS credentials configured (via environment variables or AWS CLI)
- S3 bucket containing transaction data in Parquet format

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `S3_BUCKET` | No | `karet-data` | S3 bucket name containing transaction data |
| `S3_FORCE_PATH_STYLE` | No | `false` | Forces client to use URL path to access buckets rather than subdomains |
| `S3_PREFIX` | No | `clean/` | Prefix path to Parquet files in the bucket |
| `AWS_REGION` | No | `us-east-1` | AWS region for S3 access |

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
export S3_BUCKET=your-bucket-name

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```
