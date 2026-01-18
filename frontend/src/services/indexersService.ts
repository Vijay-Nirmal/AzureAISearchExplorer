import { searchRestClient } from './searchRestClient';
import type { IndexerListItem, ResetDocumentsRequest, SearchIndexer } from '../types/IndexerModels';
import type { SearchIndexerStatus } from '../types/IndexerStatusModels';

type SearchIndexersResponse = {
  value?: SearchIndexer[];
};

export const indexersService = {
  listIndexers: async (connectionId: string): Promise<IndexerListItem[]> => {
    const response = await searchRestClient.get<SearchIndexersResponse>(connectionId, 'indexers');
    return (response.value ?? []).map((x) => ({
      name: x.name,
      description: x.description ?? undefined,
      dataSourceName: x.dataSourceName ?? undefined,
      targetIndexName: x.targetIndexName ?? undefined,
      skillsetName: x.skillsetName ?? undefined,
      disabled: typeof x.disabled === 'boolean' ? x.disabled : undefined,
      eTag: x['@odata.etag'] ?? undefined
    }));
  },

  getIndexer: async (connectionId: string, indexerName: string): Promise<SearchIndexer> => {
    const path = `indexers/${encodeURIComponent(indexerName)}`;
    return searchRestClient.get<SearchIndexer>(connectionId, path);
  },

  createOrUpdateIndexer: async (connectionId: string, indexer: SearchIndexer): Promise<SearchIndexer> => {
    const name = indexer.name?.trim();
    if (!name) throw new Error('Indexer name is required.');

    const path = `indexers/${encodeURIComponent(name)}`;
    return searchRestClient.put<SearchIndexer>(connectionId, path, indexer);
  },

  deleteIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    const path = `indexers/${encodeURIComponent(indexerName)}`;
    await searchRestClient.delete(connectionId, path);
  },

  getIndexerStatus: async (connectionId: string, indexerName: string): Promise<SearchIndexerStatus> => {
    const path = `indexers/${encodeURIComponent(indexerName)}/status`;
    return searchRestClient.get<SearchIndexerStatus>(connectionId, path);
  },

  runIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    const path = `indexers/${encodeURIComponent(indexerName)}/run`;
    await searchRestClient.post<unknown>(connectionId, path);
  },

  resetIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    const path = `indexers/${encodeURIComponent(indexerName)}/reset`;
    await searchRestClient.post<unknown>(connectionId, path);
  },

  resyncIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    const path = `indexers/${encodeURIComponent(indexerName)}/search.resync`;
    await searchRestClient.post<unknown>(connectionId, path);
  },

  resetDocuments: async (connectionId: string, indexerName: string, request: ResetDocumentsRequest): Promise<void> => {
    const path = `indexers/${encodeURIComponent(indexerName)}/search.resetdocs`;
    await searchRestClient.post<unknown>(connectionId, path, request);
  }
};
