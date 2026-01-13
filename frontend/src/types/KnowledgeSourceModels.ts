import type { SearchResourceEncryptionKey } from './IndexModels';

export type KnowledgeSourceKind =
  | 'searchIndex'
  | 'azureBlob'
  | 'indexedOneLake'
  | 'indexedSharePoint'
  | 'remoteSharePoint'
  | 'web'
  | (string & {});

export interface SearchIndexFieldReference {
  name: string;
}

export interface SearchIndexKnowledgeSourceParameters {
  searchIndexName: string;
  semanticConfigurationName?: string;
  searchFields?: SearchIndexFieldReference[];
  sourceDataFields?: SearchIndexFieldReference[];
}

export interface AzureBlobKnowledgeSourceParameters {
  connectionString: string;
  containerName: string;
  folderPath?: string;
  isADLSGen2?: boolean;
  ingestionParameters?: Record<string, unknown>;
  createdResources?: Record<string, unknown>;
}

export interface IndexedOneLakeKnowledgeSourceParameters {
  fabricWorkspaceId: string;
  lakehouseId: string;
  targetPath?: string;
  ingestionParameters?: Record<string, unknown>;
  createdResources?: Record<string, unknown>;
}

export interface IndexedSharePointKnowledgeSourceParameters {
  connectionString: string;
  containerName: string;
  query?: string;
  ingestionParameters?: Record<string, unknown>;
  createdResources?: Record<string, unknown>;
}

export interface RemoteSharePointKnowledgeSourceParameters {
  containerTypeId?: string;
  filterExpression?: string;
  resourceMetadata?: string[];
}

export interface WebKnowledgeSourceDomain {
  address: string;
  includeSubpages?: boolean;
}

export interface WebKnowledgeSourceDomains {
  allowedDomains?: WebKnowledgeSourceDomain[];
  blockedDomains?: WebKnowledgeSourceDomain[];
}

export interface WebKnowledgeSourceParameters {
  domains?: WebKnowledgeSourceDomains;
}

export interface KnowledgeSource {
  name: string;
  kind: KnowledgeSourceKind;
  description?: string;
  encryptionKey?: SearchResourceEncryptionKey | Record<string, unknown> | null;
  searchIndexParameters?: SearchIndexKnowledgeSourceParameters | Record<string, unknown>;
  azureBlobParameters?: AzureBlobKnowledgeSourceParameters | Record<string, unknown>;
  indexedOneLakeParameters?: IndexedOneLakeKnowledgeSourceParameters | Record<string, unknown>;
  indexedSharePointParameters?: IndexedSharePointKnowledgeSourceParameters | Record<string, unknown>;
  remoteSharePointParameters?: RemoteSharePointKnowledgeSourceParameters | Record<string, unknown>;
  webParameters?: WebKnowledgeSourceParameters | Record<string, unknown>;

  '@odata.etag'?: string;
  [key: string]: unknown;
}
