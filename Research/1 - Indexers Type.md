## SearchIndexer
Represents an indexer.

| Name | Type | Default value | Description |
| --- | --- | --- | --- |
| @odata.etag | string |  | The ETag of the indexer. |
| cache | [SearchIndexerCache](#searchindexercache) |  | Adds caching to an enrichment pipeline to allow for incremental modification steps without having to rebuild the index every time. |
| dataSourceName | string |  | The name of the datasource from which this indexer reads data. |
| description | string |  | The description of the indexer. |
| disabled | boolean | False | A value indicating whether the indexer is disabled. Default is false. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) |  | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your indexer definition (as well as indexer execution status) when you want full assurance that no one, not even Microsoft, can decrypt them. Once you have encrypted your indexer definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your indexer definition (and indexer execution status) will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| fieldMappings | [FieldMapping](#fieldmapping)[] |  | Defines mappings between fields in the data source and corresponding target fields in the index. |
| name | string |  | The name of the indexer. |
| outputFieldMappings | [FieldMapping](#fieldmapping)[] |  | Output field mappings are applied after enrichment and immediately before indexing. |
| parameters | [IndexingParameters](#indexingparameters) |  | Parameters for indexer execution. |
| schedule | [IndexingSchedule](#indexingschedule) |  | The schedule for this indexer. |
| skillsetName | string |  | The name of the skillset executing with this indexer. |
| targetIndexName | string |  | The name of the index to which this indexer writes data. |

## SearchIndexerCache
The type of the cache.

| Name | Type | Description |
| --- | --- | --- |
| enableReprocessing | boolean | Specifies whether incremental reprocessing is enabled. |
| id | string | A guid for the SearchIndexerCache. |
| identity | SearchIndexerDataIdentity:<br/><br/>- [SearchIndexerDataNoneIdentity](#searchindexerdatanoneidentity)<br/>- [SearchIndexerDataUserAssignedIdentity](#searchindexerdatauserassignedidentity) | The user-assigned managed identity used for connections to the enrichment cache. If the connection string indicates an identity (ResourceId) and it's not specified, the system-assigned managed identity is used. On updates to the indexer, if the identity is unspecified, the value remains unchanged. If set to "none", the value of this property is cleared. |
| storageConnectionString | string | The connection string to the storage account where the cache data will be persisted. |

## SearchResourceEncryptionKey
A customer-managed encryption key in Azure Key Vault. Keys that you create and manage can be used to encrypt or decrypt data-at-rest, such as indexes and synonym maps.

| Name | Type | Description |
| --- | --- | --- |
| accessCredentials.applicationId | string | An AAD Application ID that was granted the required access permissions to the Azure Key Vault that is to be used when encrypting your data at rest. The Application ID should not be confused with the Object ID for your AAD Application. |
| accessCredentials.applicationSecret | string | The authentication key of the specified AAD application. |
| identity | SearchIndexerDataIdentity:<br/><br/>- [SearchIndexerDataNoneIdentity](#searchindexerdatanoneidentity)<br/>- [SearchIndexerDataUserAssignedIdentity](#searchindexerdatauserassignedidentity) | An explicit managed identity to use for this encryption key. If not specified and the access credentials property is null, the system-assigned managed identity is used. On update to the resource, if the explicit identity is unspecified, it remains unchanged. If "none" is specified, the value of this property is cleared. |
| keyVaultKeyName | string | The name of your Azure Key Vault key to be used to encrypt your data at rest. |
| keyVaultKeyVersion | string | The version of your Azure Key Vault key to be used to encrypt your data at rest. |
| keyVaultUri | string | The URI of your Azure Key Vault, also referred to as DNS name, that contains the key to be used to encrypt your data at rest. An example URI might be https://my-keyvault-name.vault.azure.net. |

## FieldMapping
Defines a mapping between a field in a data source and a target field in an index.

| Name | Type | Description |
| --- | --- | --- |
| mappingFunction | [FieldMappingFunction](#fieldmappingfunction) | A function to apply to each source field value before indexing. |
| sourceFieldName | string | The name of the field in the data source. |
| targetFieldName | string | The name of the target field in the index. Same as the source field name by default. |

## IndexingParameters
Represents parameters for indexer execution.

| Name | Type | Default value | Description |
| --- | --- | --- | --- |
| batchSize | integer<br/>(int32) |  | The number of items that are read from the data source and indexed as a single batch in order to improve performance. The default depends on the data source type. |
| configuration | [IndexingParametersConfiguration](#indexingparametersconfiguration) |  | A dictionary of indexer-specific configuration properties. Each name is the name of a specific property. Each value must be of a primitive type. |
| maxFailedItems | integer<br/>(int32) | 0 | The maximum number of items that can fail indexing for indexer execution to still be considered successful. -1 means no limit. Default is 0. |
| maxFailedItemsPerBatch | integer<br/>(int32) | 0 | The maximum number of items in a single batch that can fail indexing for the batch to still be considered successful. -1 means no limit. Default is 0. |

## IndexingSchedule
Represents a schedule for indexer execution.

| Name | Type | Description |
| --- | --- | --- |
| interval | string<br/>(duration) | The interval of time between indexer executions. |
| startTime | string<br/>(date-time) | The time when an indexer should start running. |

## SearchIndexerDataNoneIdentity
Clears the identity property of a datasource.

| Name | Type | Description |
| --- | --- | --- |
| @odata.type | string:<br/>#Microsoft.Azure.Search.DataNoneIdentity | A URI fragment specifying the type of identity. |

## SearchIndexerDataUserAssignedIdentity
Specifies the identity for a datasource to use.

| Name | Type | Description |
| --- | --- | --- |
| @odata.type | string:<br/>#Microsoft.Azure.Search.DataUserAssignedIdentity | A URI fragment specifying the type of identity. |
| userAssignedIdentity | string | The fully qualified Azure resource Id of a user assigned managed identity typically in the form "/subscriptions/12345678-1234-1234-1234-1234567890ab/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/myId" that should have been assigned to the search service. |

## FieldMappingFunction
Represents a function that transforms a value from a data source before indexing.

| Name | Type | Description |
| --- | --- | --- |
| name | string | The name of the field mapping function. |
| parameters |  | A dictionary of parameter name/value pairs to pass to the function. Each value must be of a primitive type. |

## IndexingParametersConfiguration
A dictionary of indexer-specific configuration properties. Each name is the name of a specific property. Each value must be of a primitive type.

| Name | Type | Default value | Description |
| --- | --- | --- | --- |
| allowSkillsetToReadFileData | boolean | False | If true, will create a path //document//file_data that is an object representing the original file data downloaded from your blob data source. This allows you to pass the original file data to a custom skill for processing within the enrichment pipeline, or to the Document Extraction skill. |
| dataToExtract | [BlobIndexerDataToExtract](#blobindexerdatatoextract) | contentAndMetadata | Specifies the data to extract from Azure blob storage and tells the indexer which data to extract from image content when "imageAction" is set to a value other than "none". This applies to embedded image content in a .PDF or other application, or image files such as .jpg and .png, in Azure blobs. |
| delimitedTextDelimiter | string |  | For CSV blobs, specifies the end-of-line single-character delimiter for CSV files where each line starts a new document (for example, "\|"). |
| delimitedTextHeaders | string |  | For CSV blobs, specifies a comma-delimited list of column headers, useful for mapping source fields to destination fields in an index. |
| documentRoot | string |  | For JSON arrays, given a structured or semi-structured document, you can specify a path to the array using this property. |
| excludedFileNameExtensions | string |  | Comma-delimited list of filename extensions to ignore when processing from Azure blob storage. For example, you could exclude ".png, .mp4" to skip over those files during indexing. |
| executionEnvironment | [IndexerExecutionEnvironment](#indexerexecutionenvironment) | standard | Specifies the environment in which the indexer should execute. |
| failOnUnprocessableDocument | boolean | False | For Azure blobs, set to false if you want to continue indexing if a document fails indexing. |
| failOnUnsupportedContentType | boolean | False | For Azure blobs, set to false if you want to continue indexing when an unsupported content type is encountered, and you don't know all the content types (file extensions) in advance. |
| firstLineContainsHeaders | boolean | True | For CSV blobs, indicates that the first (non-blank) line of each blob contains headers. |
| imageAction | [BlobIndexerImageAction](#blobindexerimageaction) | none | Determines how to process embedded images and image files in Azure blob storage. Setting the "imageAction" configuration to any value other than "none" requires that a skillset also be attached to that indexer. |
| indexStorageMetadataOnlyForOversizedDocuments | boolean | False | For Azure blobs, set this property to true to still index storage metadata for blob content that is too large to process. Oversized blobs are treated as errors by default. For limits on blob size, see [https://learn.microsoft.com/azure/search/search-limits-quotas-capacity](https://learn.microsoft.com/en-us/azure/search/search-limits-quotas-capacity). |
| indexedFileNameExtensions | string |  | Comma-delimited list of filename extensions to select when processing from Azure blob storage. For example, you could focus indexing on specific application files ".docx, .pptx, .msg" to specifically include those file types. |
| markdownHeaderDepth | enum:<br/><br/>- h1<br/>- h2<br/>- h3<br/>- h4<br/>- h5<br/>- h6 | h6 | Specifies the max header depth that will be considered while grouping markdown content. Default is h6. |
| markdownParsingSubmode | enum:<br/><br/>- oneToMany<br/>- oneToOne | oneToMany | Specifies the submode that will determine whether a markdown file will be parsed into exactly one search document or multiple search documents. Default is oneToMany. |
| parsingMode | [BlobIndexerParsingMode](#blobindexerparsingmode) | default | Represents the parsing mode for indexing from an Azure blob data source. |
| pdfTextRotationAlgorithm | [BlobIndexerPDFTextRotationAlgorithm](#blobindexerpdftextrotationalgorithm) | none | Determines algorithm for text extraction from PDF files in Azure blob storage. |
| queryTimeout | string | 00:05:00 | Increases the timeout beyond the 5-minute default for Azure SQL database data sources, specified in the format "hh:mm:ss". |

## BlobIndexerDataToExtract
Specifies the data to extract from Azure blob storage and tells the indexer which data to extract from image content when "imageAction" is set to a value other than "none". This applies to embedded image content in a .PDF or other application, or image files such as .jpg and .png, in Azure blobs.

| Value | Description |
| --- | --- |
| storageMetadata | Indexes just the standard blob properties and user-specified metadata. |
| allMetadata | Extracts metadata provided by the Azure blob storage subsystem and the content-type specific metadata (for example, metadata unique to just .png files are indexed). |
| contentAndMetadata | Extracts all metadata and textual content from each blob. |

## IndexerExecutionEnvironment
Specifies the environment in which the indexer should execute.

| Value | Description |
| --- | --- |
| standard | Indicates that the search service can determine where the indexer should execute. This is the default environment when nothing is specified and is the recommended value. |
| private | Indicates that the indexer should run with the environment provisioned specifically for the search service. This should only be specified as the execution environment if the indexer needs to access resources securely over shared private link resources. |

## BlobIndexerImageAction
Determines how to process embedded images and image files in Azure blob storage. Setting the "imageAction" configuration to any value other than "none" requires that a skillset also be attached to that indexer.

| Value | Description |
| --- | --- |
| none | Ignores embedded images or image files in the data set. This is the default. |
| generateNormalizedImages | Extracts text from images (for example, the word "STOP" from a traffic stop sign), and embeds it into the content field. This action requires that "dataToExtract" is set to "contentAndMetadata". A normalized image refers to additional processing resulting in uniform image output, sized and rotated to promote consistent rendering when you include images in visual search results. This information is generated for each image when you use this option. |
| generateNormalizedImagePerPage | Extracts text from images (for example, the word "STOP" from a traffic stop sign), and embeds it into the content field, but treats PDF files differently in that each page will be rendered as an image and normalized accordingly, instead of extracting embedded images. Non-PDF file types will be treated the same as if "generateNormalizedImages" was set. |

## BlobIndexerParsingMode
Represents the parsing mode for indexing from an Azure blob data source.

| Value | Description |
| --- | --- |
| default | Set to default for normal file processing. |
| text | Set to text to improve indexing performance on plain text files in blob storage. |
| delimitedText | Set to delimitedText when blobs are plain CSV files. |
| json | Set to json to extract structured content from JSON files. |
| jsonArray | Set to jsonArray to extract individual elements of a JSON array as separate documents. |
| jsonLines | Set to jsonLines to extract individual JSON entities, separated by a new line, as separate documents. |
| markdown | Set to markdown to extract content from markdown files. |

## BlobIndexerPDFTextRotationAlgorithm
Determines algorithm for text extraction from PDF files in Azure blob storage.

| Value | Description |
| --- | --- |
| none | Leverages normal text extraction. This is the default. |
| detectAngles | May produce better and more readable text extraction from PDF files that have rotated text within them. Note that there may be a small performance speed impact when this parameter is used. This parameter only applies to PDF files, and only to PDFs with embedded text. If the rotated text appears within an embedded image in the PDF, this parameter does not apply. |
