import { apiClient } from './apiClient';
import type { SynonymMap } from '../types/SynonymMapModels';

export const synonymMapsService = {
  listSynonymMaps: async (connectionId: string): Promise<SynonymMap[]> => {
    return apiClient.get<SynonymMap[]>(`/api/synonymmaps?connectionId=${connectionId}`);
  },

  getSynonymMap: async (connectionId: string, synonymMapName: string): Promise<SynonymMap> => {
    return apiClient.get<SynonymMap>(`/api/synonymmaps/${encodeURIComponent(synonymMapName)}?connectionId=${connectionId}`);
  },

  createOrUpdateSynonymMap: async (connectionId: string, synonymMap: SynonymMap): Promise<SynonymMap> => {
    return apiClient.post<SynonymMap>(`/api/synonymmaps?connectionId=${connectionId}`, synonymMap);
  },

  deleteSynonymMap: async (connectionId: string, synonymMapName: string): Promise<void> => {
    return apiClient.delete(`/api/synonymmaps/${encodeURIComponent(synonymMapName)}?connectionId=${connectionId}`);
  }
};
