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
    normalizer?: string;
    synonymMaps?: string[];
    fields?: SearchField[]; // For complex types
    dimensions?: number; // Updated from vectorSearchDimensions to match user request/likely API
    vectorSearchDimensions?: number; // Keeping for backward compat if needed, but prefer dimensions
    vectorSearchProfile?: string; // Updated from vectorSearchProfileName
    vectorSearchProfileName?: string;
    vectorEncoding?: string; // "packedBit"
    stored?: boolean;
}

export interface VectorSearch {
    algorithms?: VectorSearchAlgorithm[];
    profiles?: VectorSearchProfile[];
    compressions?: VectorSearchCompression[];
    vectorizers?: VectorSearchVectorizer[];
}

export type SearchIndexerDataIdentity =
    | SearchIndexerDataNoneIdentity
    | SearchIndexerDataUserAssignedIdentity
    // fallback for unknown/newer kinds
    | (Record<string, any> & { '@odata.type'?: string });

export interface SearchIndexerDataNoneIdentity {
    '@odata.type': '#Microsoft.Azure.Search.DataNoneIdentity';
}

export interface SearchIndexerDataUserAssignedIdentity {
    '@odata.type': '#Microsoft.Azure.Search.DataUserAssignedIdentity';
    userAssignedIdentity: string;
}

export interface InputFieldMappingEntry {
    name?: string;
    source?: string;
    sourceContext?: string;
    inputs?: InputFieldMappingEntry[];
}

export interface OutputFieldMappingEntry {
    name?: string;
    targetName?: string;
}

export type AzureOpenAIModelName =
    | 'text-embedding-ada-002'
    | 'text-embedding-3-large'
    | 'text-embedding-3-small'
    // allow newer models without breaking compilation
    | (string & {});

export interface AzureOpenAIEmbeddingSkill {
    '@odata.type'?: '#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill' | (string & {});
    apiKey?: string;
    authIdentity?: SearchIndexerDataIdentity;
    context?: string;
    deploymentId?: string;
    description?: string;
    dimensions?: number;
    inputs?: InputFieldMappingEntry[];
    modelName?: AzureOpenAIModelName;
    name?: string;
    outputs?: OutputFieldMappingEntry[];
    resourceUri?: string;
}

export interface AzureOpenAIVectorizer {
    kind: 'azureOpenAI';
    name: string;
    azureOpenAIParameters?: AzureOpenAIEmbeddingSkill;
}

export interface WebApiParameters {
    authIdentity?: SearchIndexerDataIdentity;
    authResourceId?: string;
    httpHeaders?: Record<string, string>;
    httpMethod?: string;
    timeout?: string;
    uri?: string;
}

export interface WebApiVectorizer {
    kind: 'customWebApi';
    name: string;
    customWebApiParameters?: WebApiParameters;
}

export type VectorSearchVectorizer =
    | AzureOpenAIVectorizer
    | WebApiVectorizer
    // fallback for unknown/newer kinds
    | ({ kind: string; name: string } & Record<string, any>);

export type VectorSearchCompressionRescoreStorageMethod = 'preserveOriginals' | 'discardOriginals';

export interface VectorSearchRescoringOptions {
    enableRescoring?: boolean;
    defaultOversampling?: number;
    rescoreStorageMethod?: VectorSearchCompressionRescoreStorageMethod;
}

export interface VectorSearchBinaryQuantizationCompression {
    kind: 'binaryQuantization';
    name: string;
    rescoringOptions?: VectorSearchRescoringOptions;
    truncationDimension?: number | null;
}

export type VectorSearchCompressionTargetDataType = 'int8';

export interface VectorSearchScalarQuantizationParameters {
    quantizedDataType?: VectorSearchCompressionTargetDataType;
}

export interface VectorSearchScalarQuantizationCompression {
    kind: 'scalarQuantization';
    name: string;
    rescoringOptions?: VectorSearchRescoringOptions;
    scalarQuantizationParameters?: VectorSearchScalarQuantizationParameters;
    truncationDimension?: number | null;
}

export type VectorSearchCompression =
    | VectorSearchBinaryQuantizationCompression
    | VectorSearchScalarQuantizationCompression
    // fallback for unknown/newer kinds
    | ({ kind: string; name: string } & Record<string, any>);

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
    // Newer/REST-facing property names (what the service returns in some API versions)
    algorithm?: string;
    compression?: string;
    // Legacy/SDK-facing property names (kept for backward compatibility)
    algorithmConfigurationName?: string;
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
