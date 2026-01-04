# Pages

Pages in Azure AI Search Explorer application

# Classic Section
1. **Service (Connection & Settings)** - Connect to a search service and manage service-level settings used by all other pages.
  1. Connect to a search service (RBAC-first) - https://learn.microsoft.com/en-us/azure/search/search-get-started-rbac
  2. Service configuration and management (portal concepts) - https://learn.microsoft.com/en-us/azure/search/search-manage
  3. API versions (REST and SDK compatibility) - https://learn.microsoft.com/en-us/azure/search/search-api-versions
  4. Enable diagnostic logging (Log Analytics / Storage / Event Hub) - https://learn.microsoft.com/en-us/azure/search/search-monitor-enable-logging
  5. Security overview (high-level controls surfaced in UI) - https://learn.microsoft.com/en-us/azure/search/search-security-overview

2. **Playground (Search Explorer)** - Interactive query workbench for exploring index behavior.
  1. Search Explorer basics (query + results preview) - https://learn.microsoft.com/en-us/azure/search/search-explorer
  2. Query syntax modes (Simple and Lucene) - https://learn.microsoft.com/en-us/azure/search/query-simple-syntax https://learn.microsoft.com/en-us/azure/search/query-lucene-syntax

3. **Indexes** - Create, view, edit, and manage index schemas.
  1. What is a search index? - https://learn.microsoft.com/en-us/azure/search/search-what-is-an-index
  2. Create a search index - https://learn.microsoft.com/en-us/azure/search/search-how-to-create-search-index
  3. Create a vector index - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index
  4. Manage an index (schema updates, settings) - https://learn.microsoft.com/en-us/azure/search/search-how-to-manage-index
  5. Update or rebuild an index - https://learn.microsoft.com/en-us/azure/search/search-howto-reindex
  6. Model complex types (UI guidance for schema design) - https://learn.microsoft.com/en-us/azure/search/search-howto-complex-data-types
  7. Data types reference (field type help) - https://learn.microsoft.com/rest/api/searchservice/supported-data-types

4. **Aliases** - Swap index versions safely without changing client code.
  1. Create and manage index aliases - https://learn.microsoft.com/en-us/azure/search/search-how-to-alias
  2. Index alias concepts and API surface - https://learn.microsoft.com/en-us/azure/search/search-index-aliases

5. **Synonym Maps** - Improve recall with synonym expansion.
  1. Add synonyms (create/manage synonym maps) - https://learn.microsoft.com/en-us/azure/search/search-synonyms

6. **Suggestions & Typeahead** - Configure suggesters and query-time typeahead.
  1. Add a suggester to an index - https://learn.microsoft.com/en-us/azure/search/index-add-suggesters
  2. Add autocomplete and suggestions (query patterns) - https://learn.microsoft.com/en-us/azure/search/search-add-autocomplete-suggestions
  3. Add spell check (query option) - https://learn.microsoft.com/en-us/azure/search/speller-how-to-add

7. **Data Sources** - Create and manage connections that indexers use.
  1. Supported data sources gallery - https://learn.microsoft.com/en-us/azure/search/search-data-sources-gallery
  2. Secure access to external data (networking/auth considerations) - https://learn.microsoft.com/en-us/azure/search/search-indexer-securing-resources
  3. Configure a managed identity (for data sources, indexers, skills) - https://learn.microsoft.com/en-us/azure/search/search-how-to-managed-identities

8. **Indexers** - Configure ingestion workflows and run/schedule indexing.
  1. What is an indexer? - https://learn.microsoft.com/en-us/azure/search/search-indexer-overview
  2. Create an indexer - https://learn.microsoft.com/en-us/azure/search/search-howto-create-indexers
  3. Schedule an indexer - https://learn.microsoft.com/en-us/azure/search/search-howto-schedule-indexers
  4. Run or reset an indexer - https://learn.microsoft.com/en-us/azure/search/search-howto-run-reset-indexers
  5. Define field mappings - https://learn.microsoft.com/en-us/azure/search/search-indexer-field-mappings
  6. Monitor indexer-based indexing (runs, errors) - https://learn.microsoft.com/en-us/azure/search/search-monitor-indexers
  7. Troubleshoot an indexer - https://learn.microsoft.com/en-us/azure/search/search-indexer-troubleshooting
  8. Data type map for indexers (mapping help in UI) - https://learn.microsoft.com/rest/api/searchservice/data-type-map-for-indexers-in-azure-search
  9. Index via portal wizards (guided ingestion) - https://learn.microsoft.com/en-us/azure/search/search-import-data-portal
  10. Push API (bulk indexing from app) - https://learn.microsoft.com/en-us/azure/search/tutorial-optimize-indexing-push-api

9. **Skillsets** - AI enrichment and integrated vectorization pipelines.
  1. What is a skillset? - https://learn.microsoft.com/en-us/azure/search/cognitive-search-working-with-skillsets
  2. Create a skillset (how-to) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-defining-skillset
  3. Attach a billable resource (AI Services / Foundry) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-attach-cognitive-services
  4. Debug sessions (inspect enriched docs, iterate) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-debug-session
    1. Debug a skillset (portal how-to) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-how-to-debug-skillset
  5. Enrichment cache (incremental enrichment) - https://learn.microsoft.com/en-us/azure/search/enrichment-cache-how-to-configure https://learn.microsoft.com/en-us/azure/search/enrichment-cache-how-to-manage
  6. Map skill outputs to index fields - https://learn.microsoft.com/en-us/azure/search/cognitive-search-output-field-mapping
  7. Define an index projection (one-to-many/chunk projections) - https://learn.microsoft.com/en-us/azure/search/search-how-to-define-index-projections
  8. Custom Web API skill - https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-interface
  9. GenAI Prompt skill (content generation) - https://learn.microsoft.com/en-us/azure/search/chat-completion-skill-example-usage
  10. Responsible AI best practices for GenAI Prompt skill - https://learn.microsoft.com/en-us/azure/search/responsible-ai-best-practices-genai-prompt-skill

10. **Knowledge Stores** - Persist enriched artifacts to Azure Storage for downstream analytics.
  1. What is a knowledge store? - https://learn.microsoft.com/en-us/azure/search/knowledge-store-concept-intro
  2. Create a knowledge store (portal) - https://learn.microsoft.com/en-us/azure/search/knowledge-store-create-portal
  3. Create a knowledge store (REST) - https://learn.microsoft.com/en-us/azure/search/knowledge-store-create-rest
  4. Knowledge store projections overview - https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-overview
  5. Shape data for projections - https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-shape
  6. Projection examples - https://learn.microsoft.com/en-us/azure/search/knowledge-store-projections-examples
  7. Connect knowledge store to Power BI - https://learn.microsoft.com/en-us/azure/search/knowledge-store-connect-power-bi

11. **Retrieval (Queries)** - Build and run full-text, vector, hybrid, and multimodal queries.
  1. Query overview (jumping-off point) - https://learn.microsoft.com/en-us/azure/search/search-query-overview
  2. Full-text queries
    1. Create a full-text query - https://learn.microsoft.com/en-us/azure/search/search-query-create
    2. Full-text search architecture - https://learn.microsoft.com/en-us/azure/search/search-lucene-query-architecture
    3. Filters and OData basics - https://learn.microsoft.com/en-us/azure/search/search-filters
    4. Normalize text for filters - https://learn.microsoft.com/en-us/azure/search/search-normalizers
    5. Faceted navigation - https://learn.microsoft.com/en-us/azure/search/search-faceted-navigation https://learn.microsoft.com/en-us/azure/search/search-faceted-navigation-examples
    6. Page, sort, and shape results ($top/$skip/$select/$orderby) - https://learn.microsoft.com/en-us/azure/search/search-pagination-page-layout
    7. Semantic answers (render @search.answers) - https://learn.microsoft.com/en-us/azure/search/semantic-answers
  3. Vector search
    1. Vector search overview - https://learn.microsoft.com/en-us/azure/search/vector-search-overview
    2. Create a vector query - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-query
    3. Filter a vector query (vectorFilterMode) - https://learn.microsoft.com/en-us/azure/search/vector-search-filters
    4. Use a multi-vector field - https://learn.microsoft.com/en-us/azure/search/vector-search-multi-vector-fields
  4. Hybrid search
    1. Hybrid search overview - https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview
    2. Create a hybrid query (RRF + tuning knobs) - https://learn.microsoft.com/en-us/azure/search/hybrid-search-how-to-query
  5. Multimodal search
    1. Multimodal search overview - https://learn.microsoft.com/en-us/azure/search/multimodal-search-overview
    2. Vectorize images and text (tutorial) - https://learn.microsoft.com/en-us/azure/search/tutorial-document-extraction-multimodal-embeddings

12. **Vectorization (Models & Vectorizers)** - Configure and validate vectorizers used for indexing/querying.
  1. Generate embeddings (concepts and patterns) - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-generate-embeddings
  2. Configure a vectorizer in an index - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-configure-vectorizer
  3. Vectorizers: Microsoft Foundry model catalog - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-machine-learning-ai-studio-catalog
  4. Vectorizers: Azure OpenAI - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-open-ai
  5. Vectorizers: Azure Vision - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-ai-services-vision
  6. Vectorizers: Custom Web API - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-custom-web-api
  7. Chunk documents (indexing-time chunking UX) - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents
  8. Use integrated vectorization - https://learn.microsoft.com/en-us/azure/search/search-how-to-integrated-vectorization
  9. Vector quotas and limits (size/optimization guidance) - https://learn.microsoft.com/en-us/azure/search/vector-search-index-size

13. **Relevance & Ranking** - Configure scoring, semantic ranking, and ranking diagnostics.
  1. Add a scoring profile - https://learn.microsoft.com/en-us/azure/search/index-add-scoring-profiles
  2. Semantic ranker overview - https://learn.microsoft.com/en-us/azure/search/semantic-search-overview
  3. Configure semantic ranker - https://learn.microsoft.com/en-us/azure/search/semantic-how-to-configure
  4. Add semantic ranking to queries - https://learn.microsoft.com/en-us/azure/search/semantic-how-to-query-request
  5. Vector ranking - https://learn.microsoft.com/en-us/azure/search/vector-search-ranking
  6. Hybrid ranking (RRF) - https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking

14. **Developer Tools** - Copy REST payloads, view API versions, and link to SDK samples.
  1. REST API reference hub (schemas and endpoints) - https://learn.microsoft.com/rest/api/searchservice/
  2. .NET SDK overview: Azure.Search.Documents - https://learn.microsoft.com/dotnet/api/overview/azure/search.documents-readme
  3. Samples (starting points) - https://learn.microsoft.com/en-us/azure/search/samples-dotnet

# Agentic Section
1. **Agentic Playground** - Chat-style UI to test agentic retrieval flows and inspect citations/activity.
  1. Agentic retrieval overview - https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview
  2. Get started (portal) - https://learn.microsoft.com/en-us/azure/search/get-started-portal-agentic-retrieval
  3. Get started (programmatic) - https://learn.microsoft.com/en-us/azure/search/search-get-started-agentic-retrieval

2. **Knowledge Sources** - Configure indexed and remote sources used by knowledge bases.
  1. Knowledge source overview - https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-overview
  2. Create an index for agentic retrieval - https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-index
  3. Create blob knowledge source - https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-blob
  4. Create OneLake knowledge source - https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-onelake
  5. Create remote SharePoint knowledge source - https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote
  6. Create Web knowledge source - https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-web
  7. Manage Web knowledge source access - https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-web-manage

3. **Knowledge Bases** - Define how retrieval runs and how answers are synthesized.
  1. Create a knowledge base - https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base
  2. Enable answer synthesis - https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-answer-synthesis
  3. Retrieval-augmented generation overview (patterns and guidance) - https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview

# Monitoring Section
1. **Diagnostics & Logs** - Configure diagnostic logging and inspect logs.
  1. Enable diagnostic logging - https://learn.microsoft.com/en-us/azure/search/search-monitor-enable-logging
  2. Visualize resource logs in Power BI - https://learn.microsoft.com/en-us/azure/search/search-monitor-logs-powerbi

2. **Query Monitoring** - Monitor query volumes, latency, and errors.
  1. Monitor query requests - https://learn.microsoft.com/en-us/azure/search/search-monitor-queries
  2. Monitor data (service metrics) - https://learn.microsoft.com/en-us/azure/search/monitor-azure-cognitive-search

3. **Indexer Monitoring** - Track ingestion health and investigate failures.
  1. Monitor indexer-based indexing - https://learn.microsoft.com/en-us/azure/search/search-monitor-indexers
  2. Troubleshoot indexer problems - https://learn.microsoft.com/en-us/azure/search/search-indexer-troubleshooting

4. **Performance Analysis** - Analyze and improve query performance.
  1. Analyze search performance - https://learn.microsoft.com/en-us/azure/search/search-performance-analysis
  2. Tips for better performance - https://learn.microsoft.com/en-us/azure/search/search-performance-tips