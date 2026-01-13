import type { SearchResourceEncryptionKey } from './IndexModels';

export type SynonymMapFormat = 'solr' | (string & {});

export interface SynonymMap {
  name: string;
  format?: SynonymMapFormat;
  synonyms: string;
  encryptionKey?: SearchResourceEncryptionKey | Record<string, unknown> | null;

  '@odata.etag'?: string;
  [key: string]: unknown;
}
