export interface SearchIndex {
    name: string;
    fields: SearchField[];
    scoringProfiles?: ScoringProfile[];
    defaultScoringProfile?: string;
    corsOptions?: CorsOptions;
    suggesters?: Suggester[];
    analyzers?: any[];
    tokenizers?: any[];
    tokenFilters?: any[];
    charFilters?: any[];
    encryptionKey?: any;
    similarity?: any;
    semanticSearch?: SemanticSearch;
    vectorSearch?: VectorSearch;
    eTag?: string;
    stats?: IndexStatistics; // Custom addition from backend
}

export interface IndexStatistics {
    documentCount: number;
    storageSize: number;
}

export interface SearchField {
    name: string;
    type: string;
    key?: boolean;
    retrievable?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    sortable?: boolean;
    facetable?: boolean;
    analyzer?: string;
    searchAnalyzer?: string;
    indexAnalyzer?: string;
    synonymMaps?: string[];
    fields?: SearchField[]; // For complex types
    vectorSearchDimensions?: number;
    vectorSearchProfileName?: string;
}

export interface VectorSearch {
    algorithms?: VectorSearchAlgorithm[];
    profiles?: VectorSearchProfile[];
    compressions?: any[]; // Simplified for now
    vectorizers?: any[]; // Simplified
}

export interface VectorSearchAlgorithm {
    name: string;
    kind: string; // hnsw, exhaustiveKnn
    hnswParameters?: {
        m?: number;
        efConstruction?: number;
        efSearch?: number;
        metric?: string;
    };
    exhaustiveKnnParameters?: {
        metric?: string;
    };
}

export interface VectorSearchProfile {
    name: string;
    algorithmConfigurationName: string;
    compressionName?: string;
    vectorizer?: string;
}

export interface ScoringProfile {
    name: string;
    textWeights?: {
        weights: { [fieldName: string]: number };
    };
    functions?: any[];
    functionAggregation?: string;
}

export interface Suggester {
    name: string;
    sourceFields: string[];
}

export interface CorsOptions {
    allowedOrigins: string[];
    maxAgeInSeconds?: number;
}

export interface SemanticSearch {
    configurations?: any[]; // Simplified
}

export interface SearchOptions {
    includeTotalCount?: boolean;
    filter?: string;
    orderBy?: string[]; // Note: SDK might expect array
    select?: string[];
    top?: number;
    skip?: number;
    searchMode?: 'any' | 'all';
    queryType?: 'simple' | 'full' | 'semantic';
    // Add other needed options
}

export interface SearchResult {
    [key: string]: any;
    "@search.score"?: number;
    "@search.highlights"?: any;
}

export interface QueryResponse {
    count?: number;
    results: SearchResult[];
}
