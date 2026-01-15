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
| hybridSearch | [HybridSearch](#hybridsearch) | The query parameters to configure hybrid search behaviors. |
| minimumCoverage | number<br/>(double) | A number between 0 and 100 indicating the percentage of the index that must be covered by a search query in order for the query to be reported as a success. This parameter can be useful for ensuring search availability even for services with only one replica. The default is 100. |
| orderby | string | The comma-separated list of OData $orderby expressions by which to sort the results. Each expression can be either a field name or a call to either the geo.distance() or the search.score() functions. Each expression can be followed by asc to indicate ascending, or desc to indicate descending. The default is ascending order. Ties will be broken by the match scores of documents. If no $orderby is specified, the default sort order is descending by document match score. There can be at most 32 $orderby clauses. |
| queryLanguage | [QueryLanguage](#querylanguage) | A value that specifies the language of the search query. |
| queryRewrites | [QueryRewritesType](#queryrewritestype) | A value that specifies whether query rewrites should be generated to augment the search query. |
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
| semanticFields | string | The comma-separated list of field names used for semantic ranking. |
| semanticMaxWaitInMilliseconds | integer<br/>(int32)<br/>minimum: 700 | Allows the user to set an upper bound on the amount of time it takes for semantic enrichment to finish processing before the request fails. |
| semanticQuery | string | Allows setting a separate search query that will be solely used for semantic reranking, semantic captions and semantic answers. Is useful for scenarios where there is a need to use different queries between the base retrieval and ranking phase, and the L2 semantic phase. |
| sessionId | string | A value to be used to create a sticky session, which can help getting more consistent results. As long as the same sessionId is used, a best-effort attempt will be made to target the same replica set. Be wary that reusing the same sessionID values repeatedly can interfere with the load balancing of the requests across replicas and adversely affect the performance of the search service. The value used as sessionId cannot start with a '_' character. |
| skip | integer<br/>(int32) | The number of search results to skip. This value cannot be greater than 100,000. If you need to scan documents in sequence, but cannot use skip due to this limitation, consider using orderby on a totally-ordered key and filter with a range query instead. |
| speller | [QuerySpellerType](#queryspellertype) | A value that specifies the type of the speller to use to spell-correct individual search query terms. |
| top | integer<br/>(int32) | The number of search results to retrieve. This can be used in conjunction with $skip to implement client-side paging of search results. If results are truncated due to server-side paging, the response will include a continuation token that can be used to issue another Search request for the next page of results. |
| vectorFilterMode | [VectorFilterMode](#vectorfiltermode) | Determines whether or not filters are applied before or after the vector search is performed. Default is 'preFilter' for new indexes. |
| vectorQueries | VectorQuery[]:<br/><br/>- [VectorizableImageBinaryQuery](#vectorizableimagebinaryquery)[]<br/>- [VectorizableImageUrlQuery](#vectorizableimageurlquery)[]<br/>- [VectorizableTextQuery](#vectorizabletextquery)[]<br/>- [VectorizedQuery](#vectorizedquery)[] | The query parameters for vector and hybrid search queries. |

## QueryAnswerType
This parameter is only valid if the query type is semantic. If set, the query returns answers extracted from key passages in the highest ranked documents. The number of answers returned can be configured by appending the pipe character | followed by the count-<number of answers> option after the answers parameter value, such as extractive|count-3. Default count is 1. The confidence threshold can be configured by appending the pipe character | followed by the threshold-<confidence threshold> option after the answers parameter value, such as extractive|threshold-0.9. Default threshold is 0.7. The maximum character length of answers can be configured by appending the pipe character '|' followed by the 'count-<number of maximum character length>', such as 'extractive|maxcharlength-600'.

| Value | Description |
| --- | --- |
| none | Do not return answers for the query. |
| extractive | Extracts answer candidates from the contents of the documents returned in response to a query expressed as a question in natural language. |

## QueryCaptionType
This parameter is only valid if the query type is semantic. If set, the query returns captions extracted from key passages in the highest ranked documents. When Captions is set to extractive, highlighting is enabled by default, and can be configured by appending the pipe character | followed by the highlight-<true/false> option, such as extractive|highlight-true. Defaults to None. The maximum character length of captions can be configured by appending the pipe character '|' followed by the 'count-<number of maximum character length>', such as 'extractive|maxcharlength-600'.

| Value | Description |
| --- | --- |
| none | Do not return captions for the query. |
| extractive | Extracts captions from the matching documents that contain passages relevant to the search query. |

## QueryDebugMode
Enables a debugging tool that can be used to further explore your search results. You can enable multiple debug modes simultaneously by separating them with a | character, for example: semantic|queryRewrites.

| Value | Description |
| --- | --- |
| disabled | No query debugging information will be returned. |
| semantic | Allows the user to further explore their reranked results. |
| vector | Allows the user to further explore their hybrid and vector query results. |
| queryRewrites | Allows the user to explore the list of query rewrites generated for their search request. |
| innerHits | Allows the user to retrieve scoring information regarding vectors matched within a collection of complex types. |
| all | Turn on all debug options. |

## HybridSearch
The query parameters to configure hybrid search behaviors.

| Name | Type | Description |
| --- | --- | --- |
| countAndFacetMode | [HybridCountAndFacetMode](#hybridcountandfacetmode) | Determines whether the count and facets should include all documents that matched the search query, or only the documents that are retrieved within the 'maxTextRecallSize' window. |
| maxTextRecallSize | integer<br/>(int32) | Determines the maximum number of documents to be retrieved by the text query portion of a hybrid search request. Those documents will be combined with the documents matching the vector queries to produce a single final list of results. Choosing a larger maxTextRecallSize value will allow retrieving and paging through more documents (using the top and skip parameters), at the cost of higher resource utilization and higher latency. The value needs to be between 1 and 10,000. Default is 1000. |

## QueryLanguage
The language of the query.

| Value | Description |
| --- | --- |
| none | Query language not specified. |
| en-us | Query language value for English (United States). |
| en-gb | Query language value for English (Great Britain). |
| en-in | Query language value for English (India). |
| en-ca | Query language value for English (Canada). |
| en-au | Query language value for English (Australia). |
| fr-fr | Query language value for French (France). |
| fr-ca | Query language value for French (Canada). |
| de-de | Query language value for German (Germany). |
| es-es | Query language value for Spanish (Spain). |
| es-mx | Query language value for Spanish (Mexico). |
| zh-cn | Query language value for Chinese (China). |
| zh-tw | Query language value for Chinese (Taiwan). |
| pt-br | Query language value for Portuguese (Brazil). |
| pt-pt | Query language value for Portuguese (Portugal). |
| it-it | Query language value for Italian (Italy). |
| ja-jp | Query language value for Japanese (Japan). |
| ko-kr | Query language value for Korean (Korea). |
| ru-ru | Query language value for Russian (Russia). |
| cs-cz | Query language value for Czech (Czech Republic). |
| nl-be | Query language value for Dutch (Belgium). |
| nl-nl | Query language value for Dutch (Netherlands). |
| hu-hu | Query language value for Hungarian (Hungary). |
| pl-pl | Query language value for Polish (Poland). |
| sv-se | Query language value for Swedish (Sweden). |
| tr-tr | Query language value for Turkish (Turkey). |
| hi-in | Query language value for Hindi (India). |
| ar-sa | Query language value for Arabic (Saudi Arabia). |
| ar-eg | Query language value for Arabic (Egypt). |
| ar-ma | Query language value for Arabic (Morocco). |
| ar-kw | Query language value for Arabic (Kuwait). |
| ar-jo | Query language value for Arabic (Jordan). |
| da-dk | Query language value for Danish (Denmark). |
| no-no | Query language value for Norwegian (Norway). |
| bg-bg | Query language value for Bulgarian (Bulgaria). |
| hr-hr | Query language value for Croatian (Croatia). |
| hr-ba | Query language value for Croatian (Bosnia and Herzegovina). |
| ms-my | Query language value for Malay (Malaysia). |
| ms-bn | Query language value for Malay (Brunei Darussalam). |
| sl-sl | Query language value for Slovenian (Slovenia). |
| ta-in | Query language value for Tamil (India). |
| vi-vn | Query language value for Vietnamese (Viet Nam). |
| el-gr | Query language value for Greek (Greece). |
| ro-ro | Query language value for Romanian (Romania). |
| is-is | Query language value for Icelandic (Iceland). |
| id-id | Query language value for Indonesian (Indonesia). |
| th-th | Query language value for Thai (Thailand). |
| lt-lt | Query language value for Lithuanian (Lithuania). |
| uk-ua | Query language value for Ukrainian (Ukraine). |
| lv-lv | Query language value for Latvian (Latvia). |
| et-ee | Query language value for Estonian (Estonia). |
| ca-es | Query language value for Catalan. |
| fi-fi | Query language value for Finnish (Finland). |
| sr-ba | Query language value for Serbian (Bosnia and Herzegovina). |
| sr-me | Query language value for Serbian (Montenegro). |
| sr-rs | Query language value for Serbian (Serbia). |
| sk-sk | Query language value for Slovak (Slovakia). |
| nb-no | Query language value for Norwegian (Norway). |
| hy-am | Query language value for Armenian (Armenia). |
| bn-in | Query language value for Bengali (India). |
| eu-es | Query language value for Basque. |
| gl-es | Query language value for Galician. |
| gu-in | Query language value for Gujarati (India). |
| he-il | Query language value for Hebrew (Israel). |
| ga-ie | Query language value for Irish (Ireland). |
| kn-in | Query language value for Kannada (India). |
| ml-in | Query language value for Malayalam (India). |
| mr-in | Query language value for Marathi (India). |
| fa-ae | Query language value for Persian (U.A.E.). |
| pa-in | Query language value for Punjabi (India). |
| te-in | Query language value for Telugu (India). |
| ur-pk | Query language value for Urdu (Pakistan). |

## QueryRewritesType
This parameter is only valid if the query type is semantic. When QueryRewrites is set to generative, the query terms are sent to a generate model which will produce 10 (default) rewrites to help increase the recall of the request. The requested count can be configured by appending the pipe character | followed by the count-<number of rewrites> option, such as generative|count-3. Defaults to None.

| Value | Description |
| --- | --- |
| none | Do not generate additional query rewrites for this query. |
| generative | Generate alternative query terms to increase the recall of a search request. |

## QueryType
Specifies the syntax of the search query. The default is 'simple'. Use 'full' if your query uses the Lucene query syntax and 'semantic' if query syntax is not needed.

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
Allows the user to choose whether a semantic call should fail completely, or to return partial results.

| Value | Description |
| --- | --- |
| partial | If the semantic processing fails, partial results still return. The definition of partial results depends on what semantic step failed and what was the reason for failure. |
| fail | If there is an exception during the semantic processing step, the query will fail and return the appropriate HTTP code depending on the error. |

## QuerySpellerType
Improve search recall by spell-correcting individual search query terms.

| Value | Description |
| --- | --- |
| none | Speller not enabled. |
| lexicon | Speller corrects individual query terms using a static lexicon for the language specified by the queryLanguage parameter. |

## VectorFilterMode
Determines whether or not filters are applied before or after the vector search is performed.

| Value | Description |
| --- | --- |
| postFilter | The filter will be applied after the candidate set of vector results is returned. Depending on the filter selectivity, this can result in fewer results than requested by the parameter 'k'. |
| preFilter | The filter will be applied before the search query. |
| strictPostFilter | The filter will be applied after the global top-k candidate set of vector results is returned. This will result in fewer results than requested by the parameter 'k'. |

## VectorizableImageBinaryQuery
The query parameters to use for vector search when a base 64 encoded binary of an image that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| base64Image | string | The base 64 encoded binary of an image to be vectorized to perform a vector search query. |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>imageBinary | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizableImageUrlQuery
The query parameters to use for vector search when an url that represents an image value that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>imageUrl | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| url | string | The URL of an image to be vectorized to perform a vector search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizableTextQuery
The query parameters to use for vector search when a text value that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>text | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| queryRewrites | [QueryRewritesType](#queryrewritestype) | Can be configured to let a generative model rewrite the query before sending it to be vectorized. |
| text | string | The text to be vectorized to perform a vector search query. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizedQuery
The query parameters to use for vector search when a raw vector value is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>vector | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| vector | number[]<br/>(float) | The vector representation of a search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## HybridCountAndFacetMode
Determines whether the count and facets should includes all documents that matched the search query, or only the documents that are retrieved within the 'maxTextRecallSize' window. The default value is 'countAllResults'.

| Value | Description |
| --- | --- |
| countRetrievableResults | Only include documents that were matched within the 'maxTextRecallSize' retrieval window when computing 'count' and 'facets'. |
| countAllResults | Include all documents that were matched by the search query when computing 'count' and 'facets', regardless of whether or not those documents are within the 'maxTextRecallSize' retrieval window. |

## SearchScoreThreshold
The results of the vector query will filter based on the '

| Name | Type | Description |
| --- | --- | --- |
| kind | string:<br/>searchScore | Type of threshold. |
| value | number<br/>(double) | The threshold will filter based on the ' |

## VectorSimilarityThreshold
The results of the vector query will be filtered based on the vector similarity metric. Note this is the canonical definition of similarity metric, not the 'distance' version. The threshold direction (larger or smaller) will be chosen automatically according to the metric used by the field.

| Name | Type | Description |
| --- | --- | --- |
| kind | string:<br/>vectorSimilarity | Type of threshold. |
| value | number<br/>(double) | The threshold will filter based on the similarity metric value. Note this is the canonical definition of similarity metric, not the 'distance' version. The threshold direction (larger or smaller) will be chosen automatically according to the metric used by the field. |

## SearchDocumentsResult (Documents Search Response Body)
Response containing search results from an index.

| Name | Type | Description |
| --- | --- | --- |
| @odata.count | integer<br/>(int64) | The total count of results found by the search operation, or null if the count was not requested. If present, the count may be greater than the number of results in this response. This can happen if you use the $top or $skip parameters, or if the query can't return all the requested documents in a single response. |
| @odata.nextLink | string | Continuation URL returned when the query can't return all the requested results in a single response. You can use this URL to formulate another GET or POST Search request to get the next part of the search response. Make sure to use the same verb (GET or POST) as the request that produced this response. |
| @search.answers | [QueryAnswerResult](#queryanswerresult)[] | The answers query results for the search operation; null if the answers query parameter was not specified or set to 'none'. |
| @search.coverage | number<br/>(double) | A value indicating the percentage of the index that was included in the query, or null if minimumCoverage was not specified in the request. |
| @search.debug | [DebugInfo](#debuginfo) | Debug information that applies to the search results as a whole. |
| @search.facets | object | The facet query results for the search operation, organized as a collection of buckets for each faceted field; null if the query did not include any facet expressions. |
| @search.nextPageParameters | [SearchRequest](#searchrequest) | Continuation JSON payload returned when the query can't return all the requested results in a single response. You can use this JSON along with |
| @search.semanticPartialResponseReason | [SemanticErrorReason](#semanticerrorreason) | Reason that a partial response was returned for a semantic ranking request. |
| @search.semanticPartialResponseType | [SemanticSearchResultsType](#semanticsearchresultstype) | Type of partial response that was returned for a semantic ranking request. |
| @search.semanticQueryRewritesResultType | [SemanticQueryRewritesResultType](#semanticqueryrewritesresulttype) | Type of query rewrite that was used to retrieve documents. |
| value | [SearchResult](#searchresult)[] | The sequence of results returned by the query. |

## QueryAnswerResult
An answer is a text passage extracted from the contents of the most relevant documents that matched the query. Answers are extracted from the top search results. Answer candidates are scored and the top answers are selected.

| Name | Type | Description |
| --- | --- | --- |
| highlights | string | Same text passage as in the Text property with highlighted text phrases most relevant to the query. |
| key | string | The key of the document the answer was extracted from. |
| score | number<br/>(double) | The score value represents how relevant the answer is to the query relative to other answers returned for the query. |
| text | string | The text passage extracted from the document contents as the answer. |

## DebugInfo
Contains debugging information that can be used to further explore your search results.

| Name | Type | Description |
| --- | --- | --- |
| queryRewrites | [QueryRewritesDebugInfo](#queryrewritesdebuginfo) | Contains debugging information specific to query rewrites. |

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
| hybridSearch | [HybridSearch](#hybridsearch) | The query parameters to configure hybrid search behaviors. |
| minimumCoverage | number<br/>(double) | A number between 0 and 100 indicating the percentage of the index that must be covered by a search query in order for the query to be reported as a success. This parameter can be useful for ensuring search availability even for services with only one replica. The default is 100. |
| orderby | string | The comma-separated list of OData $orderby expressions by which to sort the results. Each expression can be either a field name or a call to either the geo.distance() or the search.score() functions. Each expression can be followed by asc to indicate ascending, or desc to indicate descending. The default is ascending order. Ties will be broken by the match scores of documents. If no $orderby is specified, the default sort order is descending by document match score. There can be at most 32 $orderby clauses. |
| queryLanguage | [QueryLanguage](#querylanguage) | A value that specifies the language of the search query. |
| queryRewrites | [QueryRewritesType](#queryrewritestype) | A value that specifies whether query rewrites should be generated to augment the search query. |
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
| semanticFields | string | The comma-separated list of field names used for semantic ranking. |
| semanticMaxWaitInMilliseconds | integer<br/>(int32)<br/>minimum: 700 | Allows the user to set an upper bound on the amount of time it takes for semantic enrichment to finish processing before the request fails. |
| semanticQuery | string | Allows setting a separate search query that will be solely used for semantic reranking, semantic captions and semantic answers. Is useful for scenarios where there is a need to use different queries between the base retrieval and ranking phase, and the L2 semantic phase. |
| sessionId | string | A value to be used to create a sticky session, which can help getting more consistent results. As long as the same sessionId is used, a best-effort attempt will be made to target the same replica set. Be wary that reusing the same sessionID values repeatedly can interfere with the load balancing of the requests across replicas and adversely affect the performance of the search service. The value used as sessionId cannot start with a '_' character. |
| skip | integer<br/>(int32) | The number of search results to skip. This value cannot be greater than 100,000. If you need to scan documents in sequence, but cannot use skip due to this limitation, consider using orderby on a totally-ordered key and filter with a range query instead. |
| speller | [QuerySpellerType](#queryspellertype) | A value that specifies the type of the speller to use to spell-correct individual search query terms. |
| top | integer<br/>(int32) | The number of search results to retrieve. This can be used in conjunction with $skip to implement client-side paging of search results. If results are truncated due to server-side paging, the response will include a continuation token that can be used to issue another Search request for the next page of results. |
| vectorFilterMode | [VectorFilterMode](#vectorfiltermode) | Determines whether or not filters are applied before or after the vector search is performed. Default is 'preFilter' for new indexes. |
| vectorQueries | VectorQuery[]:<br/><br/>- [VectorizableImageBinaryQuery](#vectorizableimagebinaryquery)[]<br/>- [VectorizableImageUrlQuery](#vectorizableimageurlquery)[]<br/>- [VectorizableTextQuery](#vectorizabletextquery)[]<br/>- [VectorizedQuery](#vectorizedquery)[] | The query parameters for vector and hybrid search queries. |

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

## SemanticQueryRewritesResultType
Type of query rewrite that was used for this request.

| Value | Description |
| --- | --- |
| originalQueryOnly | Query rewrites were not successfully generated for this request. Only the original query was used to retrieve the results. |

## SearchResult
Contains a document found by a search query, plus associated metadata.

| Name | Type | Description |
| --- | --- | --- |
| @search.captions | [QueryCaptionResult](#querycaptionresult)[] | Captions are the most representative passages from the document relatively to the search query. They are often used as document summary. Captions are only returned for queries of type 'semantic'. |
| @search.documentDebugInfo | [DocumentDebugInfo](#documentdebuginfo) | Contains debugging information that can be used to further explore your search results. |
| @search.highlights | object | Text fragments from the document that indicate the matching search terms, organized by each applicable field; null if hit highlighting was not enabled for the query. |
| @search.rerankerBoostedScore | number<br/>(double) | The relevance score computed by boosting the Reranker Score. Search results are sorted by the RerankerScore/RerankerBoostedScore based on useScoringProfileBoostedRanking in the Semantic Config. RerankerBoostedScore is only returned for queries of type 'semantic'. |
| @search.rerankerScore | number<br/>(double) | The relevance score computed by the semantic ranker for the top search results. Search results are sorted by the RerankerScore first and then by the Score. RerankerScore is only returned for queries of type 'semantic'. |
| @search.score | number<br/>(double) | The relevance score of the document compared to other documents returned by the query. |

## QueryRewritesDebugInfo
Contains debugging information specific to query rewrites.

| Name | Type | Description |
| --- | --- | --- |
| text | [QueryRewritesValuesDebugInfo](#queryrewritesvaluesdebuginfo) | List of query rewrites generated for the text query. |
| vectors | [QueryRewritesValuesDebugInfo](#queryrewritesvaluesdebuginfo)[] | List of query rewrites generated for the vectorizable text queries. |

## QueryAnswerType
This parameter is only valid if the query type is semantic. If set, the query returns answers extracted from key passages in the highest ranked documents. The number of answers returned can be configured by appending the pipe character | followed by the count-<number of answers> option after the answers parameter value, such as extractive|count-3. Default count is 1. The confidence threshold can be configured by appending the pipe character | followed by the threshold-<confidence threshold> option after the answers parameter value, such as extractive|threshold-0.9. Default threshold is 0.7. The maximum character length of answers can be configured by appending the pipe character '|' followed by the 'count-<number of maximum character length>', such as 'extractive|maxcharlength-600'.

| Value | Description |
| --- | --- |
| none | Do not return answers for the query. |
| extractive | Extracts answer candidates from the contents of the documents returned in response to a query expressed as a question in natural language. |

## QueryCaptionType
This parameter is only valid if the query type is semantic. If set, the query returns captions extracted from key passages in the highest ranked documents. When Captions is set to extractive, highlighting is enabled by default, and can be configured by appending the pipe character | followed by the highlight-<true/false> option, such as extractive|highlight-true. Defaults to None. The maximum character length of captions can be configured by appending the pipe character '|' followed by the 'count-<number of maximum character length>', such as 'extractive|maxcharlength-600'.

| Value | Description |
| --- | --- |
| none | Do not return captions for the query. |
| extractive | Extracts captions from the matching documents that contain passages relevant to the search query. |

## QueryDebugMode
Enables a debugging tool that can be used to further explore your search results. You can enable multiple debug modes simultaneously by separating them with a | character, for example: semantic|queryRewrites.

| Value | Description |
| --- | --- |
| disabled | No query debugging information will be returned. |
| semantic | Allows the user to further explore their reranked results. |
| vector | Allows the user to further explore their hybrid and vector query results. |
| queryRewrites | Allows the user to explore the list of query rewrites generated for their search request. |
| innerHits | Allows the user to retrieve scoring information regarding vectors matched within a collection of complex types. |
| all | Turn on all debug options. |

## HybridSearch
TThe query parameters to configure hybrid search behaviors.

| Name | Type | Description |
| --- | --- | --- |
| countAndFacetMode | [HybridCountAndFacetMode](#hybridcountandfacetmode) | Determines whether the count and facets should includes all documents that matched the search query, or only the documents that are retrieved within the 'maxTextRecallSize' window. |
| maxTextRecallSize | integer<br/>(int32) | Determines the maximum number of documents to be retrieved by the text query portion of a hybrid search request. Those documents will be combined with the documents matching the vector queries to produce a single final list of results. Choosing a larger maxTextRecallSize value will allow retrieving and paging through more documents (using the top and skip parameters), at the cost of higher resource utilization and higher latency. The value needs to be between 1 and 10,000. Default is 1000. |

## QueryLanguage
The language of the query.

| Value | Description |
| --- | --- |
| none | Query language not specified. |
| en-us | Query language value for English (United States). |
| en-gb | Query language value for English (Great Britain). |
| en-in | Query language value for English (India). |
| en-ca | Query language value for English (Canada). |
| en-au | Query language value for English (Australia). |
| fr-fr | Query language value for French (France). |
| fr-ca | Query language value for French (Canada). |
| de-de | Query language value for German (Germany). |
| es-es | Query language value for Spanish (Spain). |
| es-mx | Query language value for Spanish (Mexico). |
| zh-cn | Query language value for Chinese (China). |
| zh-tw | Query language value for Chinese (Taiwan). |
| pt-br | Query language value for Portuguese (Brazil). |
| pt-pt | Query language value for Portuguese (Portugal). |
| it-it | Query language value for Italian (Italy). |
| ja-jp | Query language value for Japanese (Japan). |
| ko-kr | Query language value for Korean (Korea). |
| ru-ru | Query language value for Russian (Russia). |
| cs-cz | Query language value for Czech (Czech Republic). |
| nl-be | Query language value for Dutch (Belgium). |
| nl-nl | Query language value for Dutch (Netherlands). |
| hu-hu | Query language value for Hungarian (Hungary). |
| pl-pl | Query language value for Polish (Poland). |
| sv-se | Query language value for Swedish (Sweden). |
| tr-tr | Query language value for Turkish (Turkey). |
| hi-in | Query language value for Hindi (India). |
| ar-sa | Query language value for Arabic (Saudi Arabia). |
| ar-eg | Query language value for Arabic (Egypt). |
| ar-ma | Query language value for Arabic (Morocco). |
| ar-kw | Query language value for Arabic (Kuwait). |
| ar-jo | Query language value for Arabic (Jordan). |
| da-dk | Query language value for Danish (Denmark). |
| no-no | Query language value for Norwegian (Norway). |
| bg-bg | Query language value for Bulgarian (Bulgaria). |
| hr-hr | Query language value for Croatian (Croatia). |
| hr-ba | Query language value for Croatian (Bosnia and Herzegovina). |
| ms-my | Query language value for Malay (Malaysia). |
| ms-bn | Query language value for Malay (Brunei Darussalam). |
| sl-sl | Query language value for Slovenian (Slovenia). |
| ta-in | Query language value for Tamil (India). |
| vi-vn | Query language value for Vietnamese (Viet Nam). |
| el-gr | Query language value for Greek (Greece). |
| ro-ro | Query language value for Romanian (Romania). |
| is-is | Query language value for Icelandic (Iceland). |
| id-id | Query language value for Indonesian (Indonesia). |
| th-th | Query language value for Thai (Thailand). |
| lt-lt | Query language value for Lithuanian (Lithuania). |
| uk-ua | Query language value for Ukrainian (Ukraine). |
| lv-lv | Query language value for Latvian (Latvia). |
| et-ee | Query language value for Estonian (Estonia). |
| ca-es | Query language value for Catalan. |
| fi-fi | Query language value for Finnish (Finland). |
| sr-ba | Query language value for Serbian (Bosnia and Herzegovina). |
| sr-me | Query language value for Serbian (Montenegro). |
| sr-rs | Query language value for Serbian (Serbia). |
| sk-sk | Query language value for Slovak (Slovakia). |
| nb-no | Query language value for Norwegian (Norway). |
| hy-am | Query language value for Armenian (Armenia). |
| bn-in | Query language value for Bengali (India). |
| eu-es | Query language value for Basque. |
| gl-es | Query language value for Galician. |
| gu-in | Query language value for Gujarati (India). |
| he-il | Query language value for Hebrew (Israel). |
| ga-ie | Query language value for Irish (Ireland). |
| kn-in | Query language value for Kannada (India). |
| ml-in | Query language value for Malayalam (India). |
| mr-in | Query language value for Marathi (India). |
| fa-ae | Query language value for Persian (U.A.E.). |
| pa-in | Query language value for Punjabi (India). |
| te-in | Query language value for Telugu (India). |
| ur-pk | Query language value for Urdu (Pakistan). |

## QueryRewritesType
This parameter is only valid if the query type is semantic. When QueryRewrites is set to generative, the query terms are sent to a generate model which will produce 10 (default) rewrites to help increase the recall of the request. The requested count can be configured by appending the pipe character | followed by the count-<number of rewrites> option, such as generative|count-3. Defaults to None.

| Value | Description |
| --- | --- |
| none | Do not generate additional query rewrites for this query. |
| generative | Generate alternative query terms to increase the recall of a search request. |

## QueryType
Specifies the syntax of the search query. The default is 'simple'. Use 'full' if your query uses the Lucene query syntax and 'semantic' if query syntax is not needed.

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
Allows the user to choose whether a semantic call should fail completely, or to return partial results.

| Value | Description |
| --- | --- |
| partial | If the semantic processing fails, partial results still return. The definition of partial results depends on what semantic step failed and what was the reason for failure. |
| fail | If there is an exception during the semantic processing step, the query will fail and return the appropriate HTTP code depending on the error. |

## QuerySpellerType
Improve search recall by spell-correcting individual search query terms.

| Value | Description |
| --- | --- |
| none | Speller not enabled. |
| lexicon | Speller corrects individual query terms using a static lexicon for the language specified by the queryLanguage parameter. |

## VectorFilterMode
Determines whether or not filters are applied before or after the vector search is performed.

| Value | Description |
| --- | --- |
| postFilter | The filter will be applied after the candidate set of vector results is returned. Depending on the filter selectivity, this can result in fewer results than requested by the parameter 'k'. |
| preFilter | The filter will be applied before the search query. |
| strictPostFilter | The filter will be applied after the global top-k candidate set of vector results is returned. This will result in fewer results than requested by the parameter 'k'. |

## VectorizableImageBinaryQuery
The query parameters to use for vector search when a base 64 encoded binary of an image that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| base64Image | string | The base 64 encoded binary of an image to be vectorized to perform a vector search query. |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>imageBinary | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizableImageUrlQuery
The query parameters to use for vector search when an url that represents an image value that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>imageUrl | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| url | string | The URL of an image to be vectorized to perform a vector search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizableTextQuery
The query parameters to use for vector search when a text value that needs to be vectorized is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>text | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| queryRewrites | [QueryRewritesType](#queryrewritestype) | Can be configured to let a generative model rewrite the query before sending it to be vectorized. |
| text | string | The text to be vectorized to perform a vector search query. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## VectorizedQuery
The query parameters to use for vector search when a raw vector value is provided.

| Name | Type | Description |
| --- | --- | --- |
| exhaustive | boolean | When true, triggers an exhaustive k-nearest neighbor search across all vectors within the vector index. Useful for scenarios where exact matches are critical, such as determining ground truth values. |
| fields | string | Vector Fields of type Collection(Edm.Single) to be included in the vector searched. |
| filterOverride | string | The OData filter expression to apply to this specific vector query. If no filter expression is defined at the vector level, the expression defined in the top level filter parameter is used instead. |
| k | integer<br/>(int32) | Number of nearest neighbors to return as top hits. |
| kind | string:<br/>vector | Type of query. |
| oversampling | number<br/>(double) | Oversampling factor. Minimum value is 1. It overrides the 'defaultOversampling' parameter configured in the index definition. It can be set only when 'rerankWithOriginalVectors' is true. This parameter is only permitted when a compression method is used on the underlying vector field. |
| perDocumentVectorLimit | integer<br/>(int32) | Controls how many vectors can be matched from each document in a vector search query. Setting it to 1 ensures at most one vector per document is matched, guaranteeing results come from distinct documents. Setting it to 0 (unlimited) allows multiple relevant vectors from the same document to be matched. Default is 0. |
| threshold | VectorThreshold:<br/><br/>- [SearchScoreThreshold](#searchscorethreshold)<br/>- [VectorSimilarityThreshold](#vectorsimilaritythreshold) | The threshold used for vector queries. Note this can only be set if all 'fields' use the same similarity metric. |
| vector | number[]<br/>(float) | The vector representation of a search query. |
| weight | number<br/>(float) | Relative weight of the vector query when compared to other vector query and/or the text query within the same search request. This value is used when combining the results of multiple ranking lists produced by the different vector queries and/or the results retrieved through the text query. The higher the weight, the higher the documents that matched that query will be in the final ranking. Default is 1.0 and the value needs to be a positive number larger than zero. |

## QueryCaptionResult
Captions are the most representative passages from the document relatively to the search query. They are often used as document summary. Captions are only returned for queries of type semantic.

| Name | Type | Description |
| --- | --- | --- |
| highlights | string | Same text passage as in the Text property with highlighted phrases most relevant to the query. |
| text | string | A representative text passage extracted from the document most relevant to the search query. |

## DocumentDebugInfo
Contains debugging information that can be used to further explore your search results.

| Name | Type | Description |
| --- | --- | --- |
| innerHits | object | Contains debugging information specific to vectors matched within a collection of complex types. |
| semantic | [SemanticDebugInfo](#semanticdebuginfo) | Contains debugging information specific to semantic ranking requests. |
| vectors | [VectorsDebugInfo](#vectorsdebuginfo) | Contains debugging information specific to vector and hybrid search. |

## QueryRewritesValuesDebugInfo
Contains debugging information specific to query rewrites.

| Name | Type | Description |
| --- | --- | --- |
| inputQuery | string | The input text to the generative query rewriting model. There may be cases where the user query and the input to the generative model are not identical. |
| rewrites | string[] | List of query rewrites. |

## HybridCountAndFacetMode
Determines whether the count and facets should includes all documents that matched the search query, or only the documents that are retrieved within the 'maxTextRecallSize' window. The default value is 'countAllResults'.

| Value | Description |
| --- | --- |
| countRetrievableResults | Only include documents that were matched within the 'maxTextRecallSize' retrieval window when computing 'count' and 'facets'. |
| countAllResults | Include all documents that were matched by the search query when computing 'count' and 'facets', regardless of whether or not those documents are within the 'maxTextRecallSize' retrieval window. |

## SearchScoreThreshold
The results of the vector query will filter based on the '

| Name | Type | Description |
| --- | --- | --- |
| kind | string:<br/>searchScore | Type of threshold. |
| value | number<br/>(double) | The threshold will filter based on the ' |

## VectorSimilarityThreshold
The results of the vector query will be filtered based on the vector similarity metric. Note this is the canonical definition of similarity metric, not the 'distance' version. The threshold direction (larger or smaller) will be chosen automatically according to the metric used by the field.

| Name | Type | Description |
| --- | --- | --- |
| kind | string:<br/>vectorSimilarity | Type of threshold. |
| value | number<br/>(double) | The threshold will filter based on the similarity metric value. Note this is the canonical definition of similarity metric, not the 'distance' version. The threshold direction (larger or smaller) will be chosen automatically according to the metric used by the field. |

## SemanticDebugInfo
Contains debugging information specific to semantic ranking requests.

| Name | Type | Description |
| --- | --- | --- |
| contentFields | [QueryResultDocumentSemanticField](#queryresultdocumentsemanticfield)[] | The content fields that were sent to the semantic enrichment process, as well as how they were used |
| keywordFields | [QueryResultDocumentSemanticField](#queryresultdocumentsemanticfield)[] | The keyword fields that were sent to the semantic enrichment process, as well as how they were used |
| rerankerInput | [QueryResultDocumentRerankerInput](#queryresultdocumentrerankerinput) | The raw concatenated strings that were sent to the semantic enrichment process. |
| titleField | [QueryResultDocumentSemanticField](#queryresultdocumentsemanticfield) | The title field that was sent to the semantic enrichment process, as well as how it was used |

## VectorsDebugInfo
"Contains debugging information specific to vector and hybrid search.")

| Name | Type | Description |
| --- | --- | --- |
| subscores | [QueryResultDocumentSubscores](#queryresultdocumentsubscores) | The breakdown of subscores of the document prior to the chosen result set fusion/combination method such as RRF. |

## QueryResultDocumentSemanticField
Description of fields that were sent to the semantic enrichment process, as well as how they were used

| Name | Type | Description |
| --- | --- | --- |
| name | string | The name of the field that was sent to the semantic enrichment process |
| state | [SemanticFieldState](#semanticfieldstate) | The way the field was used for the semantic enrichment process (fully used, partially used, or unused) |

## QueryResultDocumentRerankerInput
The raw concatenated strings that were sent to the semantic enrichment process.

| Name | Type | Description |
| --- | --- | --- |
| content | string | The raw concatenated strings for the content fields that were used for semantic enrichment. |
| keywords | string | The raw concatenated strings for the keyword fields that were used for semantic enrichment. |
| title | string | The raw string for the title field that was used for semantic enrichment. |

## QueryResultDocumentSubscores
The breakdown of subscores between the text and vector query components of the search query for this document. Each vector query is shown as a separate object in the same order they were received.

| Name | Type | Description |
| --- | --- | --- |
| documentBoost | number<br/>(double) | The BM25 or Classic score for the text portion of the query. |
| text | [TextResult](#textresult) | The BM25 or Classic score for the text portion of the query. |
| vectors | <string,<br/>[SingleVectorFieldResult](#singlevectorfieldresult)> | The vector similarity and @search.score values for each vector query. |

## SemanticFieldState
The way the field was used for the semantic enrichment process.

| Value | Description |
| --- | --- |
| used | The field was fully used for semantic enrichment. |
| unused | The field was not used for semantic enrichment. |
| partial | The field was partially used for semantic enrichment. |

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
