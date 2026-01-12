## KnowledgeBase
Represents a knowledge base definition.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the knowledge base. |
| answerInstructions | string | Instructions considered by the knowledge base when generating answers. |
| description | string | The description of the knowledge base. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. |
| knowledgeSources | [KnowledgeSourceReference](#knowledgesourcereference)[] | Knowledge sources referenced by this knowledge base. |
| models | KnowledgeBaseModel[]:<br/>[KnowledgeBaseAzureOpenAIModel](#knowledgebaseazureopenaimodel)[] | Contains configuration options on how to connect to AI models. |
| name | string | The name of the knowledge base. |
| outputMode | [KnowledgeRetrievalOutputMode](#knowledgeretrievaloutputmode) | The output mode for the knowledge base. |
| retrievalInstructions | string | Instructions considered by the knowledge base when developing query plan. |
| retrievalReasoningEffort | KnowledgeRetrievalReasoningEffort:<br/><br/>- [KnowledgeRetrievalLowReasoningEffort](#knowledgeretrievallowreasoningeffort)<br/>- [KnowledgeRetrievalMediumReasoningEffort](#knowledgeretrievalmediumreasoningeffort)<br/>- [KnowledgeRetrievalMinimalReasoningEffort](#knowledgeretrievalminimalreasoningeffort) | The retrieval reasoning effort configuration. |

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

## KnowledgeSourceReference
Reference to a knowledge source.

| Name | Type | Description |
| --- | --- | --- |
| name | string | The name of the knowledge source. |

## KnowledgeBaseAzureOpenAIModel
Specifies the Azure OpenAI resource used to do query planning.

| Name | Type | Description |
| --- | --- | --- |
| azureOpenAIParameters | [AzureOpenAIVectorizerParameters](#azureopenaivectorizerparameters) | Azure OpenAI parameters. |
| kind | string:<br/>azureOpenAI | The AI model to be used for query planning. |

## KnowledgeRetrievalOutputMode
The output configuration for this retrieval.

| Value | Description |
| --- | --- |
| extractiveData | Return data from the knowledge sources directly without generative alteration. |
| answerSynthesis | Synthesize an answer for the response payload. |

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
