import { searchRestClient } from './searchRestClient';
import type { KnowledgeSource } from '../types/KnowledgeSourceModels';

type SearchKnowledgeSourcesResponse = {
  value?: KnowledgeSource[];
};

export const knowledgeSourcesService = {
  async listKnowledgeSources(connectionId: string) {
    const response = await searchRestClient.get<SearchKnowledgeSourcesResponse>(connectionId, 'knowledgeSources');
    return response.value ?? [];
  },

  async getKnowledgeSource(connectionId: string, name: string) {
    const path = `knowledgeSources/${encodeURIComponent(name)}`;
    return searchRestClient.get<KnowledgeSource>(connectionId, path);
  },

  async upsertKnowledgeSource(connectionId: string, knowledgeSource: KnowledgeSource) {
    const name = knowledgeSource.name?.trim();
    if (!name) throw new Error('Knowledge source name is required.');

    const path = `knowledgeSources/${encodeURIComponent(name)}`;
    return searchRestClient.put<KnowledgeSource>(connectionId, path, knowledgeSource);
  },

  async deleteKnowledgeSource(connectionId: string, name: string) {
    const path = `knowledgeSources/${encodeURIComponent(name)}`;
    await searchRestClient.delete(connectionId, path);
  }
};
