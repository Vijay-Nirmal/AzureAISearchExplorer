## SearchAlias
Represents an index alias, which describes a mapping from the alias name to an index. The alias name can be used in place of the index name for supported operations.

| Name | Type | Description |
| --- | --- | --- |
| @odata.etag | string | The ETag of the alias. |
| indexes | string[] | The name of the index this alias maps to. Only one index name may be specified. |
| name | string | The name of the alias. |
