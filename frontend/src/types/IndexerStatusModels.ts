export type IndexerStatus = 'unknown' | 'error' | 'running' | (string & {});
export type IndexingMode = 'indexingAllDocs' | 'indexingResetDocs' | 'indexingResync' | (string & {});
export type IndexerExecutionStatus = 'success' | 'inProgress' | 'transientFailure' | 'persistentFailure' | 'reset' | (string & {});
export type IndexerExecutionStatusDetail = string & {};

export interface SearchIndexerStatus {
  name: string;
  status?: IndexerStatus;
  currentState?: IndexerCurrentState;
  lastResult?: IndexerExecutionResult;
  executionHistory?: IndexerExecutionResult[];
  limits?: SearchIndexerLimits;
  runtime?: IndexerRuntime;
  [key: string]: unknown;
}

export interface IndexerCurrentState {
  mode?: IndexingMode;
  allDocsInitialTrackingState?: string;
  allDocsFinalTrackingState?: string;
  resetDocumentKeys?: string[];
  resetDatasourceDocumentIds?: string[];
  resetDocsInitialTrackingState?: string;
  resetDocsFinalTrackingState?: string;
  resyncInitialTrackingState?: string;
  resyncFinalTrackingState?: string;
  [key: string]: unknown;
}

export interface IndexerExecutionResult {
  status?: IndexerExecutionStatus;
  statusDetail?: IndexerExecutionStatusDetail;
  errorMessage?: string;

  startTime?: string; // date-time
  endTime?: string; // date-time
  itemsProcessed?: number;
  itemsFailed?: number;
  mode?: IndexingMode;

  initialTrackingState?: string;
  finalTrackingState?: string;

  errors?: SearchIndexerError[];
  warnings?: SearchIndexerWarning[];
  [key: string]: unknown;
}

export interface SearchIndexerError {
  key?: string;
  errorMessage?: string;
  statusCode?: number;
  name?: string;
  details?: string;
  documentationLink?: string;
  [key: string]: unknown;
}

export interface SearchIndexerWarning {
  key?: string;
  message?: string;
  name?: string;
  details?: string;
  documentationLink?: string;
  [key: string]: unknown;
}

export interface SearchIndexerLimits {
  maxDocumentContentCharactersToExtract?: number;
  maxDocumentExtractionSize?: number;
  maxRunTime?: string; // duration
  [key: string]: unknown;
}

export interface IndexerRuntime {
  beginningTime?: string;
  endingTime?: string;
  remainingSeconds?: number;
  usedSeconds?: number;
  [key: string]: unknown;
}
