import { apiClient } from './apiClient';
import type { KnowledgeBaseRetrievalResponse } from '../types/KnowledgeBaseRetrievalModels';

export const knowledgeBaseRetrievalService = {
  async retrieve(connectionId: string, knowledgeBaseName: string, request: unknown) {
    return apiClient.post<KnowledgeBaseRetrievalResponse>(
      `/api/knowledgebases/${encodeURIComponent(knowledgeBaseName)}/retrieve?connectionId=${encodeURIComponent(connectionId)}`,
      request
    );
  }
};
