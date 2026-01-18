import { searchRestClient } from './searchRestClient';

export const classicRetrievalService = {
  searchDocuments: async (
    connectionId: string,
    indexName: string,
    requestBody: unknown
  ): Promise<unknown> => {
    const path = `indexes/${encodeURIComponent(indexName)}/docs/search`;
    return searchRestClient.post<unknown>(connectionId, path, requestBody);
  },

  indexDocuments: async (
    connectionId: string,
    indexName: string,
    requestBody: unknown
  ): Promise<unknown> => {
    const path = `indexes/${encodeURIComponent(indexName)}/docs/search.index`;
    return searchRestClient.post<unknown>(connectionId, path, requestBody);
  }
};
