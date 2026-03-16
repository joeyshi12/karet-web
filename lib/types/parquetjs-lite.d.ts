// Type declarations for @dsnp/parquetjs
// This provides TypeScript types for the parquet library

declare module '@dsnp/parquetjs' {
  export interface ParquetCursor {
    next(): Promise<Record<string, unknown> | null>;
  }

  export interface ParquetSchemaDefinition {
    fields: Record<string, unknown>;
  }

  export class ParquetReader {
    static openFile(filePath: string): Promise<ParquetReader>;
    static openBuffer(buffer: Buffer): Promise<ParquetReader>;
    getCursor(): ParquetCursor;
    getSchema(): ParquetSchemaDefinition;
    getRowCount(): number;
    close(): Promise<void>;
  }

  export class ParquetWriter {
    static openFile(schema: ParquetSchemaDefinition, filePath: string): Promise<ParquetWriter>;
    appendRow(row: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
  }

  export class ParquetSchema {
    constructor(schema: Record<string, unknown>);
  }
}
