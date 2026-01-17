import { apiClient } from './apiClient';

export const classicRetrievalService = {
  searchDocuments: async (
    connectionId: string,
    indexName: string,
    requestBody: unknown
  ): Promise<unknown> => {
    return apiClient.post<unknown>(
      `/api/classic/indexes/${encodeURIComponent(indexName)}/documents/search?connectionId=${encodeURIComponent(connectionId)}`,
      requestBody
    );
  },

  indexDocuments: async (
    connectionId: string,
    indexName: string,
    requestBody: unknown
  ): Promise<unknown> => {
    return apiClient.post<unknown>(
      `/api/classic/indexes/${encodeURIComponent(indexName)}/documents/index?connectionId=${encodeURIComponent(connectionId)}`,
      requestBody
    );
  }
};
