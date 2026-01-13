export interface IndexerListItem {
  name: string;
  description?: string;
  dataSourceName?: string;
  targetIndexName?: string;
  skillsetName?: string;
  disabled?: boolean;
  eTag?: string;
}

// Keep flexible to tolerate newer service versions.
export type SearchIndexer = {
  name: string;
  description?: string;
  dataSourceName?: string;
  targetIndexName?: string;
  skillsetName?: string;
  disabled?: boolean;

  schedule?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  fieldMappings?: Array<Record<string, unknown>>;
  outputFieldMappings?: Array<Record<string, unknown>>;
  cache?: Record<string, unknown>;
  encryptionKey?: Record<string, unknown>;

  '@odata.etag'?: string;
  [key: string]: unknown;
};

export interface ResetDocumentsRequest {
  documentKeys?: string[];
  datasourceDocumentIds?: string[];
}
