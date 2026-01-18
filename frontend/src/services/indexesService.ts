import { searchRestClient } from './searchRestClient';
import type { SearchIndex, QueryResponse, SearchOptions, IndexStatistics } from '../types/IndexModels';

type SearchIndexesResponse = {
  value?: SearchIndex[];
};

type SearchIndexStatsResponse = IndexStatistics;

type SearchQueryResponse = {
  value?: Array<Record<string, unknown>>;
  ['@odata.count']?: number;
};

export const indexesService = {
  listIndexes: async (connectionId: string): Promise<any[]> => {
    const response = await searchRestClient.get<SearchIndexesResponse>(connectionId, 'indexes');
    const indexes = response.value ?? [];

    const withStats = await Promise.all(
      indexes.map(async (index) => {
        const name = index?.name?.trim();
        if (!name) return index;

        try {
          const stats = await searchRestClient.get<SearchIndexStatsResponse>(
            connectionId,
            `indexes/${encodeURIComponent(name)}/stats`
          );
          return { ...index, stats };
        } catch {
          return index;
        }
      })
    );

    return withStats;
  },

  getIndex: async (connectionId: string, indexName: string): Promise<SearchIndex> => {
    const path = `indexes/${encodeURIComponent(indexName)}`;
    return searchRestClient.get<SearchIndex>(connectionId, path);
  },

  createOrUpdateIndex: async (connectionId: string, index: SearchIndex): Promise<SearchIndex> => {
    const name = index.name?.trim();
    if (!name) throw new Error('Index name is required.');

    const path = `indexes/${encodeURIComponent(name)}`;
    return searchRestClient.put<SearchIndex>(connectionId, path, index);
  },

  deleteIndex: async (connectionId: string, indexName: string): Promise<void> => {
    const path = `indexes/${encodeURIComponent(indexName)}`;
    await searchRestClient.delete(connectionId, path);
  },

  queryIndex: async (connectionId: string, indexName: string, searchText: string, options: SearchOptions): Promise<QueryResponse> => {
    const path = `indexes/${encodeURIComponent(indexName)}/docs/search`;
    const body = { ...options, search: searchText };
    const response = await searchRestClient.post<SearchQueryResponse>(connectionId, path, body);

    return {
      count: response['@odata.count'],
      results: response.value ?? []
    };
  }
};
