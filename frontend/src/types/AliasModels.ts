export interface SearchAlias {
  name: string;
  indexes: string[];

  '@odata.etag'?: string;
  [key: string]: unknown;
}
