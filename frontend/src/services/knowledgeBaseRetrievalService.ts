import { searchRestClient } from './searchRestClient';
import type { KnowledgeBaseRetrievalResponse } from '../types/KnowledgeBaseRetrievalModels';

export const knowledgeBaseRetrievalService = {
  async retrieve(connectionId: string, knowledgeBaseName: string, request: unknown) {
    const path = `knowledgeBases/${encodeURIComponent(knowledgeBaseName)}/retrieve`;
    return searchRestClient.post<KnowledgeBaseRetrievalResponse>(connectionId, path, request);
  }
};
