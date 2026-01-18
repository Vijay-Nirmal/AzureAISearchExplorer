import { searchRestClient } from './searchRestClient';
import type { SynonymMap } from '../types/SynonymMapModels';

type SearchSynonymMapsResponse = {
  value?: SynonymMap[];
};

export const synonymMapsService = {
  listSynonymMaps: async (connectionId: string): Promise<SynonymMap[]> => {
    const response = await searchRestClient.get<SearchSynonymMapsResponse>(connectionId, 'synonymmaps');
    return response.value ?? [];
  },

  getSynonymMap: async (connectionId: string, synonymMapName: string): Promise<SynonymMap> => {
    const path = `synonymmaps/${encodeURIComponent(synonymMapName)}`;
    return searchRestClient.get<SynonymMap>(connectionId, path);
  },

  createOrUpdateSynonymMap: async (connectionId: string, synonymMap: SynonymMap): Promise<SynonymMap> => {
    const name = synonymMap.name?.trim();
    if (!name) throw new Error('Synonym map name is required.');

    const path = `synonymmaps/${encodeURIComponent(name)}`;
    return searchRestClient.put<SynonymMap>(connectionId, path, synonymMap);
  },

  deleteSynonymMap: async (connectionId: string, synonymMapName: string): Promise<void> => {
    const path = `synonymmaps/${encodeURIComponent(synonymMapName)}`;
    await searchRestClient.delete(connectionId, path);
  }
};
