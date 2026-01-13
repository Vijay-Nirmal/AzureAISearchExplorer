## Responses

| Name | Type | Description |
| --- | --- | --- |
| 200 OK | KnowledgeSource:<br/><br/>- [AzureBlobKnowledgeSource](#azureblobknowledgesource)<br/>- [IndexedOneLakeKnowledgeSource](#indexedonelakeknowledgesource)<br/>- [IndexedSharePointKnowledgeSource](#indexedsharepointknowledgesource)<br/>- [RemoteSharePointKnowledgeSource](#remotesharepointknowledgesource)<br/>- [SearchIndexKnowledgeSource](#searchindexknowledgesource)<br/>- [WebKnowledgeSource](#webknowledgesource) | The request has succeeded. |

## AzureBlobKnowledgeSource
Configuration for Azure Blob Storage knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the knowledge source. |
| azureBlobParameters | [AzureBlobKnowledgeSourceParameters](#azureblobknowledgesourceparameters) | The type of the knowledge source. |
| description | string | Optional user-defined description. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your knowledge source definition when you want full assurance that no one, not even Microsoft, can decrypt them. Once you have encrypted your knowledge source definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your knowledge source definition will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| kind | string:<br/>azureBlob | The type of the knowledge source. |
| name | string | The name of the knowledge source. |

## IndexedOneLakeKnowledgeSource
Configuration for OneLake knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the knowledge source. |
| description | string | Optional user-defined description. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your knowledge source definition when you want full assurance that no one, not even Microsoft, can decrypt them. Once you have encrypted your knowledge source definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your knowledge source definition will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| indexedOneLakeParameters | [IndexedOneLakeKnowledgeSourceParameters](#indexedonelakeknowledgesourceparameters) | The parameters for the knowledge source. |
| kind | string:<br/>indexedOneLake | The type of the knowledge source. |
| name | string | The name of the knowledge source. |

## IndexedSharePointKnowledgeSource
Configuration for SharePoint knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the knowledge source. |
| description | string | Optional user-defined description. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your knowledge source definition when you want full assurance that no one, not even Microsoft, can decrypt them. Once you have encrypted your knowledge source definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your knowledge source definition will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| indexedSharePointParameters | [IndexedSharePointKnowledgeSourceParameters](#indexedsharepointknowledgesourceparameters) | The parameters for the knowledge source. |
| kind | string:<br/>indexedSharePoint | The type of the knowledge source. |
| name | string | The name of the knowledge source. |

## RemoteSharePointKnowledgeSource
Configuration for remote SharePoint knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the knowledge source. |
| description | string | Optional user-defined description. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your knowledge source definition when you want full assurance that no one, not even Microsoft, can decrypt them. Once you have encrypted your knowledge source definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your knowledge source definition will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| kind | string:<br/>remoteSharePoint | The type of the knowledge source. |
| name | string | The name of the knowledge source. |
| remoteSharePointParameters | [RemoteSharePointKnowledgeSourceParameters](#remotesharepointknowledgesourceparameters) | The parameters for the remote SharePoint knowledge source. |

## SearchIndexKnowledgeSource
Knowledge Source targeting a search index.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the knowledge source. |
| description | string | Optional user-defined description. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your knowledge source definition when you want full assurance that no one, not even Microsoft, can decrypt them. Once you have encrypted your knowledge source definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your knowledge source definition will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| kind | string:<br/>searchIndex | The type of the knowledge source. |
| name | string | The name of the knowledge source. |
| searchIndexParameters | [SearchIndexKnowledgeSourceParameters](#searchindexknowledgesourceparameters) | The parameters for the knowledge source. |

## WebKnowledgeSource
Knowledge Source targeting web results.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the knowledge source. |
| description | string | Optional user-defined description. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your knowledge source definition when you want full assurance that no one, not even Microsoft, can decrypt them. Once you have encrypted your knowledge source definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your knowledge source definition will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| kind | string:<br/>web | The type of the knowledge source. |
| name | string | The name of the knowledge source. |
| webParameters | [WebKnowledgeSourceParameters](#webknowledgesourceparameters) | The parameters for the web knowledge source. |

## AzureBlobKnowledgeSourceParameters
Parameters for Azure Blob Storage knowledge source.

| Name | Type | Default value | Description |
| --- | --- | --- | --- |
| connectionString | string |  | Key-based connection string or the ResourceId format if using a managed identity. |
| containerName | string |  | The name of the blob storage container. |
| createdResources | object |  | Resources created by the knowledge source. |
| folderPath | string |  | Optional folder path within the container. |
| ingestionParameters | [KnowledgeSourceIngestionParameters](#knowledgesourceingestionparameters) |  | Consolidates all general ingestion settings. |
| isADLSGen2 | boolean | False | Set to true if connecting to an ADLS Gen2 storage account. Default is false. |

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

## IndexedOneLakeKnowledgeSourceParameters
Parameters for OneLake knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| createdResources | object | Resources created by the knowledge source. |
| fabricWorkspaceId | string | OneLake workspace ID. |
| ingestionParameters | [KnowledgeSourceIngestionParameters](#knowledgesourceingestionparameters) | Consolidates all general ingestion settings. |
| lakehouseId | string | Specifies which OneLake lakehouse to access. |
| targetPath | string | Optional OneLakehouse folder or shortcut to filter OneLake content. |

## IndexedSharePointKnowledgeSourceParameters
Parameters for SharePoint knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| connectionString | string | SharePoint connection string with format: SharePointOnlineEndpoint=[SharePoint site url];ApplicationId=[Azure AD App ID];ApplicationSecret=[Azure AD App client secret];TenantId=[SharePoint site tenant id] |
| containerName | [IndexedSharePointContainerName](#indexedsharepointcontainername) | Specifies which SharePoint libraries to access. |
| createdResources | object | Resources created by the knowledge source. |
| ingestionParameters | [KnowledgeSourceIngestionParameters](#knowledgesourceingestionparameters) | Consolidates all general ingestion settings. |
| query | string | Optional query to filter SharePoint content. |

## RemoteSharePointKnowledgeSourceParameters
Parameters for remote SharePoint knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| containerTypeId | string | Container ID for SharePoint Embedded connection. When this is null, it will use SharePoint Online. |
| filterExpression | string | Keyword Query Language (KQL) expression with queryable SharePoint properties and attributes to scope the retrieval before the query runs. |
| resourceMetadata | string[] | A list of metadata fields to be returned for each item in the response. Only retrievable metadata properties can be included in this list. By default, no metadata is returned. |

## SearchIndexKnowledgeSourceParameters
Parameters for search index knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| searchFields | [SearchIndexFieldReference](#searchindexfieldreference)[] | Used to restrict which fields to search on the search index. |
| searchIndexName | string | The name of the Search index. |
| semanticConfigurationName | string | Used to specify a different semantic configuration on the target search index other than the default one. |
| sourceDataFields | [SearchIndexFieldReference](#searchindexfieldreference)[] | Used to request additional fields for referenced source data. |

## WebKnowledgeSourceParameters
Parameters for web knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| domains | [WebKnowledgeSourceDomains](#webknowledgesourcedomains) | Domain allow/block configuration for web results. |

## KnowledgeSourceIngestionParameters
Consolidates all general ingestion settings for knowledge sources.

| Name | Type | Default value | Description |
| --- | --- | --- | --- |
| aiServices | [AIServices](#aiservices) |  | Optional AI Services configuration for content processing. |
| chatCompletionModel | KnowledgeBaseModel:<br/>[KnowledgeBaseAzureOpenAIModel](#knowledgebaseazureopenaimodel) |  | Optional chat completion model for image verbalization or context extraction. |
| contentExtractionMode | enum:<br/><br/>- minimal<br/>- standard | minimal | Optional content extraction mode. Default is 'minimal'. |
| disableImageVerbalization | boolean | False | Indicates whether image verbalization should be disabled. Default is false. |
| embeddingModel | KnowledgeSourceVectorizer:<br/>[KnowledgeSourceAzureOpenAIVectorizer](#knowledgesourceazureopenaivectorizer) |  | Optional vectorizer configuration for vectorizing content. |
| identity | SearchIndexerDataIdentity:<br/><br/>- [SearchIndexerDataNoneIdentity](#searchindexerdatanoneidentity)<br/>- [SearchIndexerDataUserAssignedIdentity](#searchindexerdatauserassignedidentity) |  | An explicit identity to use for this knowledge source. |
| ingestionPermissionOptions | [KnowledgeSourceIngestionPermissionOption](#knowledgesourceingestionpermissionoption)[] |  | Optional list of permission types to ingest together with document content. If specified, it will set the indexer permission options for the data source. |
| ingestionSchedule | [IndexingSchedule](#indexingschedule) |  | Optional schedule for data ingestion. |

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

## IndexedSharePointContainerName
Specifies which SharePoint libraries to access.

| Value | Description |
| --- | --- |
| defaultSiteLibrary | Index content from the site's default document library. |
| allSiteLibraries | Index content from every document library in the site. |
| useQuery | Use a query to filter SharePoint content. |

## SearchIndexFieldReference
Field reference for a search index.

| Name | Type | Description |
| --- | --- | --- |
| name | string | The name of the field. |

## WebKnowledgeSourceDomains
Domain allow/block configuration for web knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| allowedDomains | [WebKnowledgeSourceDomain](#webknowledgesourcedomain)[] | Domains that are allowed for web results. |
| blockedDomains | [WebKnowledgeSourceDomain](#webknowledgesourcedomain)[] | Domains that are blocked from web results. |

## AIServices
Parameters for AI Services.

| Name | Type | Description |
| --- | --- | --- |
| apiKey | string | The API key for accessing AI Services. |
| uri | string<br/>(uri) | The URI of the AI Services endpoint. |

## KnowledgeBaseAzureOpenAIModel
Specifies the Azure OpenAI resource used to do query planning.

| Name | Type | Description |
| --- | --- | --- |
| azureOpenAIParameters | [AzureOpenAIVectorizerParameters](#azureopenaivectorizerparameters) | Azure OpenAI parameters. |
| kind | string:<br/>azureOpenAI | The AI model to be used for query planning. |

## KnowledgeSourceAzureOpenAIVectorizer
Specifies the Azure OpenAI resource used to vectorize a query string.

| Name | Type | Description |
| --- | --- | --- |
| azureOpenAIParameters | [AzureOpenAIVectorizerParameters](#azureopenaivectorizerparameters) | Contains the parameters specific to Azure OpenAI embedding vectorization. |
| kind | string:<br/>azureOpenAI | The name of the kind of vectorization method being configured for use with vector search. |

## KnowledgeSourceIngestionPermissionOption
Permission types to ingest together with document content.

| Value | Description |
| --- | --- |
| userIds | Ingest explicit user identifiers alongside document content. |
| groupIds | Ingest group identifiers alongside document content. |
| rbacScope | Ingest RBAC scope information alongside document content. |

## IndexingSchedule
Represents a schedule for indexer execution.

| Name | Type | Description |
| --- | --- | --- |
| interval | string<br/>(duration) | The interval of time between indexer executions. |
| startTime | string<br/>(date-time) | The time when an indexer should start running. |

## WebKnowledgeSourceDomain
Configuration for web knowledge source domain.

| Name | Type | Description |
| --- | --- | --- |
| address | string | The address of the domain. |
| includeSubpages | boolean | Whether or not to include subpages from this domain. |

## AzureOpenAIVectorizerParameters
Specifies the parameters for connecting to the Azure OpenAI resource.

| Name | Type | Description |
| --- | --- | --- |
| apiKey | string | API key of the designated Azure OpenAI resource. |
| authIdentity | SearchIndexerDataIdentity:<br/><br/>- [SearchIndexerDataNoneIdentity](#searchindexerdatanoneidentity)<br/>- [SearchIndexerDataUserAssignedIdentity](#searchindexerdatauserassignedidentity) | The user-assigned managed identity used for outbound connections. |
| deploymentId | string | ID of the Azure OpenAI model deployment on the designated resource. |
| modelName | [AzureOpenAIModelName](#azureopenaimodelname) | The name of the embedding model that is deployed at the provided deploymentId path. |
| resourceUri | string<br/>(uri) | The resource URI of the Azure OpenAI resource. |

## AzureOpenAIModelName
The Azure Open AI model name that will be called.

| Value | Description |
| --- | --- |
| text-embedding-ada-002 | TextEmbeddingAda002 model. |
| text-embedding-3-large | TextEmbedding3Large model. |
| text-embedding-3-small | TextEmbedding3Small model. |
| gpt-4o | Gpt4o model. |
| gpt-4o-mini | Gpt4oMini model. |
| gpt-4.1 | Gpt41 model. |
| gpt-4.1-mini | Gpt41Mini model. |
| gpt-4.1-nano | Gpt41Nano model. |
| gpt-5 | Gpt5 model. |
| gpt-5-mini | Gpt5Mini model. |
| gpt-5-nano | Gpt5Nano model. |
