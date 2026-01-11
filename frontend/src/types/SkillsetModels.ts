export interface SkillsetListItem {
  name: string;
  description?: string;
  skillsCount: number;
  eTag?: string;
}

export interface SearchIndexerSkillset {
  name: string;
  description?: string;
  cognitiveServices?: Record<string, unknown> | null;
  encryptionKey?: Record<string, unknown> | null;
  indexProjections?: Record<string, unknown> | null;
  knowledgeStore?: Record<string, unknown> | null;
  skills?: Array<Record<string, unknown>>;

  // The service uses @odata.etag; the backend returns SDK's ETag which maps to that.
  ['@odata.etag']?: string;
}
