import { searchRestClient } from './searchRestClient';
import type { SearchIndexerSkillset, SkillsetListItem } from '../types/SkillsetModels';

type SearchSkillsetsResponse = {
  value?: SearchIndexerSkillset[];
};

export const skillsetsService = {
  listSkillsets: async (connectionId: string): Promise<SkillsetListItem[]> => {
    const response = await searchRestClient.get<SearchSkillsetsResponse>(connectionId, 'skillsets');

    return (response.value ?? []).map((skillset) => ({
      name: skillset.name,
      description: skillset.description,
      skillsCount: skillset.skills?.length ?? 0,
      eTag: skillset['@odata.etag']
    }));
  },

  getSkillset: async (connectionId: string, skillsetName: string): Promise<SearchIndexerSkillset> => {
    const path = `skillsets/${encodeURIComponent(skillsetName)}`;
    return searchRestClient.get<SearchIndexerSkillset>(connectionId, path);
  },

  createOrUpdateSkillset: async (connectionId: string, skillset: SearchIndexerSkillset): Promise<SearchIndexerSkillset> => {
    const name = skillset.name?.trim();
    if (!name) throw new Error('Skillset name is required.');

    const path = `skillsets/${encodeURIComponent(name)}`;
    return searchRestClient.put<SearchIndexerSkillset>(connectionId, path, skillset);
  },

  deleteSkillset: async (connectionId: string, skillsetName: string): Promise<void> => {
    const path = `skillsets/${encodeURIComponent(skillsetName)}`;
    await searchRestClient.delete(connectionId, path);
  }
};
