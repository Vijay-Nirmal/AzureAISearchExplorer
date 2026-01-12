## SynonymMap
Represents a synonym map definition.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the synonym map. |
| encryptionKey | [SearchResourceEncryptionKey](#searchresourceencryptionkey) | A description of an encryption key that you create in Azure Key Vault. This key is used to provide an additional level of encryption-at-rest for your data when you want full assurance that no one, not even Microsoft, can decrypt your data. Once you have encrypted your data, it will always remain encrypted. The search service will ignore attempts to set this property to null. You can change this property as needed if you want to rotate your encryption key; Your data will be unaffected. Encryption with customer-managed keys is not available for free search services, and is only available for paid services created on or after January 1, 2019. |
| format | enum:<br/>solr | The format of the synonym map. Only the 'solr' format is currently supported. |
| name | string | The name of the synonym map. |
| synonyms | string | A series of synonym rules in the specified synonym map format. The rules must be separated by newlines. |

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
