
## Classic search — Indexes

- Create a search index (Portal) — https://learn.microsoft.com/en-us/azure/search/search-how-to-create-search-index
- Create a vector index (Portal) — https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index
- Import data into an index (Portal import wizard) — https://learn.microsoft.com/en-us/azure/search/search-how-to-load-search-index
- Import large data sets (Portal guided workflow) — https://learn.microsoft.com/en-us/azure/search/search-how-to-large-index
- Manage an index (Portal index settings & fields) — https://learn.microsoft.com/en-us/azure/search/search-how-to-manage-index
- Update or rebuild an index (Portal rebuild/reindex actions) — https://learn.microsoft.com/en-us/azure/search/search-howto-reindex
- Create and manage index aliases (Portal alias UI) — https://learn.microsoft.com/en-us/azure/search/search-how-to-alias

# Features — UI-focused one-line list
 - **Create a knowledge store (REST):** Use REST API calls to create storage containers, indexes, data sources, skillsets with `knowledgeStore`/projections, indexers, and run the pipeline. — https://learn.microsoft.com/en-us/azure/search/knowledge-store-create-rest
 - **Connect knowledge store to Power BI (Desktop/Portal):** Launch Power BI Desktop, connect to Azure Table Storage, load projection tables, expand Content, adjust types, and validate relationships. — https://learn.microsoft.com/en-us/azure/search/knowledge-store-connect-power-bi

*(This file intentionally contains only one-line UI feature descriptions for the portal-like application.)*

## Service
- **Service management:** Create, configure, scale, upgrade tiers, and delete Azure AI Search services.
 - **Service management:** Create, configure, scale, upgrade tiers, and delete Azure AI Search services. — [Configure a search service](https://learn.microsoft.com/en-us/azure/search/search-manage)
 - **Quota & billing:** Show quotas, usage, and billing-relevant limits per service and tier. — [Azure pricing calculator](https://azure.microsoft.com/pricing/details/search/)
	- **Service settings & diagnostics:** Configure diagnostic logging, tags, and service-level settings in the portal. — [Enable diagnostic logging](https://learn.microsoft.com/en-us/azure/search/search-monitor-enable-logging)
	- **Service management (REST & CLI):** View management endpoints and perform service admin actions via REST/CLI. — [Service REST management](https://learn.microsoft.com/en-us/azure/search/search-manage-rest)

## Security & Access
- **Authentication & roles:** Configure RBAC, API keys, and managed identities; assign role-based UI flows.
- **Network & private endpoints:** Configure firewall rules, allowed IPs, VNet/private endpoint setup and diagnostics.
- **Document-level access:** Configure document-level security, ACL ingestion, and permission-filter testing.
- **Encryption & keys:** Configure customer-managed keys (CMK) and key rotation UI.
 - **Authentication & roles:** Configure RBAC, API keys, and managed identities; assign role-based UI flows. — [Enable role-based access](https://learn.microsoft.com/en-us/azure/search/search-security-enable-roles)
 - **Network & private endpoints:** Configure firewall rules, allowed IPs, VNet/private endpoint setup and diagnostics. — [Create a private endpoint](https://learn.microsoft.com/en-us/azure/search/service-create-private-endpoint)
 - **Document-level access:** Configure document-level security, ACL ingestion, and permission-filter testing. — [Document-level security overview](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview)
 - **Encryption & keys:** Configure customer-managed keys (CMK) and key rotation UI. — [Configure customer-managed keys (CMK)](https://learn.microsoft.com/en-us/azure/search/search-security-manage-encryption-keys)

## Indexes
- **Index list & overview:** List indexes with doc counts, vector usage, and schema summary.
- **Index designer:** Create and edit index schemas (fields, types, attributes, analyzers, vector fields).
- **Index versioning & aliases:** Create aliases, swap indexes, and track index versions.
- **Index import / export:** Export/import index definitions (JSON) and clone indexes across services.
 - **Update & rebuild index:** Trigger index rebuilds, perform allowed schema updates, and manage index aliases for seamless swaps.
 - **Index list & overview:** List indexes with doc counts, vector usage, and schema summary. — [What is a search index?](https://learn.microsoft.com/en-us/azure/search/search-what-is-an-index)
 - **Index designer:** Create and edit index schemas (fields, types, attributes, analyzers, vector fields). — [Create a search index](https://learn.microsoft.com/en-us/azure/search/search-how-to-create-search-index)
 - **Index versioning & aliases:** Create aliases, swap indexes, and track index versions. — [Alias an index](https://learn.microsoft.com/en-us/azure/search/search-how-to-alias)
 - **Index import / export:** Export/import index definitions (JSON) and clone indexes across services. — [Import data / load index](https://learn.microsoft.com/en-us/azure/search/search-how-to-load-search-index)
 -  **Update & rebuild index:** Trigger index rebuilds, perform allowed schema updates, and manage index aliases for seamless swaps. — [Update or rebuild an index](https://learn.microsoft.com/en-us/azure/search/search-howto-reindex)

### Index text & analyzers
- **Field editor:** Add/edit fields, set retrievable/searchable/filterable/facetable attributes.
- **Analyzers & tokenization:** Add language and custom analyzers and test tokenization.
- **Synonyms & suggesters:** Create synonym maps, suggesters, and spell-check configurations.
 - **Create synonym maps (REST):** Create and manage `synonymMap` resources and assign a synonym map to string fields via index updates. — https://learn.microsoft.com/en-us/azure/search/search-synonyms
 - **Configure suggesters (Portal/index):** Add a suggester to an index, choose searchable string fields and analyzer, set Autocomplete settings, and use `suggest`/`autocomplete` APIs. — https://learn.microsoft.com/en-us/azure/search/index-add-suggesters
 - **Design multilingual indexes (Portal):** Add language-specific fields or analyzers, enable translation via skillsets/Foundry, and constrain queries to language fields. — https://learn.microsoft.com/en-us/azure/search/search-language-support
 - **Field editor:** Add/edit fields, set retrievable/searchable/filterable/facetable attributes. — [Add search fields to an index](https://learn.microsoft.com/en-us/rest/api/searchservice/indexes/create)
 - **Analyzers & tokenization:** Add language and custom analyzers and test tokenization. — [What is an analyzer?](https://learn.microsoft.com/en-us/azure/search/search-analyzers)
 - **Synonyms & suggesters:** Create synonym maps, suggesters, and spell-check configurations. — [Add synonyms](https://learn.microsoft.com/en-us/azure/search/search-synonyms) / [Add a suggester](https://learn.microsoft.com/en-us/azure/search/index-add-suggesters)

### Index vectors & embedding
- **Vector profiles & algorithms:** Manage vector search profiles, algorithm configs (HNSW/alg params).
- **Vectorizers & model bindings:** Bind embedding/vectorizer models (OpenAI/Foundry/Vision/custom) to profiles.
- **Chunking & embedding controls:** Configure chunking rules, chunk sizes, and embedding pipelines.
- **Vector storage optimization:** Show vector quotas and provide compression/quantization options UI.
 - **Integrated vectorization pipelines:** Create/manage end-to-end pipelines (data source → indexer → skillset → vector index).
 - **Configure a vectorizer in an index (Portal):** Add and manage `vectorizers` and `profiles` on index fields, assign a model/deployment, and set expected field dimensions. — https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-configure-vectorizer
 - **Add vectorizer to index:** Configure index-level vectorizers (deployment/model, dimensions, vectorSearch.profile).
 - **Index projections & one-to-many mapping:** Configure index projections and parent/child mapping for chunked documents.
 - **Vector profiles & algorithms:** Manage vector search profiles, algorithm configs (HNSW/alg params). — [What is a vector index?](https://learn.microsoft.com/en-us/azure/search/vector-store)
 - **Vectorizers & model bindings:** Bind embedding/vectorizer models (OpenAI/Foundry/Vision/custom) to profiles. — [Vectorizers (OpenAI/Foundry)](https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-open-ai) / [Foundry model catalog](https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-machine-learning-ai-studio-catalog)
 - **Chunking & embedding controls:** Configure chunking rules, chunk sizes, and embedding pipelines. — [Chunk documents](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents)
 - **Vector storage optimization:** Show vector quotas and provide compression/quantization options UI. — [Understand vector quotas and limits](https://learn.microsoft.com/en-us/azure/search/vector-search-index-size)
 - **Integrated vectorization pipelines:** Create/manage end-to-end pipelines (data source → indexer → skillset → vector index). — [Use integrated vectorization](https://learn.microsoft.com/en-us/azure/search/search-how-to-integrated-vectorization)
 - **Add vectorizer to index:** Configure index-level vectorizers (deployment/model, dimensions, vectorSearch.profile). — [Configure a vectorizer in a search index](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-configure-vectorizer)
 - **Index projections & one-to-many mapping:** Configure index projections and parent/child mapping for chunked documents. — [Define an index projection](https://learn.microsoft.com/en-us/azure/search/search-how-to-define-index-projections)

## Data ingestion & Indexers
 - **Configure managed identities (Portal):** Enable system or user-assigned managed identities on a search service, assign roles, and use them for indexer, vectorizer, and skill connections. — https://learn.microsoft.com/en-us/azure/search/search-how-to-managed-identities
 - **Indexer configuration options:** Set `batchSize`, `parsingMode`, `dataToExtract`, `allowSkillsetToReadFileData`, `indexedFileNameExtensions`, `excludedFileNameExtensions`, and error-tolerance settings.
 - **Change & deletion detection:** Configure change detection policies (HighWaterMark/SqlIntegratedChangeTracking) and soft-delete mapping.
 - **Indexer schedule & run controls:** Schedule interval, run now, reset, and view run parameters.
 - **Indexer execution history & debug:** View execution history (recent runs), errors, itemsProcessed, and launch debug sessions.
 - **ADLS Gen2 indexer:** Create ADLS Gen2 data source (hierarchical namespace), configure credentials (managed identity/SAS), set virtual folder/query and parsingMode, and create/schedule the indexer. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-data-lake-storage
 - **OneLake indexer:** Create OneLake data source, grant Fabric workspace permissions (Contributor), configure container/query, soft-delete via metadata, and run/schedule the indexer with parsingMode and enrichment options. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-onelake-files
 - **SharePoint indexer:** Configure SharePoint data source/auth (app or delegated, client secret or secretless managed identity), set container/query and inclusion/exclusion rules, create the indexer and complete device-code sign-in flow when required. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sharepoint-online
 - **Azure Files indexer:** Create Azure Files data source (SMB share), configure credentials (connection string/managed identity), set share/subfolder query, parsingMode, and indexing options, then create/schedule the indexer. — https://learn.microsoft.com/en-us/azure/search/search-file-storage-integration
 - **Azure Table Storage indexer:** Create Azure Table data source, choose auth (key or managed identity), set table name/query or partition filter for performance, define key mapping and schedule the indexer. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-tables
 - **Cosmos DB (MongoDB) indexer:** Create CosmosDB (MongoDB API) data source with connection string/managed identity, set collection as container, configure `_ts` high-water-mark change detection or soft-delete, add indexer and schedule. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-cosmosdb-mongodb
 - **Azure SQL Managed Instance indexer:** Enable public/private endpoint for Managed Instance, obtain public endpoint connection string or configure shared private link, set data source credentials (connection string or managed identity), create indexer and schedule. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sql-managed-instance
 - **Azure SQL Server VM indexer:** Configure encrypted connection (install TLS cert/FQDN), open NSG/firewall to search service and portal IPs, provide connection string/credentials, create and run the indexer. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sql-server
 - **Azure DB for MySQL indexer (preview):** Create MySQL data source (ADO.NET conn string), set table/view and high-water-mark column, configure credentials or managed identity, create indexer via REST/SDK and monitor runs. — https://learn.microsoft.com/en-us/azure/search/search-how-to-index-mysql
 - **Import wizards:** Guided portal wizards to connect data sources, choose extraction/embedding methods, and create pipelines. — [Import data (portal)](https://learn.microsoft.com/en-us/azure/search/search-import-data-portal)
 - **Indexers & data sources:** Create, configure, test, schedule, run, and reset indexers and their data source connections. — [Indexers overview](https://learn.microsoft.com/en-us/azure/search/search-indexer-overview)
 - **Field mappings & projections:** Map source fields to index fields and define knowledge-store projections. — [Define field mappings](https://learn.microsoft.com/en-us/azure/search/search-indexer-field-mappings) / [Output field mappings](https://learn.microsoft.com/en-us/azure/search/cognitive-search-output-field-mapping)
	- **Bulk import & push API:** Upload documents using REST/SDK bulk index APIs (`docs/index`) and buffered senders. — [Push API tutorial](https://learn.microsoft.com/en-us/azure/search/tutorial-optimize-indexing-push-api)
 - **Index whole files:** Configure indexing behavior for CSV, JSON, Markdown, plain text, and blob metadata. — [Index data from Azure Blob Storage](https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-blob-storage)
 - **Indexer troubleshooting:** Show indexer executions, errors/warnings and debug session links. — [Troubleshoot an indexer](https://learn.microsoft.com/en-us/azure/search/search-indexer-troubleshooting)
	- **Data source connections:** Create and test data sources with credentials (connection string, SAS, resourceId/token) and managed identity setup. — [Supported data sources](https://learn.microsoft.com/en-us/azure/search/search-data-sources-gallery) / [Managed identities](https://learn.microsoft.com/en-us/azure/search/search-how-to-managed-identities)
	- **Indexer configuration options:** Set `batchSize`, `parsingMode`, `dataToExtract`, `allowSkillsetToReadFileData`, `indexedFileNameExtensions`, `excludedFileNameExtensions`, and error-tolerance settings. — [Create an indexer (REST)](https://learn.microsoft.com/en-us/azure/search/search-howto-create-indexers)
	- **Change & deletion detection:** Configure change detection policies (HighWaterMark/SqlIntegratedChangeTracking) and soft-delete mapping. — [Index changed and deleted content](https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-blob-changed-deleted) / [SQL change detection](https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sql-database)
	- **Indexer schedule & run controls:** Schedule interval, run now, reset, and view run parameters. — [Schedule an indexer](https://learn.microsoft.com/en-us/azure/search/search-howto-schedule-indexers) / [Run or reset an indexer](https://learn.microsoft.com/en-us/azure/search/search-howto-run-reset-indexers)
	- **Indexer execution history & debug:** View execution history (recent runs), errors, itemsProcessed, and launch debug sessions. — [Monitor indexer-based indexing](https://learn.microsoft.com/en-us/azure/search/search-monitor-indexers) / [Debug sessions](https://learn.microsoft.com/en-us/azure/search/cognitive-search-debug-session)
	 - **Indexer data-type mapping:** Preview how source data types map to index field EDM types and surface mapping fixes in the indexer UI. — [Data type map for indexers](https://learn.microsoft.com/rest/api/searchservice/data-type-map-for-indexers-in-azure-search)

## Skillsets & Enrichment
- **Skillset editor:** Create and edit AI enrichment skillsets (OCR, image analysis, entity extraction, shaper, custom skills).
- **Attach billable resources:** Attach Foundry/OpenAI resources and configure authentication for skills.
- **Generative AI skills:** Add GenAI Prompt and Azure OpenAI embedding skills with responsible-AI controls.
- **Debug sessions & caches:** Launch debug sessions, view step-by-step annotations, and manage enrichment caches.
- **Knowledge stores:** Configure knowledge stores, view persisted artifacts, and export to Power BI.
 - **Skillsets for integrated vectorization:** Create skillsets that call Text Split/Document Layout and embedding skills for chunking+vectorization.
 - **Attach/authorize vector models:** Configure key vs token auth for Foundry/AML/OpenAI models and test model connectivity.
 - **Skillset editor:** Create and edit AI enrichment skillsets (OCR, image analysis, entity extraction, shaper, custom skills). — [Create a skillset (how-to)](https://learn.microsoft.com/en-us/azure/search/cognitive-search-defining-skillset)
 - **Attach billable resources:** Attach Foundry/OpenAI resources and configure authentication for skills. — [Attach a billable resource](https://learn.microsoft.com/en-us/azure/search/cognitive-search-attach-cognitive-services)
 - **Generative AI skills:** Add GenAI Prompt and Azure OpenAI embedding skills with responsible-AI controls. — [GenAI Prompt skill example](https://learn.microsoft.com/en-us/azure/search/chat-completion-skill-example-usage) / [Responsible AI best practices](https://learn.microsoft.com/en-us/azure/search/responsible-ai-best-practices-genai-prompt-skill)
 - **Debug sessions & caches:** Launch debug sessions, view step-by-step annotations, and manage enrichment caches. — [Debug a skillset](https://learn.microsoft.com/en-us/azure/search/cognitive-search-how-to-debug-skillset) / [Enrichment cache](https://learn.microsoft.com/en-us/azure/search/enrichment-cache-how-to-configure)
 - **Knowledge stores:** Configure knowledge stores, view persisted artifacts, and export to Power BI. — [Create a knowledge store (portal)](https://learn.microsoft.com/en-us/azure/search/knowledge-store-create-portal) / [Connect with Power BI](https://learn.microsoft.com/en-us/azure/search/knowledge-store-connect-power-bi)

 - **Define knowledge-store projections (Portal/skillset):** Set `storageConnectionString`, create projection groups, and add tables/objects/files projection definitions. — https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-overview
 - **Shape data for projections (Shaper or inline):** Add a Shaper skill or inline shapes to produce JSON shapes and configure `sourceContext`/inputs for table/object projections. — https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-shape
 - **Create table/object/file projections (Portal/skillset):** Define `tableName`/`generatedKeyName`/`source` for tables, `storageContainer`/`source` for objects, and `files` projections for images. — https://learn.microsoft.com/en-us/azure/search/knowledge-store-projections-examples
 - **Test and verify projections (Portal):** Set storage conn string, update skillset, run indexer, monitor runs, and verify created tables/blobs in Azure Storage. — https://learn.microsoft.com/en-us/azure/search/knowledge-store-projections-examples
	- **Skillsets for integrated vectorization:** Create skillsets that call Text Split/Document Layout and embedding skills for chunking+vectorization. — [Integrated vectorization guide](https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization)
	- **Attach/authorize vector models:** Configure key vs token auth for Foundry/AML/OpenAI models and test model connectivity. — [Foundry/AML vectorizers](https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization-ai-studio)

## Agentic Retrieval (RAG)
- **Knowledge sources:** Create and manage knowledge sources (indexed and remote) and their vectorizers.
- **Knowledge bases:** Create/manage knowledge bases, model deployments, and answer-synthesis settings.
- **Agentic test playground:** Chat UI to run retrieval queries, view synthesized answers, activity logs and references.
 - **Create blob knowledge source (Portal):** Guided wizard to create a blob knowledge source that generates indexer/index/skillset. — https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-blob
 - **Create OneLake knowledge source (Portal):** Guided wizard to create an OneLake knowledge source and monitor ingestion status. — https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-onelake
 - **Create an agentic retrieval index (Portal):** Configure index schema, semantic config, vector fields, and vectorizers for agentic retrieval. — https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-index
 - **Create/manage knowledge bases (Portal):** Create knowledge bases, attach models, set retrieval reasoning effort, and manage properties. — https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base
 - **Enable answer synthesis (KB or per-request):** Turn on answer synthesis for citation-backed LLM answers at KB or request time. — https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-answer-synthesis
 - **Agentic retrieval overview & RAG guidance:** Show overview, architecture, cost controls, and when to choose agentic vs classic RAG. — https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview
 - **RAG patterns & content prep:** Guidance UI links for RAG best-practices and content preparation (chunking/vectorization). — https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview
 - **Knowledge sources:** Create and manage knowledge sources (indexed and remote) and their vectorizers. — [Knowledge source overview](https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-overview)
 - **Knowledge bases:** Create/manage knowledge bases, model deployments, and answer-synthesis settings. — [Create a knowledge base](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base)
 - **Agentic test playground:** Chat UI to run retrieval queries, view synthesized answers, activity logs and references. — [Get started portal agentic retrieval](https://learn.microsoft.com/en-us/azure/search/get-started-portal-agentic-retrieval)

## Search & Querying
- **Search Explorer:** Query builder for full-text, vector, hybrid, and multimodal searches with JSON result preview.
- **Query options UI:** Configure filters, facets, sorting, pagination, semantic options, captions, and answer types.
- **Hybrid & multimodal controls:** Toggle hybrid scoring, image verbalization vs multimodal embeddings, and multimodal query inputs.
- **Vector query builder:** Construct vector queries, multi-vector fields, and vector + filter combinations.
 - **Search Explorer:** Query builder for full-text, vector, hybrid, and multimodal searches with JSON result preview. — [Search Explorer](https://learn.microsoft.com/en-us/azure/search/search-explorer)
 - **Query options UI:** Configure filters, facets, sorting, pagination, semantic options, captions, and answer types. — [Create a full-text query](https://learn.microsoft.com/en-us/azure/search/search-query-create)
 - **Hybrid & multimodal controls:** Toggle hybrid scoring, image verbalization vs multimodal embeddings, and multimodal query inputs. — [Hybrid search overview](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview) / [Multimodal tutorials](https://learn.microsoft.com/en-us/azure/search/tutorial-document-extraction-multimodal-embeddings)
 - **Vector query builder:** Construct vector queries, multi-vector fields, and vector + filter combinations. — [Create a vector query](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-query)
 - **Query syntax modes:** Toggle and edit queries in Simple or Lucene (full) modes with syntax help and validation. — [Simple query syntax](https://learn.microsoft.com/en-us/azure/search/query-simple-syntax) / [Lucene query syntax](https://learn.microsoft.com/en-us/azure/search/query-lucene-syntax)
 - **Vector query builder:** Construct vector queries, multi-vector fields, and vector + filter combinations. — [Create a vector query](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-query)
 - **Autocomplete & suggestions:** Configure suggesters, min-chars, fuzzy matching, and highlight options for typeahead and suggestion dropdowns (Portal). — https://learn.microsoft.com/en-us/azure/search/search-add-autocomplete-suggestions
 - **Convert query string to vector:** Choose integrated vectorization or external embedding at query time (Search Explorer/portal). — https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-query
 - **Vector query parameters:** Set `k`, `exhaustive`, `weight`, and target fields for vector queries (Portal). — https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-query
 - **Vector filter controls:** Define filter expressions and set `vectorFilterMode` (preFilter/postFilter/strictPostFilter) in the portal JSON view. — https://learn.microsoft.com/en-us/azure/search/vector-search-filters
 - **Exclude low-scoring vector results (preview):** Set a `threshold` to drop low-similarity matches from vector-only queries (Portal preview). — https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-query

- **Hybrid query tuning:** Set `maxTextRecallSize` and `countAndFacetMode` to control BM25 recall window and whether counts/facets include all matches or only recalled results. — https://learn.microsoft.com/en-us/azure/search/hybrid-search-how-to-query
- **Per-vector filter override (preview):** Configure `vectorQueries.filterOverride` to apply OData filters to specific vector subqueries in hybrid requests. — https://learn.microsoft.com/en-us/azure/search/hybrid-search-how-to-query
- **Facets UI:** Configure facet expressions (count, sort, values, interval), hierarchical facets, include/exclude term filters, precisionThreshold, and aggregation metrics in the portal faceting UI. — https://learn.microsoft.com/en-us/azure/search/search-faceted-navigation-examples
- **Semantic answers UI:** Enable `queryType=semantic` + `answers` and render the `@search.answers` array (text, highlights, confidence) and captions in the results panel. — https://learn.microsoft.com/en-us/azure/search/semantic-answers
- **Multimodal indexing & image queries:** Create multimodal skillsets/indexers, project cropped images to a knowledge store, populate `location_metadata`, and toggle image verbalization vs multimodal embeddings in Search Explorer. — https://learn.microsoft.com/en-us/azure/search/tutorial-document-extraction-multimodal-embeddings

## Relevance & Ranking
- **Scoring profiles:** Create and manage scoring profiles, boosting, and field weights.
- **Semantic configurations:** Create semantic configs, enable semantic reranking, captions, and semantic answers.
- **Ranking diagnostics:** Visualize reranker scores, BM25 vs vector signals, and tuning suggestions.
 - **Scoring profiles:** Create and manage scoring profiles, boosting, and field weights. — [Add a scoring profile](https://learn.microsoft.com/en-us/azure/search/index-add-scoring-profiles)
 - **Semantic configurations:** Create semantic configs, enable semantic reranking, captions, and semantic answers. — [Configure semantic ranker](https://learn.microsoft.com/en-us/azure/search/semantic-how-to-configure)
 - **Ranking diagnostics:** Visualize reranker scores, BM25 vs vector signals, and tuning suggestions. — [Vector ranking / hybrid ranking docs](https://learn.microsoft.com/en-us/azure/search/vector-search-ranking)

## Monitoring, Observability & Operations
- **Metrics & dashboards:** Metrics for queries, latency, error rates, and vector storage usage.
- **Indexer & pipeline monitoring:** Indexer run history, enrichment throughput, and pipeline health.
- **Activity & debug logs:** Show activity arrays for agentic retrieval, indexing, and enrichment with export options.
- **Diagnostic logging:** Enable/disable diagnostic logging, connect to Log Analytics, and view sample queries.
 - **Metrics & dashboards:** Metrics for queries, latency, error rates, and vector storage usage. — [Monitor Azure Cognitive Search](https://learn.microsoft.com/en-us/azure/search/monitor-azure-cognitive-search)
 - **Indexer & pipeline monitoring:** Indexer run history, enrichment throughput, and pipeline health. — [Monitor indexer-based indexing](https://learn.microsoft.com/en-us/azure/search/search-monitor-indexers)
 - **Activity & debug logs:** Show activity arrays for agentic retrieval, indexing, and enrichment with export options. — [Visualize resource logs / Power BI](https://learn.microsoft.com/en-us/azure/search/search-monitor-logs-powerbi)
 - **Diagnostic logging:** Enable/disable diagnostic logging, connect to Log Analytics, and view sample queries. — [Enable diagnostic logging](https://learn.microsoft.com/en-us/azure/search/search-monitor-enable-logging)
 - **Metrics explorer:** Open Metrics explorer with preset charts and time-range controls to visualize QPS, latency, and throttling. — [Monitor query requests in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-monitor-queries)
 - **Create alerts:** Create metric and log alerts for search latency, QPS thresholds, and throttled queries with actionable action groups. — [Monitor Azure AI Search](https://learn.microsoft.com/en-us/azure/search/monitor-azure-cognitive-search)
 - **Log Analytics & KQL:** Run Kusto queries in Log Analytics to inspect `AzureDiagnostics` for query strings, durations, and indexer events. — [Configure diagnostic logging](https://learn.microsoft.com/en-us/azure/search/search-monitor-enable-logging)
 - **Indexer status API:** View indexer status, execution history, and recent run details in the portal or via `Get Indexer Status` REST API. — [Monitor indexer-based indexing](https://learn.microsoft.com/en-us/azure/search/search-monitor-indexers)

## Developer Tools & Integrations
- **REST & SDK links:** Provide REST snippets and SDK examples for each major operation.
- **Samples & templates:** Provide sample projects, quickstarts, and GitHub sample links.
- **Export config & automation:** Export ARM/Bicep templates, CLI snippets, and IaC automation helpers.
 - **REST & SDK links:** Provide REST snippets and SDK examples for each major operation. — [API versions & SDKs](https://learn.microsoft.com/en-us/azure/search/search-api-versions)
 - **Samples & templates:** Provide sample projects, quickstarts, and GitHub sample links. — [C# samples](https://learn.microsoft.com/en-us/azure/search/samples-dotnet)
 - **Export config & automation:** Export ARM/Bicep templates, CLI snippets, and IaC automation helpers. — [Tools and accelerators](https://learn.microsoft.com/en-us/azure/search/resource-tools)
 - **API versions & migration:** Show supported REST and SDK API versions, deprecation notices, and migration guidance for portal/SDK operations. — [API versions in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-api-versions)
 - **Export monitoring data:** Export metrics and logs via REST, Log Analytics export, or workspace data export for external analysis. — [Monitor Azure AI Search](https://learn.microsoft.com/en-us/azure/search/monitor-azure-cognitive-search)

## Portal UX & Governance
- **Role-based UI controls:** Surface features and actions based on user roles and permissions.
- **Backup / export / import configs:** Export/import index/skillset/pipeline configurations for backups or migration.
- **Workspace & project grouping:** Group indexes, pipelines, and knowledge bases into projects or workspaces.
- **Help & responsible AI:** Contextual help, transparency notes, and responsible-AI best-practices links.
 - **Role-based UI controls:** Surface features and actions based on user roles and permissions. — [Enable role-based access](https://learn.microsoft.com/en-us/azure/search/search-security-enable-roles)
 - **Backup / export / import configs:** Export/import index/skillset/pipeline configurations for backups or migration. — [Resource tools & accelerators](https://learn.microsoft.com/en-us/azure/search/resource-tools)
 - **Workspace & project grouping:** Group indexes, pipelines, and knowledge bases into projects or workspaces. — [Tools and accelerators](https://learn.microsoft.com/en-us/azure/search/resource-tools)
 - **Help & responsible AI:** Contextual help, transparency notes, and responsible-AI best-practices links. — [Transparency note / responsible AI](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/search/transparency-note)

---

## Additional portal actions (recently added)
- **Create remote SharePoint knowledge source (Portal):** Create a remote SharePoint knowledge source, set KQL `filterExpression`, resource metadata, and assign it to a knowledge base. — https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote
- **Create Web knowledge source (Portal):** Create a Web Knowledge Source, configure allowed/blocked domains and include_subpages, and assign it to a knowledge base. — https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-web
- **Configure a vectorizer in an index (Portal):** Add/manage `vectorizers` and `profiles` on index fields, assign a model/deployment and set expected field dimensions. — https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-configure-vectorizer
- **Add Azure OpenAI vectorizer (Portal):** Add an Azure OpenAI vectorizer: set `resourceUri`, `deploymentId`/`modelName`, and `apiKey` or `authIdentity`. — https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-open-ai
- **Add Foundry / AML model catalog vectorizer (Portal, preview):** Add a Foundry/AML catalog vectorizer, configure `uri`/`resourceId`, key or token auth, and assign `modelName` to a vector profile. — https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-machine-learning-ai-studio-catalog
- **Add custom Web API vectorizer (Portal):** Configure a custom Web API vectorizer with endpoint, method/headers, `authResourceId`/`authIdentity`, timeout and JSON payload contract. — https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-custom-web-api

- **Create a skillset (Portal):** Create and edit AI enrichment skillsets, add built-in or custom skills (Text Split, OCR, Image Analysis, GenAI Prompt), attach Foundry/OpenAI/AML resources, and launch debug sessions. — https://learn.microsoft.com/en-us/azure/search/cognitive-search-defining-skillset
- **Create integrated vectorization pipelines (Portal):** Create skillsets that run Text Split and embedding skills during indexing to chunk and vectorize content into an index. — https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization
- **Add Azure Vision vectorizer (Portal, preview):** Add an Azure Vision vectorizer: configure Foundry vision resource, `modelVersion`/auth, supported inputs (`imageUrl`/`imageBinary`/text), and assign to a vector profile (1024 dims). — https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-ai-services-vision
- **Manage Web knowledge source access (Portal/subscription):** Enable/disable and manage Web Knowledge Source access at subscription level and review grounding/privacy/preview notes. — https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-web-manage

## Skillset & enrichment (portal actions)
- **Debug Sessions (Portal):** Start a Debug Session, inspect the enriched document, edit skill settings, run the session, and commit fixes to a skillset. — https://learn.microsoft.com/en-us/azure/search/cognitive-search-debug-session
- **Attach a billable Foundry resource to a skillset (Portal):** Attach or remove a Foundry/AI Services resource by key or managed identity in a skillset's billing settings. — https://learn.microsoft.com/en-us/azure/search/cognitive-search-attach-cognitive-services
- **Create a knowledge store (Portal import wizard):** Run the Import Data wizard to add a data source, define skills, choose projections, configure an index, and create a knowledge store. — https://learn.microsoft.com/en-us/azure/search/knowledge-store-create-portal
- **Enable enrichment cache on an indexer (Portal):** Enable incremental enrichment caching on an indexer, set storage account, reset and run the indexer. — https://learn.microsoft.com/en-us/azure/search/enrichment-cache-how-to-configure
- **Add GenAI Prompt / ChatCompletion skill (Portal, preview):** Add a GenAI Prompt (chat/completion) skill to a skillset to verbalize images or generate structured responses and map outputs to index fields. — https://learn.microsoft.com/en-us/azure/search/chat-completion-skill-example-usage
 - **Edit skillset JSON to add index projections (Portal JSON editor):** Add or edit `indexProjections` in a skillset to map parent/child chunks to target indexes or fields. — https://learn.microsoft.com/en-us/azure/search/search-how-to-define-index-projections
 - **Map skill outputs to index fields (Portal/indexer):** Configure `outputFieldMappings` in an indexer or use the Import Data wizard to map enriched skill outputs (embeddings, OCR, entities) to index fields. — https://learn.microsoft.com/en-us/azure/search/cognitive-search-output-field-mapping
 - **Configure responsible-AI for GenAI Prompt skill (Portal):** Set content-safety filters, use a development index and sampling workflows (Debug Sessions / Search Explorer), and configure primary/secondary index swap via aliases. — https://learn.microsoft.com/en-us/azure/search/responsible-ai-best-practices-genai-prompt-skill
 - **Add a custom Web API skill (Portal/skillset JSON):** Define a Custom Web API skill with `uri`, `authResourceId`/API key, `timeout`, inputs/outputs, and HTTP headers and attach it to a skillset. — https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-interface

---

*(One-line, portal-focused UI features derived from the TOC; I will iterate on remaining TOC items and add links on request.)*

