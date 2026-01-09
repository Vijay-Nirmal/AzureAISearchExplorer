export interface SearchIndex {
    name: string;
    description?: string;
    fields: SearchField[];
    scoringProfiles?: ScoringProfile[];
    defaultScoringProfile?: string;
    corsOptions?: CorsOptions;
    suggesters?: Suggester[];
    analyzers?: LexicalAnalyzer[];
    normalizers?: LexicalNormalizer[];
    tokenizers?: unknown[];
    tokenFilters?: unknown[];
    charFilters?: CharFilter[];
    encryptionKey?: SearchResourceEncryptionKey;
    similarity?: unknown;
    semantic?: SemanticSettings;
    semanticSearch?: SemanticSearch;
    vectorSearch?: VectorSearch;
    eTag?: string;
    stats?: IndexStatistics; // Custom addition from backend
}

export type RankingOrder =
    | 'BoostedRerankerScore'
    | 'RerankerScore'
    // allow newer values without breaking compilation
    | (string & {});

export interface SemanticField {
    fieldName: string;
}

export interface PrioritizedFields {
    titleField?: SemanticField;
    prioritizedContentFields?: SemanticField[];
    prioritizedKeywordsFields?: SemanticField[];
}

export interface SemanticConfiguration {
    name: string;
    prioritizedFields?: PrioritizedFields;
    rankingOrder?: RankingOrder;
}

export interface SemanticSettings {
    configurations?: SemanticConfiguration[];
    defaultConfiguration?: string;
}

export interface SearchResourceEncryptionKey {
    accessCredentials?: AzureActiveDirectoryApplicationCredentials;
    keyVaultKeyName?: string;
    keyVaultKeyVersion?: string;
    keyVaultUri?: string;
}

export interface AzureActiveDirectoryApplicationCredentials {
    applicationId?: string;
    applicationSecret?: string;
}

export type CharFilter =
    | MappingCharFilter
    | PatternReplaceCharFilter
    // fallback for unknown/newer char filter shapes
    | (Record<string, unknown> & { '@odata.type'?: string; name?: string });

export interface MappingCharFilter {
    '@odata.type': '#Microsoft.Azure.Search.MappingCharFilter';
    name: string;
    mappings: string[];
}

export interface PatternReplaceCharFilter {
    '@odata.type': '#Microsoft.Azure.Search.PatternReplaceCharFilter';
    name: string;
    pattern: string;
    replacement: string;
}

export type LexicalAnalyzer =
    | CustomAnalyzer
    | LuceneStandardAnalyzer
    | PatternAnalyzer
    | StopAnalyzer
    // fallback for unknown/newer analyzer shapes
    | (Record<string, unknown> & { '@odata.type'?: string; name?: string });

export type LexicalNormalizer =
    | CustomNormalizer
    // fallback for unknown/newer normalizer shapes
    | (Record<string, unknown> & {
        '@odata.type'?: string;
        name?: string;
        charFilters?: string[];
        tokenFilters?: string[];
    });

export interface CustomNormalizer {
    '@odata.type': '#Microsoft.Azure.Search.CustomNormalizer';
    name: string;
    charFilters?: string[];
    tokenFilters?: string[];
}

export interface CustomAnalyzer {
    '@odata.type': '#Microsoft.Azure.Search.CustomAnalyzer';
    name: string;
    tokenizer: string;
    charFilters?: string[];
    tokenFilters?: string[];
}

export interface LuceneStandardAnalyzer {
    '@odata.type': '#Microsoft.Azure.Search.StandardAnalyzer';
    name: string;
    maxTokenLength?: number;
    stopwords?: string[];
}

export interface PatternAnalyzer {
    '@odata.type': '#Microsoft.Azure.Search.PatternAnalyzer';
    name: string;
    flags?: string[];
    lowercase?: boolean;
    pattern?: string;
    stopwords?: string[];
}

export interface StopAnalyzer {
    '@odata.type': '#Microsoft.Azure.Search.StopAnalyzer';
    name: string;
    stopwords?: string[];
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
    | (Record<string, unknown> & { '@odata.type'?: string });

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
    | ({ kind: string; name: string } & Record<string, unknown>);

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
    | ({ kind: string; name: string } & Record<string, unknown>);

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

export type ScoringFunctionAggregation =
    | 'sum'
    | 'average'
    | 'minimum'
    | 'maximum'
    | 'firstMatching'
    // allow newer values without breaking compilation
    | (string & {});

export type ScoringFunctionInterpolation =
    | 'linear'
    | 'constant'
    | 'quadratic'
    | 'logarithmic'
    // allow newer values without breaking compilation
    | (string & {});

export interface TextWeights {
    weights: { [fieldName: string]: number };
}

export interface BaseScoringFunction {
    type: string;
    boost?: number;
    fieldName?: string;
    interpolation?: ScoringFunctionInterpolation;
}

export interface DistanceScoringParameters {
    boostingDistance?: number;
    referencePointParameter?: string;
}

export interface DistanceScoringFunction extends BaseScoringFunction {
    type: 'distance';
    distance?: DistanceScoringParameters;
}

export interface FreshnessScoringParameters {
    boostingDuration?: string;
}

export interface FreshnessScoringFunction extends BaseScoringFunction {
    type: 'freshness';
    freshness?: FreshnessScoringParameters;
}

export interface MagnitudeScoringParameters {
    boostingRangeStart?: number;
    boostingRangeEnd?: number;
    constantBoostBeyondRange?: boolean;
}

export interface MagnitudeScoringFunction extends BaseScoringFunction {
    type: 'magnitude';
    magnitude?: MagnitudeScoringParameters;
}

export interface TagScoringParameters {
    tagsParameter?: string;
}

export interface TagScoringFunction extends BaseScoringFunction {
    type: 'tag';
    tag?: TagScoringParameters;
}

export type ScoringFunction =
    | DistanceScoringFunction
    | FreshnessScoringFunction
    | MagnitudeScoringFunction
    | TagScoringFunction
    // fallback for unknown/newer types
    | (BaseScoringFunction & Record<string, unknown>);

export interface ScoringProfile {
    name: string;
    // SDK/back-end JSON name
    textWeights?: TextWeights;
    // REST/service name (some payloads)
    text?: TextWeights;
    functions?: ScoringFunction[];
    functionAggregation?: ScoringFunctionAggregation;
}

export type SuggesterSearchMode =
    | 'analyzingInfixMatching'
    // allow newer modes without breaking compilation
    | (string & {});

export interface Suggester {
    name: string;
    searchMode?: SuggesterSearchMode;
    sourceFields: string[];
}

export interface CorsOptions {
    allowedOrigins: string[];
    maxAgeInSeconds?: number;
}

export interface SemanticSearch {
    configurations?: unknown[]; // Simplified
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
    [key: string]: unknown;
    "@search.score"?: number;
    "@search.highlights"?: unknown;
}

export interface QueryResponse {
    count?: number;
    results: SearchResult[];
}
