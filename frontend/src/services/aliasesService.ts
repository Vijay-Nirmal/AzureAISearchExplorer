import { searchRestClient } from './searchRestClient';
import type { SearchAlias } from '../types/AliasModels';

type SearchAliasesResponse = {
  value?: SearchAlias[];
};

export const aliasesService = {
  listAliases: async (connectionId: string): Promise<SearchAlias[]> => {
    const response = await searchRestClient.get<SearchAliasesResponse>(connectionId, 'aliases');
    return response.value ?? [];
  },

  getAlias: async (connectionId: string, aliasName: string): Promise<SearchAlias> => {
    const path = `aliases/${encodeURIComponent(aliasName)}`;
    return searchRestClient.get<SearchAlias>(connectionId, path);
  },

  createOrUpdateAlias: async (connectionId: string, alias: SearchAlias): Promise<SearchAlias> => {
    const name = alias.name?.trim();
    if (!name) throw new Error('Alias name is required.');

    const path = `aliases/${encodeURIComponent(name)}`;
    return searchRestClient.put<SearchAlias>(connectionId, path, alias);
  },

  deleteAlias: async (connectionId: string, aliasName: string): Promise<void> => {
    const path = `aliases/${encodeURIComponent(aliasName)}`;
    await searchRestClient.delete(connectionId, path);
  }
};
