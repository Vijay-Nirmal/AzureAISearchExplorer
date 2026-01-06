import { apiClient } from './apiClient';
import type { SearchIndex, QueryResponse, SearchOptions } from '../types/IndexModels';

export const indexesService = {
  listIndexes: async (connectionId: string): Promise<any[]> => {
    // Return custom object with stats
    // The backend returns { index: SearchIndex, stats: IndexStatistics } or flattened
    // Let's check backend endpoint implementation
    // It returns: { Name, Fields, ..., Stats } object
    return apiClient.get<any[]>(`/api/indexes?connectionId=${connectionId}`);
  },

  getIndex: async (connectionId: string, indexName: string): Promise<SearchIndex> => {
    return apiClient.get<SearchIndex>(`/api/indexes/${indexName}?connectionId=${connectionId}`);
  },

  createOrUpdateIndex: async (connectionId: string, index: SearchIndex): Promise<SearchIndex> => {
    return apiClient.post<SearchIndex>(`/api/indexes?connectionId=${connectionId}`, index);
  },

  deleteIndex: async (connectionId: string, indexName: string): Promise<void> => {
    return apiClient.delete(`/api/indexes/${indexName}?connectionId=${connectionId}`);
  },

  queryIndex: async (connectionId: string, indexName: string, searchText: string, options: SearchOptions): Promise<QueryResponse> => {
    // Need to encode search text
    const encodedSearch = encodeURIComponent(searchText);
    return apiClient.post<QueryResponse>(
        `/api/indexes/${indexName}/query?connectionId=${connectionId}&searchText=${encodedSearch}`, 
        options
    );
  }
};
