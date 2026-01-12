## KnowledgeBaseRetrievalResponse
The output contract for the retrieval response.

| Name | Type | Description |
| --- | --- | --- |
| activity | KnowledgeBaseActivityRecord[]:<br/><br/>- [KnowledgeBaseAgenticReasoningActivityRecord](#knowledgebaseagenticreasoningactivityrecord)[]<br/>- [KnowledgeBaseModelAnswerSynthesisActivityRecord](#knowledgebasemodelanswersynthesisactivityrecord)[]<br/>- [KnowledgeBaseModelQueryPlanningActivityRecord](#knowledgebasemodelqueryplanningactivityrecord)[] | The activity records for tracking progress and billing implications. |
| references | KnowledgeBaseReference[]:<br/><br/>- [KnowledgeBaseAzureBlobReference](#knowledgebaseazureblobreference)[]<br/>- [KnowledgeBaseIndexedOneLakeReference](#knowledgebaseindexedonelakereference)[]<br/>- [KnowledgeBaseIndexedSharePointReference](#knowledgebaseindexedsharepointreference)[]<br/>- [KnowledgeBaseRemoteSharePointReference](#knowledgebaseremotesharepointreference)[]<br/>- [KnowledgeBaseSearchIndexReference](#knowledgebasesearchindexreference)[]<br/>- [KnowledgeBaseWebReference](#knowledgebasewebreference)[] | The references for the retrieval data used in the response. |
| response | [KnowledgeBaseMessage](#knowledgebasemessage)[] | The response messages. |

## KnowledgeBaseAgenticReasoningActivityRecord
Represents an agentic reasoning activity record.

| Name | Type | Description |
| --- | --- | --- |
| elapsedMs | integer<br/>(int32) | The elapsed time in milliseconds for the retrieval activity. |
| error | [KnowledgeBaseErrorDetail](#knowledgebaseerrordetail) | The error detail explaining why the operation failed. This property is only included when the activity does not succeed. |
| id | integer<br/>(int32) | The ID of the activity record. |
| reasoningTokens | integer<br/>(int32) | The number of input tokens for agentic reasoning. |
| retrievalReasoningEffort | KnowledgeRetrievalReasoningEffort:<br/><br/>- [KnowledgeRetrievalLowReasoningEffort](#knowledgeretrievallowreasoningeffort)<br/>- [KnowledgeRetrievalMediumReasoningEffort](#knowledgeretrievalmediumreasoningeffort)<br/>- [KnowledgeRetrievalMinimalReasoningEffort](#knowledgeretrievalminimalreasoningeffort) | The retrieval reasoning effort configuration. |
| type | string:<br/>agenticReasoning | The type of the activity record. |

## KnowledgeBaseModelAnswerSynthesisActivityRecord
Represents an LLM answer synthesis activity record.

| Name | Type | Description |
| --- | --- | --- |
| elapsedMs | integer<br/>(int32) | The elapsed time in milliseconds for the retrieval activity. |
| error | [KnowledgeBaseErrorDetail](#knowledgebaseerrordetail) | The error detail explaining why the operation failed. This property is only included when the activity does not succeed. |
| id | integer<br/>(int32) | The ID of the activity record. |
| inputTokens | integer<br/>(int32) | The number of input tokens for the LLM answer synthesis activity. |
| outputTokens | integer<br/>(int32) | The number of output tokens for the LLM answer synthesis activity. |
| type | string:<br/>modelAnswerSynthesis | The type of the activity record. |

## KnowledgeBaseModelQueryPlanningActivityRecord
Represents an LLM query planning activity record.

| Name | Type | Description |
| --- | --- | --- |
| elapsedMs | integer<br/>(int32) | The elapsed time in milliseconds for the retrieval activity. |
| error | [KnowledgeBaseErrorDetail](#knowledgebaseerrordetail) | The error detail explaining why the operation failed. This property is only included when the activity does not succeed. |
| id | integer<br/>(int32) | The ID of the activity record. |
| inputTokens | integer<br/>(int32) | The number of input tokens for the LLM query planning activity. |
| outputTokens | integer<br/>(int32) | The number of output tokens for the LLM query planning activity. |
| type | string:<br/>modelQueryPlanning | The type of the activity record. |

## KnowledgeBaseAzureBlobReference
Represents an Azure Blob Storage document reference.

| Name | Type | Description |
| --- | --- | --- |
| activitySource | integer<br/>(int32) | The source activity ID for the reference. |
| blobUrl | string | The blob URL for the reference. |
| id | string | The ID of the reference. |
| rerankerScore | number<br/>(float) | The reranker score for the document reference. |
| sourceData |  | The source data for the reference. |
| type | string:<br/>azureBlob | The type of the reference. |

## KnowledgeBaseIndexedOneLakeReference
Represents an indexed OneLake document reference.

| Name | Type | Description |
| --- | --- | --- |
| activitySource | integer<br/>(int32) | The source activity ID for the reference. |
| docUrl | string | The document URL for the reference. |
| id | string | The ID of the reference. |
| rerankerScore | number<br/>(float) | The reranker score for the document reference. |
| sourceData |  | The source data for the reference. |
| type | string:<br/>indexedOneLake | The type of the reference. |

## KnowledgeBaseIndexedSharePointReference
Represents an indexed SharePoint document reference.

| Name | Type | Description |
| --- | --- | --- |
| activitySource | integer<br/>(int32) | The source activity ID for the reference. |
| docUrl | string | The document URL for the reference. |
| id | string | The ID of the reference. |
| rerankerScore | number<br/>(float) | The reranker score for the document reference. |
| sourceData |  | The source data for the reference. |
| type | string:<br/>indexedSharePoint | The type of the reference. |

## KnowledgeBaseRemoteSharePointReference
Represents a remote SharePoint document reference.

| Name | Type | Description |
| --- | --- | --- |
| activitySource | integer<br/>(int32) | The source activity ID for the reference. |
| id | string | The ID of the reference. |
| rerankerScore | number<br/>(float) | The reranker score for the document reference. |
| searchSensitivityLabelInfo | [SharePointSensitivityLabelInfo](#sharepointsensitivitylabelinfo) | Information about the sensitivity label applied to the SharePoint document. |
| sourceData |  | The source data for the reference. |
| type | string:<br/>remoteSharePoint | The type of the reference. |
| webUrl | string<br/>(uri) | The url the reference data originated from. |

## KnowledgeBaseSearchIndexReference
Represents an Azure Search document reference.

| Name | Type | Description |
| --- | --- | --- |
| activitySource | integer<br/>(int32) | The source activity ID for the reference. |
| docKey | string | The document key for the reference. |
| id | string | The ID of the reference. |
| rerankerScore | number<br/>(float) | The reranker score for the document reference. |
| sourceData |  | The source data for the reference. |
| type | string:<br/>searchIndex | The type of the reference. |

## KnowledgeBaseWebReference
Represents a web document reference.

| Name | Type | Description |
| --- | --- | --- |
| activitySource | integer<br/>(int32) | The source activity ID for the reference. |
| id | string | The ID of the reference. |
| rerankerScore | number<br/>(float) | The reranker score for the document reference. |
| sourceData |  | The source data for the reference. |
| title | string | The title of the web document. |
| type | string:<br/>web | The type of the reference. |
| url | string<br/>(uri) | The url the reference data originated from. |

## KnowledgeBaseMessage
The natural language message style object.

| Name | Type | Description |
| --- | --- | --- |
| content | KnowledgeBaseMessageContent[]:<br/><br/>- [KnowledgeBaseMessageImageContent](#knowledgebasemessageimagecontent)[]<br/>- [KnowledgeBaseMessageTextContent](#knowledgebasemessagetextcontent)[] | The content of the message. |
| role | string | The role of the tool response. |

## KnowledgeBaseErrorDetail
The error details.

| Name | Type | Description |
| --- | --- | --- |
| additionalInfo | [KnowledgeBaseErrorAdditionalInfo](#knowledgebaseerroradditionalinfo)[] | The error additional info. |
| code | string | The error code. |
| details | [KnowledgeBaseErrorDetail](#knowledgebaseerrordetail)[] | The error details. |
| message | string | The error message. |
| target | string | The error target. |

## KnowledgeRetrievalLowReasoningEffort
Run knowledge retrieval with low reasoning effort.

| Name | Type | Description |
| --- | --- | --- |
| kind | string:<br/>low | The kind of reasoning effort. |

## KnowledgeRetrievalMediumReasoningEffort
Run knowledge retrieval with medium reasoning effort.

| Name | Type | Description |
| --- | --- | --- |
| kind | string:<br/>medium | The kind of reasoning effort. |

## KnowledgeRetrievalMinimalReasoningEffort
Run knowledge retrieval with minimal reasoning effort.

| Name | Type | Description |
| --- | --- | --- |
| kind | string:<br/>minimal | The kind of reasoning effort. |

## SharePointSensitivityLabelInfo
Information about the sensitivity label applied to a SharePoint document.

| Name | Type | Description |
| --- | --- | --- |
| color | string | The color that the UI should display for the label, if configured. |
| displayName | string | The display name for the sensitivity label. |
| isEncrypted | boolean | Indicates whether the sensitivity label enforces encryption. |
| priority | integer<br/>(int32) | The priority in which the sensitivity label is applied. |
| sensitivityLabelId | string | The ID of the sensitivity label. |
| tooltip | string | The tooltip that should be displayed for the label in a UI. |

## KnowledgeBaseMessageImageContent
Image message type.

| Name | Type | Description |
| --- | --- | --- |
| image | [KnowledgeBaseImageContent](#knowledgebaseimagecontent) | The image content. |
| type | string:<br/>image | The type of the message |

## KnowledgeBaseMessageTextContent
Text message type.

| Name | Type | Description |
| --- | --- | --- |
| text | string | The text content. |
| type | string:<br/>text | The type of the message |

## KnowledgeBaseErrorAdditionalInfo
The resource management error additional info.

| Name | Type | Description |
| --- | --- | --- |
| info |  | The additional info. |
| type | string | The additional info type. |

## KnowledgeBaseImageContent
Image content.

| Name | Type | Description |
| --- | --- | --- |
| url | string<br/>(uri) | The url of the image. |
