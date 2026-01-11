import { apiClient } from './apiClient';
import type { SearchIndexerSkillset, SkillsetListItem } from '../types/SkillsetModels';

type SkillsetListItemDto = {
  name: string;
  description?: string | null;
  skillsCount: number;
  eTag?: string | null;
};

export const skillsetsService = {
  listSkillsets: async (connectionId: string): Promise<SkillsetListItem[]> => {
    const raw = await apiClient.get<SkillsetListItemDto[]>(`/api/skillsets?connectionId=${connectionId}`);
    return (raw ?? []).map((x) => ({
      name: x.name,
      description: x.description ?? undefined,
      skillsCount: x.skillsCount,
      eTag: x.eTag ?? undefined
    }));
  },

  getSkillset: async (connectionId: string, skillsetName: string): Promise<SearchIndexerSkillset> => {
    return apiClient.get<SearchIndexerSkillset>(`/api/skillsets/${encodeURIComponent(skillsetName)}?connectionId=${connectionId}`);
  },

  createOrUpdateSkillset: async (connectionId: string, skillset: SearchIndexerSkillset): Promise<SearchIndexerSkillset> => {
    return apiClient.post<SearchIndexerSkillset>(`/api/skillsets?connectionId=${connectionId}`, skillset);
  },

  deleteSkillset: async (connectionId: string, skillsetName: string): Promise<void> => {
    return apiClient.delete(`/api/skillsets/${encodeURIComponent(skillsetName)}?connectionId=${connectionId}`);
  }
};
