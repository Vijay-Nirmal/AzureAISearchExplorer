import { apiClient } from './apiClient';
import type { KnowledgeSource } from '../types/KnowledgeSourceModels';

export const knowledgeSourcesService = {
  async listKnowledgeSources(connectionId: string) {
    return apiClient.get<KnowledgeSource[]>(`/api/knowledgesources?connectionId=${connectionId}`);
  },

  async getKnowledgeSource(connectionId: string, name: string) {
    return apiClient.get<KnowledgeSource>(`/api/knowledgesources/${encodeURIComponent(name)}?connectionId=${connectionId}`);
  },

  async upsertKnowledgeSource(connectionId: string, knowledgeSource: KnowledgeSource) {
    return apiClient.post<KnowledgeSource>(`/api/knowledgesources?connectionId=${connectionId}`, knowledgeSource);
  },

  async deleteKnowledgeSource(connectionId: string, name: string) {
    return apiClient.delete(`/api/knowledgesources/${encodeURIComponent(name)}?connectionId=${connectionId}`);
  }
};
