## SearchIndexerDataSource
Represents a datasource definition, which can be used to configure an indexer.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the data source. |
| container | [SearchIndexerDataContainer](#searchindexerdatacontainer) | The data container for the datasource. |
| credentials.connectionString | string | The connection string for the datasource. Set to <unchanged> (with brackets) if you don't want the connection string updated. Set to <redacted> if you want to remove the connection string value from the datasource. |
| dataChangeDetectionPolicy | DataChangeDetectionPolicy:<br/><br/>- [HighWaterMarkChangeDetectionPolicy](#highwatermarkchangedetectionpolicy)<br/>- [SqlIntegratedChangeTrackingPolicy](#sqlintegratedchangetrackingpolicy) | The data change detection policy for the datasource. |
| dataDeletionDetectionPolicy | DataDeletionDetectionPolicy:<br/><br/>- [NativeBlobSoftDeleteDeletionDetectionPolicy](#nativeblobsoftdeletedeletiondetectionpolicy)<br/>- [SoftDeleteColumnDeletionDetectionPolicy](#softdeletecolumndeletiondetectionpolicy) | The data deletion detection policy for the datasource. |
| description | string | The description of the datasource. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your datasource definition when you want full assurance that no one, not even Microsoft, can decrypt your data source definition. Once you have encrypted your data source definition, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your datasource definition will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| identity | SearchIndexerDataIdentity:<br/><br/>- [SearchIndexerDataNoneIdentity](#searchindexerdatanoneidentity)<br/>- [SearchIndexerDataUserAssignedIdentity](#searchindexerdatauserassignedidentity) | An explicit managed identity to use for this datasource. If not specified and the connection string is a managed identity, the system-assigned managed identity is used. If not specified, the value remains unchanged. If "none" is specified, the value of this property is cleared. |
| indexerPermissionOptions | [IndexerPermissionOption](#indexerpermissionoption)[] | Ingestion options with various types of permission data. |
| name | string | The name of the datasource. |
| subType | string | A specific type of the data source, in case the resource is capable of different modalities. For example, 'MongoDb' for certain 'cosmosDb' accounts. |
| type | [SearchIndexerDataSourceType](#searchindexerdatasourcetype) | The type of the datasource. |

## SearchIndexerDataContainer
Represents information about the entity (such as Azure SQL table or CosmosDB collection) that will be indexed.

| Name | Type | Description |
| --- | --- | --- |
| name | string | The name of the table or view (for Azure SQL data source) or collection (for CosmosDB data source) that will be indexed. |
| query | string | A query that is applied to this data container. The syntax and meaning of this parameter is datasource-specific. Not supported by Azure SQL datasources. |

## HighWaterMarkChangeDetectionPolicy
Defines a data change detection policy that captures changes based on the value of a high water mark column.

| Name | Type | Description |
| --- | --- | --- |
| @odata.type | string:<br/>#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy | The discriminator for derived types. |
| highWaterMarkColumnName | string | The name of the high water mark column. |

## SqlIntegratedChangeTrackingPolicy
Defines a data change detection policy that captures changes using the Integrated Change Tracking feature of Azure SQL Database.

| Name | Type | Description |
| --- | --- | --- |
| @odata.type | string:<br/>#Microsoft.Azure.Search.SqlIntegratedChangeTrackingPolicy | The discriminator for derived types. |

## NativeBlobSoftDeleteDeletionDetectionPolicy
Defines a data deletion detection policy utilizing Azure Blob Storage's native soft delete feature for deletion detection.

| Name | Type | Description |
| --- | --- | --- |
| @odata.type | string:<br/>#Microsoft.Azure.Search.NativeBlobSoftDeleteDeletionDetectionPolicy | The discriminator for derived types. |

## SoftDeleteColumnDeletionDetectionPolicy
Defines a data deletion detection policy that implements a soft-deletion strategy. It determines whether an item should be deleted based on the value of a designated 'soft delete' column.

| Name | Type | Description |
| --- | --- | --- |
| @odata.type | string:<br/>#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy | The discriminator for derived types. |
| softDeleteColumnName | string | The name of the column to use for soft-deletion detection. |
| softDeleteMarkerValue | string | The marker value that identifies an item as deleted. |

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

## IndexerPermissionOption
Options with various types of permission data to index.

| Value | Description |
| --- | --- |
| userIds | Indexer to ingest ACL userIds from data source to index. |
| groupIds | Indexer to ingest ACL groupIds from data source to index. |
| rbacScope | Indexer to ingest Azure RBAC scope from data source to index. |

## SearchIndexerDataSourceType
Defines the type of a datasource.

| Value | Description |
| --- | --- |
| azuresql | Indicates an Azure SQL datasource. |
| cosmosdb | Indicates a CosmosDB datasource. |
| azureblob | Indicates an Azure Blob datasource. |
| azuretable | Indicates an Azure Table datasource. |
| mysql | Indicates a MySql datasource. |
| adlsgen2 | Indicates an ADLS Gen2 datasource. |
| onelake | Indicates a Microsoft Fabric OneLake datasource. |
| sharepoint | Indicates a SharePoint datasource. |
