import { apiClient } from './apiClient';
import type { IndexerListItem, ResetDocumentsRequest, SearchIndexer } from '../types/IndexerModels';
import type { SearchIndexerStatus } from '../types/IndexerStatusModels';

type IndexerListItemDto = {
  name: string;
  description?: string | null;
  dataSourceName?: string | null;
  targetIndexName?: string | null;
  skillsetName?: string | null;
  disabled?: boolean | null;
  eTag?: string | null;
};

export const indexersService = {
  listIndexers: async (connectionId: string): Promise<IndexerListItem[]> => {
    const raw = await apiClient.get<IndexerListItemDto[]>(`/api/indexers?connectionId=${connectionId}`);
    return (raw ?? []).map((x) => ({
      name: x.name,
      description: x.description ?? undefined,
      dataSourceName: x.dataSourceName ?? undefined,
      targetIndexName: x.targetIndexName ?? undefined,
      skillsetName: x.skillsetName ?? undefined,
      disabled: typeof x.disabled === 'boolean' ? x.disabled : undefined,
      eTag: x.eTag ?? undefined
    }));
  },

  getIndexer: async (connectionId: string, indexerName: string): Promise<SearchIndexer> => {
    return apiClient.get<SearchIndexer>(`/api/indexers/${encodeURIComponent(indexerName)}?connectionId=${connectionId}`);
  },

  createOrUpdateIndexer: async (connectionId: string, indexer: SearchIndexer): Promise<SearchIndexer> => {
    return apiClient.post<SearchIndexer>(`/api/indexers?connectionId=${connectionId}`, indexer);
  },

  deleteIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    return apiClient.delete(`/api/indexers/${encodeURIComponent(indexerName)}?connectionId=${connectionId}`);
  },

  getIndexerStatus: async (connectionId: string, indexerName: string): Promise<SearchIndexerStatus> => {
    return apiClient.get<SearchIndexerStatus>(`/api/indexers/${encodeURIComponent(indexerName)}/status?connectionId=${connectionId}`);
  },

  runIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    await apiClient.post(`/api/indexers/${encodeURIComponent(indexerName)}/run?connectionId=${connectionId}`, {});
  },

  resetIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    await apiClient.post(`/api/indexers/${encodeURIComponent(indexerName)}/reset?connectionId=${connectionId}`, {});
  },

  resyncIndexer: async (connectionId: string, indexerName: string): Promise<void> => {
    await apiClient.post(`/api/indexers/${encodeURIComponent(indexerName)}/resync?connectionId=${connectionId}`, {});
  },

  resetDocuments: async (connectionId: string, indexerName: string, request: ResetDocumentsRequest): Promise<void> => {
    await apiClient.post(`/api/indexers/${encodeURIComponent(indexerName)}/reset-docs?connectionId=${connectionId}`, request);
  }
};
