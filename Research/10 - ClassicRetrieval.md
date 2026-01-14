## Documents Search Request Body

| Name | Type | Description |
| --- | --- | --- |
| answers | [QueryAnswerType](#queryanswertype) | A value that specifies whether answers should be returned as part of the search response. |
| captions | [QueryCaptionType](#querycaptiontype) | A value that specifies whether captions should be returned as part of the search response. |
| count | boolean | A value that specifies whether to fetch the total count of results. Default is false. Setting this value to true may have a performance impact. Note that the count returned is an approximation. |
| debug | [QueryDebugMode](#querydebugmode) | Enables a debugging tool that can be used to further explore your reranked results. |
| facets | string[] | The list of facet expressions to apply to the search query. Each facet expression contains a field name, optionally followed by a comma-separated list of name:value pairs. |
| filter | string | The OData $filter expression to apply to the search query. |
| highlight | string | The comma-separated list of field names to use for hit highlights. Only searchable fields can be used for hit highlighting. |
| highlightPostTag | string | A string tag that is appended to hit highlights. Must be set with highlightPreTag. Default is </em>. |
| highlightPreTag | string | A string tag that is prepended to hit highlights. Must be set with highlightPostTag. Default is <em>. |
| minimumCoverage | number<br/>(double) | A number between 0 and 100 indicating the percentage of the index that must be covered by a search query in order for the query to be reported as a success. This parameter can be useful for ensuring search availability even for services with only one replica. The default is 100. |
| orderby | string | The comma-separated list of OData $orderby expressions by which to sort the results. Each expression can be either a field name or a call to either the geo.distance() or the search.score() functions. Each expression can be followed by asc to indicate ascending, or desc to indicate descending. The default is ascending order. Ties will be broken by the match scores of documents. If no $orderby is specified, the default sort order is descending by document match score. There can be at most 32 $orderby clauses. |
| queryType | [QueryType](#querytype) | A value that specifies the syntax of the search query. The default is 'simple'. Use 'full' if your query uses the Lucene query syntax. |
| scoringParameters | string[] | The list of parameter values to be used in scoring functions (for example, referencePointParameter) using the format name-values. For example, if the scoring profile defines a function with a parameter called 'mylocation' the parameter string would be "mylocation--122.2,44.8" (without the quotes). |
| scoringProfile | string | The name of a scoring profile to evaluate match scores for matching documents in order to sort the results. |
| scoringStatistics | [ScoringStatistics](#scoringstatistics) | A value that specifies whether we want to calculate scoring statistics (such as document frequency) globally for more consistent scoring, or locally, for lower latency. The default is 'local'. Use 'global' to aggregate scoring statistics globally before scoring. Using global scoring statistics can increase latency of search queries. |
| search | string | A full-text search query expression; Use "*" or omit this parameter to match all documents. |
| searchFields | string | The comma-separated list of field names to which to scope the full-text search. When using fielded search (fieldName:searchExpression) in a full Lucene query, the field names of each fielded search expression take precedence over any field names listed in this parameter. |
| searchMode | [SearchMode](#searchmode) | A value that specifies whether any or all of the search terms must be matched in order to count the document as a match. |
| select | string | The comma-separated list of fields to retrieve. If unspecified, all fields marked as retrievable in the schema are included. |
| semanticConfiguration | string | The name of a semantic configuration that will be used when processing documents for queries of type semantic. |
| semanticErrorHandling | [SemanticErrorMode](#semanticerrormode) | Allows the user to choose whether a semantic call should fail completely (default / current behavior), or to return partial results. |
| semanticMaxWaitInMilliseconds | integer<br/>(int32)<br/>minimum: 700 | Allows the user to set an upper bound on the amount of time it takes for semantic enrichment to finish processing before the request fails. |
| semanticQuery | string | Allows setting a separate search query that will be solely used for semantic reranking, semantic captions and semantic answers. Is useful for scenarios where there is a need to use different queries between the base retrieval and ranking phase, and the L2 semantic phase. |
| sessionId | string | A value to be used to create a sticky session, which can help getting more consistent results. As long as the same sessionId is used, a best-effort attempt will be made to target the same replica set. Be wary that reusing the same sessionID values repeatedly can interfere with the load balancing of the requests across replicas and adversely affect the performance of the search service. The value used as sessionId cannot start with a '_' character. |
| skip | integer<br/>(int32) | The number of search results to skip. This value cannot be greater than 100,000. If you need to scan documents in sequence, but cannot use skip due to this limitation, consider using orderby on a totally-ordered key and filter with a range query instead. |
| top | integer<br/>(int32) | The number of search results to retrieve. This can be used in conjunction with $skip to implement client-side paging of search results. If results are truncated due to server-side paging, the response will include a continuation token that can be used to issue another Search request for the next page of results. |
| vectorFilterMode | [VectorFilterMode](#vectorfiltermode) | Determines whether or not filters are applied before or after the vector search is performed. Default is 'preFilter' for new indexes. |
| vectorQueries | VectorQuery[]:<br/><br/>- [RawVectorQuery](#rawvectorquery)[]<br/>- [VectorizableTextQuery](#vectorizabletextquery)[] | The query parameters for vector and hybrid search queries. |

## QueryAnswerType
A value that specifies whether answers should be returned as part of the search response.

| Value | Description |
| --- | --- |
| none | Do not return answers for the query. |
| extractive | Extracts answer candidates from the contents of the documents returned in response to a query expressed as a question in natural language. |

## QueryCaptionType
A value that specifies whether captions should be returned as part of the search response.

| Value | Description |
| --- | --- |
| none | Do not return captions for the query. |
| extractive | Extracts captions from the matching documents that contain passages relevant to the search query. |

## QueryDebugMode
Enables a debugging tool that can be used to further explore your search results.

| Value | Description |
| --- | --- |
| disabled | No query debugging information will be returned. |
| vector | Allows the user to further explore their hybrid and vector query results. |

## QueryType
Specifies the syntax of the search query. The default is 'simple'. Use 'full' if your query uses the Lucene query syntax.

| Value | Description |
| --- | --- |
| simple | Uses the simple query syntax for searches. Search text is interpreted using a simple query language that allows for symbols such as +, * and "". Queries are evaluated across all searchable fields by default, unless the searchFields parameter is specified. |
| full | Uses the full Lucene query syntax for searches. Search text is interpreted using the Lucene query language which allows field-specific and weighted searches, as well as other advanced features. |
| semantic | Best suited for queries expressed in natural language as opposed to keywords. Improves precision of search results by re-ranking the top search results using a ranking model trained on the Web corpus. |

## ScoringStatistics
A value that specifies whether we want to calculate scoring statistics (such as document frequency) globally for more consistent scoring, or locally, for lower latency. The default is 'local'. Use 'global' to aggregate scoring statistics globally before scoring. Using global scoring statistics can increase latency of search queries.

| Value | Description |
| --- | --- |
| local | The scoring statistics will be calculated locally for lower latency. |
| global | The scoring statistics will be calculated globally for more consistent scoring. |

## SearchMode
Specifies whether any or all of the search terms must be matched in order to count the document as a match.

| Value | Description |
| --- | --- |
| any | Any of the search terms must be matched in order to count the document as a match. |
| all | All of the search terms must be matched in order to count the document as a match. |

## SemanticErrorMode
Allows the user to choose whether a semantic call should fail completely (default / current behavior), or to return partial results.

| Value | Description |
| --- | --- |
| partial | If the semantic processing fails, partial results still return. The definition of partial results depends on what semantic step failed and what was the reason for failure. |
| fail | If there is an exception during the semantic processing step, the query will fail and return the appropriate HTTP code depending on the error. |

## VectorFilterMode
Determines whether or not filters are applied before or after the vector search is performed.

| Value | Description |
| --- | --- |
| postFilter | The filter will be applied after the candidate set of vector results is returned. Depending on the filter selectivity, this can result in fewer results than requested by the parameter 'k'. |
| preFilter | The filter will be applied before the search query. |

## RawVectorQuery
The query parameters to use for vector search when a raw vector value is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>vector | The kind of vector query being performed. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| vector | number[]<br/>(float) | The vector representation of a search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizableTextQuery
The query parameters to use for vector search when a text value that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>text | The kind of vector query being performed. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| text | string | The text to be vectorized to perform a vector search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## SearchDocumentsResult (Documents Search Response Body)
Response containing search results from an index.

| Name | Type | Description |
| --- | --- | --- |
| @odata.count | integer<br/>(int64) | The total count of results found by the search operation, or null if the count was not requested. If present, the count may be greater than the number of results in this response. This can happen if you use the $top or $skip parameters, or if the query can't return all the requested documents in a single response. |
| @odata.nextLink | string | Continuation URL returned when the query can't return all the requested results in a single response. You can use this URL to formulate another GET or POST Search request to get the next part of the search response. Make sure to use the same verb (GET or POST) as the request that produced this response. |
| @search.answers | [AnswerResult](#answerresult)[] | The answers query results for the search operation; null if the answers query parameter was not specified or set to 'none'. |
| @search.coverage | number<br/>(double) | A value indicating the percentage of the index that was included in the query, or null if minimumCoverage was not specified in the request. |
| @search.facets | object | The facet query results for the search operation, organized as a collection of buckets for each faceted field; null if the query did not include any facet expressions. |
| @search.nextPageParameters | [SearchRequest](#searchrequest) | Continuation JSON payload returned when the query can't return all the requested results in a single response. You can use this JSON along with @odata.nextLink to formulate another POST Search request to get the next part of the search response. |
| @search.semanticPartialResponseReason | [SemanticErrorReason](#semanticerrorreason) | Reason that a partial response was returned for a semantic ranking request. |
| @search.semanticPartialResponseType | [SemanticSearchResultsType](#semanticsearchresultstype) | Type of partial response that was returned for a semantic ranking request. |
| value | [SearchResult](#searchresult)[] | The sequence of results returned by the query. |

## AnswerResult
An answer is a text passage extracted from the contents of the most relevant documents that matched the query. Answers are extracted from the top search results. Answer candidates are scored and the top answers are selected.

| Name | Type | Description |
| --- | --- | --- |
| highlights | string | Same text passage as in the Text property with highlighted text phrases most relevant to the query. |
| key | string | The key of the document the answer was extracted from. |
| score | number<br/>(double) | The score value represents how relevant the answer is to the query relative to other answers returned for the query. |
| text | string | The text passage extracted from the document contents as the answer. |

## SearchRequest
Parameters for filtering, sorting, faceting, paging, and other search query behaviors.

| Name | Type | Description |
| --- | --- | --- |
| answers | [QueryAnswerType](#queryanswertype) | A value that specifies whether answers should be returned as part of the search response. |
| captions | [QueryCaptionType](#querycaptiontype) | A value that specifies whether captions should be returned as part of the search response. |
| count | boolean | A value that specifies whether to fetch the total count of results. Default is false. Setting this value to true may have a performance impact. Note that the count returned is an approximation. |
| debug | [QueryDebugMode](#querydebugmode) | Enables a debugging tool that can be used to further explore your reranked results. |
| facets | string[] | The list of facet expressions to apply to the search query. Each facet expression contains a field name, optionally followed by a comma-separated list of name:value pairs. |
| filter | string | The OData $filter expression to apply to the search query. |
| highlight | string | The comma-separated list of field names to use for hit highlights. Only searchable fields can be used for hit highlighting. |
| highlightPostTag | string | A string tag that is appended to hit highlights. Must be set with highlightPreTag. Default is </em>. |
| highlightPreTag | string | A string tag that is prepended to hit highlights. Must be set with highlightPostTag. Default is <em>. |
| minimumCoverage | number<br/>(double) | A number between 0 and 100 indicating the percentage of the index that must be covered by a search query in order for the query to be reported as a success. This parameter can be useful for ensuring search availability even for services with only one replica. The default is 100. |
| orderby | string | The comma-separated list of OData $orderby expressions by which to sort the results. Each expression can be either a field name or a call to either the geo.distance() or the search.score() functions. Each expression can be followed by asc to indicate ascending, or desc to indicate descending. The default is ascending order. Ties will be broken by the match scores of documents. If no $orderby is specified, the default sort order is descending by document match score. There can be at most 32 $orderby clauses. |
| queryType | [QueryType](#querytype) | A value that specifies the syntax of the search query. The default is 'simple'. Use 'full' if your query uses the Lucene query syntax. |
| scoringParameters | string[] | The list of parameter values to be used in scoring functions (for example, referencePointParameter) using the format name-values. For example, if the scoring profile defines a function with a parameter called 'mylocation' the parameter string would be "mylocation--122.2,44.8" (without the quotes). |
| scoringProfile | string | The name of a scoring profile to evaluate match scores for matching documents in order to sort the results. |
| scoringStatistics | [ScoringStatistics](#scoringstatistics) | A value that specifies whether we want to calculate scoring statistics (such as document frequency) globally for more consistent scoring, or locally, for lower latency. The default is 'local'. Use 'global' to aggregate scoring statistics globally before scoring. Using global scoring statistics can increase latency of search queries. |
| search | string | A full-text search query expression; Use "*" or omit this parameter to match all documents. |
| searchFields | string | The comma-separated list of field names to which to scope the full-text search. When using fielded search (fieldName:searchExpression) in a full Lucene query, the field names of each fielded search expression take precedence over any field names listed in this parameter. |
| searchMode | [SearchMode](#searchmode) | A value that specifies whether any or all of the search terms must be matched in order to count the document as a match. |
| select | string | The comma-separated list of fields to retrieve. If unspecified, all fields marked as retrievable in the schema are included. |
| semanticConfiguration | string | The name of a semantic configuration that will be used when processing documents for queries of type semantic. |
| semanticErrorHandling | [SemanticErrorMode](#semanticerrormode) | Allows the user to choose whether a semantic call should fail completely (default / current behavior), or to return partial results. |
| semanticMaxWaitInMilliseconds | integer<br/>(int32)<br/>minimum: 700 | Allows the user to set an upper bound on the amount of time it takes for semantic enrichment to finish processing before the request fails. |
| semanticQuery | string | Allows setting a separate search query that will be solely used for semantic reranking, semantic captions and semantic answers. Is useful for scenarios where there is a need to use different queries between the base retrieval and ranking phase, and the L2 semantic phase. |
| sessionId | string | A value to be used to create a sticky session, which can help getting more consistent results. As long as the same sessionId is used, a best-effort attempt will be made to target the same replica set. Be wary that reusing the same sessionID values repeatedly can interfere with the load balancing of the requests across replicas and adversely affect the performance of the search service. The value used as sessionId cannot start with a '_' character. |
| skip | integer<br/>(int32) | The number of search results to skip. This value cannot be greater than 100,000. If you need to scan documents in sequence, but cannot use skip due to this limitation, consider using orderby on a totally-ordered key and filter with a range query instead. |
| top | integer<br/>(int32) | The number of search results to retrieve. This can be used in conjunction with $skip to implement client-side paging of search results. If results are truncated due to server-side paging, the response will include a continuation token that can be used to issue another Search request for the next page of results. |
| vectorFilterMode | [VectorFilterMode](#vectorfiltermode) | Determines whether or not filters are applied before or after the vector search is performed. Default is 'preFilter' for new indexes. |
| vectorQueries | VectorQuery[]:<br/><br/>- [RawVectorQuery](#rawvectorquery)[]<br/>- [VectorizableTextQuery](#vectorizabletextquery)[] | The query parameters for vector and hybrid search queries. |

## SemanticErrorReason
Reason that a partial response was returned for a semantic ranking request.

| Value | Description |
| --- | --- |
| maxWaitExceeded | If semanticMaxWaitInMilliseconds was set and the semantic processing duration exceeded that value. Only the base results were returned. |
| capacityOverloaded | The request was throttled. Only the base results were returned. |
| transient | At least one step of the semantic process failed. |

## SemanticSearchResultsType
Type of partial response that was returned for a semantic ranking request.

| Value | Description |
| --- | --- |
| baseResults | Results without any semantic enrichment or reranking. |
| rerankedResults | Results have been reranked with the reranker model and will include semantic captions. They will not include any answers, answers highlights or caption highlights. |

## SearchResult
Contains a document found by a search query, plus associated metadata.

| Name | Type | Description |
| --- | --- | --- |
| @search.captions | [CaptionResult](#captionresult)[] | Captions are the most representative passages from the document relatively to the search query. They are often used as document summary. Captions are only returned for queries of type 'semantic'. |
| @search.documentDebugInfo | [DocumentDebugInfo](#documentdebuginfo) | Contains debugging information that can be used to further explore your search results. |
| @search.highlights | object | Text fragments from the document that indicate the matching search terms, organized by each applicable field; null if hit highlighting was not enabled for the query. |
| @search.rerankerBoostedScore | number<br/>(double) | The relevance score computed by boosting the Reranker Score. Search results are sorted by the RerankerScore/RerankerBoostedScore based on useScoringProfileBoostedRanking in the Semantic Config. RerankerBoostedScore is only returned for queries of type 'semantic' |
| @search.rerankerScore | number<br/>(double) | The relevance score computed by the semantic ranker for the top search results. Search results are sorted by the RerankerScore first and then by the Score. RerankerScore is only returned for queries of type 'semantic'. |
| @search.score | number<br/>(double) | The relevance score of the document compared to other documents returned by the query. |

## QueryAnswerType
A value that specifies whether answers should be returned as part of the search response.

| Value | Description |
| --- | --- |
| none | Do not return answers for the query. |
| extractive | Extracts answer candidates from the contents of the documents returned in response to a query expressed as a question in natural language. |

## QueryCaptionType
A value that specifies whether captions should be returned as part of the search response.

| Value | Description |
| --- | --- |
| none | Do not return captions for the query. |
| extractive | Extracts captions from the matching documents that contain passages relevant to the search query. |

## QueryDebugMode
Enables a debugging tool that can be used to further explore your search results.

| Value | Description |
| --- | --- |
| disabled | No query debugging information will be returned. |
| vector | Allows the user to further explore their hybrid and vector query results. |

## QueryType
Specifies the syntax of the search query. The default is 'simple'. Use 'full' if your query uses the Lucene query syntax.

| Value | Description |
| --- | --- |
| simple | Uses the simple query syntax for searches. Search text is interpreted using a simple query language that allows for symbols such as +, * and "". Queries are evaluated across all searchable fields by default, unless the searchFields parameter is specified. |
| full | Uses the full Lucene query syntax for searches. Search text is interpreted using the Lucene query language which allows field-specific and weighted searches, as well as other advanced features. |
| semantic | Best suited for queries expressed in natural language as opposed to keywords. Improves precision of search results by re-ranking the top search results using a ranking model trained on the Web corpus. |

## ScoringStatistics
A value that specifies whether we want to calculate scoring statistics (such as document frequency) globally for more consistent scoring, or locally, for lower latency. The default is 'local'. Use 'global' to aggregate scoring statistics globally before scoring. Using global scoring statistics can increase latency of search queries.

| Value | Description |
| --- | --- |
| local | The scoring statistics will be calculated locally for lower latency. |
| global | The scoring statistics will be calculated globally for more consistent scoring. |

## SearchMode
Specifies whether any or all of the search terms must be matched in order to count the document as a match.

| Value | Description |
| --- | --- |
| any | Any of the search terms must be matched in order to count the document as a match. |
| all | All of the search terms must be matched in order to count the document as a match. |

## SemanticErrorMode
Allows the user to choose whether a semantic call should fail completely (default / current behavior), or to return partial results.

| Value | Description |
| --- | --- |
| partial | If the semantic processing fails, partial results still return. The definition of partial results depends on what semantic step failed and what was the reason for failure. |
| fail | If there is an exception during the semantic processing step, the query will fail and return the appropriate HTTP code depending on the error. |

## VectorFilterMode
Determines whether or not filters are applied before or after the vector search is performed.

| Value | Description |
| --- | --- |
| postFilter | The filter will be applied after the candidate set of vector results is returned. Depending on the filter selectivity, this can result in fewer results than requested by the parameter 'k'. |
| preFilter | The filter will be applied before the search query. |

## RawVectorQuery
The query parameters to use for vector search when a raw vector value is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>vector | The kind of vector query being performed. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| vector | number[]<br/>(float) | The vector representation of a search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizableTextQuery
The query parameters to use for vector search when a text value that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>text | The kind of vector query being performed. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| text | string | The text to be vectorized to perform a vector search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## CaptionResult
Captions are the most representative passages from the document relatively to the search query. They are often used as document summary. Captions are only returned for queries of type semantic.

| Name | Type | Description |
| --- | --- | --- |
| highlights | string | Same text passage as in the Text property with highlighted phrases most relevant to the query. |
| text | string | A representative text passage extracted from the document most relevant to the search query. |

## DocumentDebugInfo
Contains debugging information that can be used to further explore your search results.

| Name | Type | Description |
| --- | --- | --- |
| vectors | [VectorsDebugInfo](#vectorsdebuginfo) | Contains debugging information specific to vector and hybrid search. |

## VectorsDebugInfo

| Name | Type | Description |
| --- | --- | --- |
| subscores | [QueryResultDocumentSubscores](#queryresultdocumentsubscores) | The breakdown of subscores of the document prior to the chosen result set fusion/combination method such as RRF. |

## QueryResultDocumentSubscores
The breakdown of subscores between the text and vector query components of the search query for this document. Each vector query is shown as a separate object in the same order they were received.

| Name | Type | Description |
| --- | --- | --- |
| documentBoost | number<br/>(double) | The BM25 or Classic score for the text portion of the query. |
| text | [TextResult](#textresult) | The BM25 or Classic score for the text portion of the query. |
| vectors | <string,<br/>[SingleVectorFieldResult](#singlevectorfieldresult)> | The vector similarity and @search.score values for each vector query. |

## TextResult
The BM25 or Classic score for the text portion of the query.

| Name | Type | Description |
| --- | --- | --- |
| searchScore | number<br/>(double) | The BM25 or Classic score for the text portion of the query. |

## SingleVectorFieldResult
A single vector field result. Both @search.score and vector similarity values are returned. Vector similarity is related to @search.score by an equation.

| Name | Type | Description |
| --- | --- | --- |
| searchScore | number<br/>(double) | The @search.score value that is calculated from the vector similarity score. This is the score that's visible in a pure single-field single-vector query. |
| vectorSimilarity | number<br/>(double) | The vector similarity score for this document. Note this is the canonical definition of similarity metric, not the 'distance' version. For example, cosine similarity instead of cosine distance. |
