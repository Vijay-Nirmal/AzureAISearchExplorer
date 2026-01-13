import type { SearchResourceEncryptionKey } from './IndexModels';

export type KnowledgeRetrievalOutputMode = 'extractiveData' | 'answerSynthesis' | (string & {});

export type KnowledgeRetrievalReasoningEffortKind = 'low' | 'medium' | 'minimal' | (string & {});

export interface KnowledgeSourceReference {
  name: string;
}

export interface KnowledgeRetrievalReasoningEffort {
  kind: KnowledgeRetrievalReasoningEffortKind;
  [key: string]: unknown;
}

export interface KnowledgeBaseAzureOpenAIParameters {
  resourceUri?: string;
  deploymentId?: string;
  modelName?: string;
  apiKey?: string;
  authIdentity?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KnowledgeBaseModel {
  kind: 'azureOpenAI' | (string & {});
  azureOpenAIParameters?: KnowledgeBaseAzureOpenAIParameters | Record<string, unknown>;
  [key: string]: unknown;
}

export interface KnowledgeBase {
  name: string;
  '@odata.type'?: string;

  description?: string;
  answerInstructions?: string;
  retrievalInstructions?: string;
  outputMode?: KnowledgeRetrievalOutputMode;
  retrievalReasoningEffort?: KnowledgeRetrievalReasoningEffort | Record<string, unknown>;
  encryptionKey?: SearchResourceEncryptionKey | Record<string, unknown> | null;
  knowledgeSources?: KnowledgeSourceReference[];
  models?: KnowledgeBaseModel[];

  '@odata.etag'?: string;
  [key: string]: unknown;
}
