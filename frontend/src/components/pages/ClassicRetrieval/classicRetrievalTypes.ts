export type IndexListLike = {
  name: string;
  description?: string;
};

export type IndexFieldLike = {
  name: string;
  type: string;
  key?: boolean;
  retrievable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  facetable?: boolean;
  dimensions?: number;
  vectorSearchDimensions?: number;
};

export type ColumnDef = {
  header: string;
  path: string;
};

export type SearchDraft = {
  search: string;
  queryType: string;
  searchMode: string;
  queryLanguage: string;
  queryRewrites: string;
  speller: string;
  count: boolean;
  top: number;
  skip: number;
  filter: string;
  select: string;
  orderby: string;
  searchFields: string;
  facets: string[];
  highlight: string;
  highlightPreTag: string;
  highlightPostTag: string;
  scoringProfile: string;
  scoringParameters: string[];
  scoringStatistics: string;
  minimumCoverage: number;
  answers: string;
  captions: string;
  debug: string;
  semanticFields: string;
  semanticConfiguration: string;
  semanticQuery: string;
  semanticErrorHandling: string;
  semanticMaxWaitInMilliseconds: number | '';
  sessionId: string;
  hybridSearchEnabled: boolean;
  hybridCountAndFacetMode: string;
  hybridMaxTextRecallSize: number | '';
  basicVectorEnabled: boolean;
  basicVectorFields: string;
  basicVectorText: string;
  basicVectorK: number | '';
  basicVectorWeight: number;
  vectorFilterMode: string;
  vectorQueries: Record<string, unknown>[];
};

export type TabId = 'table' | 'insights' | 'json';
