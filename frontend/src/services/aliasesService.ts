import { apiClient } from './apiClient';
import type { SearchAlias } from '../types/AliasModels';

export const aliasesService = {
  listAliases: async (connectionId: string): Promise<SearchAlias[]> => {
    return apiClient.get<SearchAlias[]>(`/api/aliases?connectionId=${connectionId}`);
  },

  getAlias: async (connectionId: string, aliasName: string): Promise<SearchAlias> => {
    return apiClient.get<SearchAlias>(`/api/aliases/${encodeURIComponent(aliasName)}?connectionId=${connectionId}`);
  },

  createOrUpdateAlias: async (connectionId: string, alias: SearchAlias): Promise<SearchAlias> => {
    return apiClient.post<SearchAlias>(`/api/aliases?connectionId=${connectionId}`, alias);
  },

  deleteAlias: async (connectionId: string, aliasName: string): Promise<void> => {
    return apiClient.delete(`/api/aliases/${encodeURIComponent(aliasName)}?connectionId=${connectionId}`);
  }
};
