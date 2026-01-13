export interface DataSourceCredentials {
  connectionString?: string;
}

export interface SearchIndexerDataContainer {
  name?: string;
  query?: string;
}

// Shape matches Azure.Search.Documents.Indexes.Models.SearchIndexerDataSourceConnection
export interface SearchIndexerDataSourceConnection {
  name: string;
  description?: string;
  type?: string;
  subType?: string;
  credentials?: DataSourceCredentials;
  container?: SearchIndexerDataContainer;
  identity?: Record<string, unknown>;
  encryptionKey?: Record<string, unknown>;
  dataChangeDetectionPolicy?: Record<string, unknown>;
  dataDeletionDetectionPolicy?: Record<string, unknown>;
  indexerPermissionOptions?: string[];
  ['@odata.etag']?: string;
  [key: string]: unknown;
}

export interface DataSourceListItem {
  name: string;
  description?: string;
  type?: string;
  containerName?: string;
  eTag?: string;
}
