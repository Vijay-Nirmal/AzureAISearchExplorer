import { searchRestClient } from './searchRestClient';
import type { KnowledgeBase } from '../types/KnowledgeBaseModels';

type SearchKnowledgeBasesResponse = {
  value?: KnowledgeBase[];
};

export const knowledgeBasesService = {
  async listKnowledgeBases(connectionId: string) {
    const response = await searchRestClient.get<SearchKnowledgeBasesResponse>(connectionId, 'knowledgeBases');
    return response.value ?? [];
  },

  async getKnowledgeBase(connectionId: string, name: string) {
    const path = `knowledgeBases/${encodeURIComponent(name)}`;
    return searchRestClient.get<KnowledgeBase>(connectionId, path);
  },

  async upsertKnowledgeBase(connectionId: string, knowledgeBase: KnowledgeBase) {
    const name = knowledgeBase.name?.trim();
    if (!name) throw new Error('Knowledge base name is required.');

    const path = `knowledgeBases/${encodeURIComponent(name)}`;
    return searchRestClient.put<KnowledgeBase>(connectionId, path, knowledgeBase);
  },

  async deleteKnowledgeBase(connectionId: string, name: string) {
    const path = `knowledgeBases/${encodeURIComponent(name)}`;
    await searchRestClient.delete(connectionId, path);
  }
};
