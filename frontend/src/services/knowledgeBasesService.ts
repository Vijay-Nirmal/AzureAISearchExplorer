import { apiClient } from './apiClient';
import type { KnowledgeBase } from '../types/KnowledgeBaseModels';

export const knowledgeBasesService = {
  async listKnowledgeBases(connectionId: string) {
    return apiClient.get<KnowledgeBase[]>(`/api/knowledgebases?connectionId=${connectionId}`);
  },

  async getKnowledgeBase(connectionId: string, name: string) {
    return apiClient.get<KnowledgeBase>(`/api/knowledgebases/${encodeURIComponent(name)}?connectionId=${connectionId}`);
  },

  async upsertKnowledgeBase(connectionId: string, knowledgeBase: KnowledgeBase) {
    return apiClient.post<KnowledgeBase>(`/api/knowledgebases?connectionId=${connectionId}`, knowledgeBase);
  },

  async deleteKnowledgeBase(connectionId: string, name: string) {
    return apiClient.delete(`/api/knowledgebases/${encodeURIComponent(name)}?connectionId=${connectionId}`);
  }
};
