export type KnowledgeBaseRetrievalResponse = {
  activity?: KnowledgeBaseActivityRecord[];
  references?: KnowledgeBaseReference[];
  response?: KnowledgeBaseMessage[];
  [key: string]: unknown;
};

export type KnowledgeBaseMessage = {
  role?: string;
  content?: KnowledgeBaseMessageContent[];
  [key: string]: unknown;
};

export type KnowledgeBaseMessageContent =
  | { type: 'text'; text?: string; [key: string]: unknown }
  | { type: 'image'; image?: { url?: string }; [key: string]: unknown }
  | { type: string; [key: string]: unknown };

export type KnowledgeBaseActivityRecord = {
  type?: string;
  id?: number;
  elapsedMs?: number;
  error?: unknown;
  [key: string]: unknown;
};

export type KnowledgeBaseReference = {
  type?: string;
  id?: string;
  activitySource?: number;
  rerankerScore?: number;
  sourceData?: unknown;
  [key: string]: unknown;
};
