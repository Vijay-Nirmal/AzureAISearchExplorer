## SearchIndexerStatus
Represents the current status and execution history of an indexer.

| Name | Type | Description |
| --- | --- | --- |
| currentState | [IndexerCurrentState](#indexercurrentstate) | All of the state that defines and dictates the indexer's current execution. |
| executionHistory | [IndexerExecutionResult](#indexerexecutionresult)[] | History of the recent indexer executions, sorted in reverse chronological order. |
| lastResult | [IndexerExecutionResult](#indexerexecutionresult) | The result of the most recent or an in-progress indexer execution. |
| limits | [SearchIndexerLimits](#searchindexerlimits) | The execution limits for the indexer. |
| name | string | The name of the indexer. |
| runtime | [IndexerRuntime](#indexerruntime) | Snapshot of the indexer's cumulative runtime consumption for the service over the current UTC period. |
| status | [IndexerStatus](#indexerstatus) | Overall indexer status. |

## IndexerCurrentState
Represents all of the state that defines and dictates the indexer's current execution.

| Name | Type | Description |
| --- | --- | --- |
| allDocsFinalTrackingState | string | Change tracking state value when indexing finishes on all documents in the datasource. |
| allDocsInitialTrackingState | string | Change tracking state used when indexing starts on all documents in the datasource. |
| mode | [IndexingMode](#indexingmode) | The mode the indexer is running in. |
| resetDatasourceDocumentIds | string[] | The list of datasource document ids that have been reset. The datasource document id is the unique identifier for the data in the datasource. The indexer will prioritize selectively re-ingesting these ids. |
| resetDocsFinalTrackingState | string | Change tracking state value when indexing finishes on select, reset documents in the datasource. |
| resetDocsInitialTrackingState | string | Change tracking state used when indexing starts on select, reset documents in the datasource. |
| resetDocumentKeys | string[] | The list of document keys that have been reset. The document key is the document's unique identifier for the data in the search index. The indexer will prioritize selectively re-ingesting these keys. |
| resyncFinalTrackingState | string | Change tracking state value when indexing finishes on selective options from the datasource. |
| resyncInitialTrackingState | string | Change tracking state used when indexing starts on selective options from the datasource. |

## IndexerExecutionResult
Represents the result of an individual indexer execution.

| Name | Type | Description |
| --- | --- | --- |
| endTime | string<br/>(date-time) | The end time of this indexer execution, if the execution has already completed. |
| errorMessage | string | The error message indicating the top-level error, if any. |
| errors | [SearchIndexerError](#searchindexererror)[] | The item-level indexing errors. |
| finalTrackingState | string | Change tracking state with which an indexer execution finished. |
| initialTrackingState | string | Change tracking state with which an indexer execution started. |
| itemsFailed | integer<br/>(int32) | The number of items that failed to be indexed during this indexer execution. |
| itemsProcessed | integer<br/>(int32) | The number of items that were processed during this indexer execution. This includes both successfully processed items and items where indexing was attempted but failed. |
| mode | [IndexingMode](#indexingmode) | The mode the indexer is running in. |
| startTime | string<br/>(date-time) | The start time of this indexer execution. |
| status | [IndexerExecutionStatus](#indexerexecutionstatus) | The outcome of this indexer execution. |
| statusDetail | [IndexerExecutionStatusDetail](#indexerexecutionstatusdetail) | The outcome of this indexer execution. |
| warnings | [SearchIndexerWarning](#searchindexerwarning)[] | The item-level indexing warnings. |

## SearchIndexerLimits
Represents the limits that can be applied to an indexer.

| Name | Type | Description |
| --- | --- | --- |
| maxDocumentContentCharactersToExtract | integer<br/>(int64) | The maximum number of characters that will be extracted from a document picked up for indexing. |
| maxDocumentExtractionSize | integer<br/>(int64) | The maximum size of a document, in bytes, which will be considered valid for indexing. |
| maxRunTime | string<br/>(duration) | The maximum duration that the indexer is permitted to run for one execution. |

## IndexerRuntime
Represents the indexer's cumulative runtime consumption in the service.

| Name | Type | Description |
| --- | --- | --- |
| beginningTime | string<br/>(date-time) | Beginning UTC time of the 24-hour period considered for indexer runtime usage (inclusive). |
| endingTime | string<br/>(date-time) | End UTC time of the 24-hour period considered for indexer runtime usage (inclusive). |
| remainingSeconds | integer<br/>(int64) | Cumulative runtime remaining for all indexers in the service from the beginningTime to endingTime, in seconds. |
| usedSeconds | integer<br/>(int64) | Cumulative runtime of the indexer from the beginningTime to endingTime, in seconds. |

## IndexerStatus
Represents the overall indexer status.

| Value | Description |
| --- | --- |
| unknown | Indicates that the indexer is in an unknown state. |
| error | Indicates that the indexer experienced an error that cannot be corrected without human intervention. |
| running | Indicates that the indexer is running normally. |

## IndexingMode
Represents the mode the indexer is executing in.

| Value | Description |
| --- | --- |
| indexingAllDocs | The indexer is indexing all documents in the datasource. |
| indexingResetDocs | The indexer is indexing selective, reset documents in the datasource. The documents being indexed are defined on indexer status. |
| indexingResync | The indexer is resyncing and indexing selective option(s) from the datasource. |

## SearchIndexerError
Represents an item- or document-level indexing error.

| Name | Type | Description |
| --- | --- | --- |
| details | string | Additional, verbose details about the error to assist in debugging the indexer. This may not be always available. |
| documentationLink | string | A link to a troubleshooting guide for these classes of errors. This may not be always available. |
| errorMessage | string | The message describing the error that occurred while processing the item. |
| key | string | The key of the item for which indexing failed. |
| name | string | The name of the source at which the error originated. For example, this could refer to a particular skill in the attached skillset. This may not be always available. |
| statusCode | integer<br/>(int32) | The status code indicating why the indexing operation failed. Possible values include: 400 for a malformed input document, 404 for document not found, 409 for a version conflict, 422 when the index is temporarily unavailable, or 503 for when the service is too busy. |

## IndexerExecutionStatus
Represents the status of an individual indexer execution.

| Value | Description |
| --- | --- |
| transientFailure | An indexer invocation has failed, but the failure may be transient. Indexer invocations will continue per schedule. |
| success | Indexer execution completed successfully. |
| inProgress | Indexer execution is in progress. |
| reset | Indexer has been reset. |

## IndexerExecutionStatusDetail
Details the status of an individual indexer execution.

| Value | Description |
| --- | --- |
| resetDocs | Indicates that the reset that occurred was for a call to ResetDocs. |
| resync | Indicates to selectively resync based on option(s) from data source. |

## SearchIndexerWarning
Represents an item-level warning.

| Name | Type | Description |
| --- | --- | --- |
| details | string | Additional, verbose details about the warning to assist in debugging the indexer. This may not be always available. |
| documentationLink | string | A link to a troubleshooting guide for these classes of warnings. This may not be always available. |
| key | string | The key of the item which generated a warning. |
| message | string | The message describing the warning that occurred while processing the item. |
| name | string | The name of the source at which the warning originated. For example, this could refer to a particular skill in the attached skillset. This may not be always available. |
