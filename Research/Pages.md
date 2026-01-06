# Pages

Pages in Azure AI Search Explorer application

1. **Add Connection** - Connect to an Azure AI Search service using RBAC authentication.
  1. Connect to a Azure AI Search service using Azure AD
  2. Connect using Endpoint and Admin API Key
  3. Connect using Managed Identity (Azure VM, App Service, etc.)

# Classic Section
1. **Service (Connection & Settings)** - Connect to a search service and manage service-level settings used by all other pages.
  1. Connect to a search service (RBAC-first) - https://learn.microsoft.com/en-us/azure/search/search-get-started-rbac
  2. Service configuration and management (portal concepts) - https://learn.microsoft.com/en-us/azure/search/search-manage
  4. Enable diagnostic logging (Log Analytics / Storage / Event Hub) - https://learn.microsoft.com/en-us/azure/search/search-monitor-enable-logging
  5. Security overview (high-level controls surfaced in UI) - https://learn.microsoft.com/en-us/azure/search/search-security-overview

2. **Playground (Search Explorer)** - Interactive query workbench for exploring index behavior.
  1. Search Explorer basics (query + results preview) - https://learn.microsoft.com/en-us/azure/search/search-explorer
  2. Query syntax modes (Simple and Lucene) - https://learn.microsoft.com/en-us/azure/search/query-simple-syntax https://learn.microsoft.com/en-us/azure/search/query-lucene-syntax

3. **Indexes** - Create, view, edit, and manage index schemas.
  1. Create a search index - https://learn.microsoft.com/en-us/azure/search/search-how-to-create-search-index
  2. Create a vector index - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index
  3. Manage an index (schema updates, settings) - https://learn.microsoft.com/en-us/azure/search/search-how-to-manage-index
  4. Update or rebuild an index - https://learn.microsoft.com/en-us/azure/search/search-howto-reindex
  5. Model complex types (UI guidance for schema design) - https://learn.microsoft.com/en-us/azure/search/search-howto-complex-data-types
  6. Data types reference (field type help) - https://learn.microsoft.com/rest/api/searchservice/supported-data-types
   
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

9.  **Skillsets** - AI enrichment and integrated vectorization pipelines.
  1.  What is a skillset? - https://learn.microsoft.com/en-us/azure/search/cognitive-search-working-with-skillsets
  2.  Create a skillset (how-to) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-defining-skillset
  3.  Attach a billable resource (AI Services / Foundry) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-attach-cognitive-services
  4.  Debug sessions (inspect enriched docs, iterate) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-debug-session
    1.  Debug a skillset (portal how-to) - https://learn.microsoft.com/en-us/azure/search/cognitive-search-how-to-debug-skillset
  5.  Enrichment cache (incremental enrichment) - https://learn.microsoft.com/en-us/azure/search/enrichment-cache-how-to-configure https://learn.microsoft.com/en-us/azure/search/enrichment-cache-how-to-manage
  6.  Map skill outputs to index fields - https://learn.microsoft.com/en-us/azure/search/cognitive-search-output-field-mapping
  7.  Define an index projection (one-to-many/chunk projections) - https://learn.microsoft.com/en-us/azure/search/search-how-to-define-index-projections
  8.  Custom Web API skill - https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-interface
  9.  GenAI Prompt skill (content generation) - https://learn.microsoft.com/en-us/azure/search/chat-completion-skill-example-usage
  10. Responsible AI best practices for GenAI Prompt skill - https://learn.microsoft.com/en-us/azure/search/responsible-ai-best-practices-genai-prompt-skill

10. **Knowledge Stores** - Persist enriched artifacts to Azure Storage for downstream analytics.
  11. What is a knowledge store? - https://learn.microsoft.com/en-us/azure/search/knowledge-store-concept-intro
  12. Create a knowledge store (portal) - https://learn.microsoft.com/en-us/azure/search/knowledge-store-create-portal
  13. Create a knowledge store (REST) - https://learn.microsoft.com/en-us/azure/search/knowledge-store-create-rest
  14. Knowledge store projections overview - https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-overview
  15. Shape data for projections - https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-shape
  16. Projection examples - https://learn.microsoft.com/en-us/azure/search/knowledge-store-projections-examples
  17. Connect knowledge store to Power BI - https://learn.microsoft.com/en-us/azure/search/knowledge-store-connect-power-bi

11. **Retrieval (Queries)** - Build and run full-text, vector, hybrid, and multimodal queries.
  12. Query overview (jumping-off point) - https://learn.microsoft.com/en-us/azure/search/search-query-overview
  13. Full-text queries
    14. Create a full-text query - https://learn.microsoft.com/en-us/azure/search/search-query-create
    15. Full-text search architecture - https://learn.microsoft.com/en-us/azure/search/search-lucene-query-architecture
    16. Filters and OData basics - https://learn.microsoft.com/en-us/azure/search/search-filters
    17. Normalize text for filters - https://learn.microsoft.com/en-us/azure/search/search-normalizers
    18. Faceted navigation - https://learn.microsoft.com/en-us/azure/search/search-faceted-navigation https://learn.microsoft.com/en-us/azure/search/search-faceted-navigation-examples
    19. Page, sort, and shape results ($top/$skip/$select/$orderby) - https://learn.microsoft.com/en-us/azure/search/search-pagination-page-layout
    20. Semantic answers (render @search.answers) - https://learn.microsoft.com/en-us/azure/search/semantic-answers
  14. Vector search
    15. Vector search overview - https://learn.microsoft.com/en-us/azure/search/vector-search-overview
    16. Create a vector query - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-query
    17. Filter a vector query (vectorFilterMode) - https://learn.microsoft.com/en-us/azure/search/vector-search-filters
    18. Use a multi-vector field - https://learn.microsoft.com/en-us/azure/search/vector-search-multi-vector-fields
  15. Hybrid search
    16. Hybrid search overview - https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview
    17. Create a hybrid query (RRF + tuning knobs) - https://learn.microsoft.com/en-us/azure/search/hybrid-search-how-to-query
  16. Multimodal search
    17. Multimodal search overview - https://learn.microsoft.com/en-us/azure/search/multimodal-search-overview
    18. Vectorize images and text (tutorial) - https://learn.microsoft.com/en-us/azure/search/tutorial-document-extraction-multimodal-embeddings

12. **Vectorization (Models & Vectorizers)** - Configure and validate vectorizers used for indexing/querying.
  13. Generate embeddings (concepts and patterns) - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-generate-embeddings
  14. Configure a vectorizer in an index - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-configure-vectorizer
  15. Vectorizers: Microsoft Foundry model catalog - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-machine-learning-ai-studio-catalog
  16. Vectorizers: Azure OpenAI - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-azure-open-ai
  17. Vectorizers: Azure Vision - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-ai-services-vision
  18. Vectorizers: Custom Web API - https://learn.microsoft.com/en-us/azure/search/vector-search-vectorizer-custom-web-api
  19. Chunk documents (indexing-time chunking UX) - https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents
  20. Use integrated vectorization - https://learn.microsoft.com/en-us/azure/search/search-how-to-integrated-vectorization
  21. Vector quotas and limits (size/optimization guidance) - https://learn.microsoft.com/en-us/azure/search/vector-search-index-size

13. **Relevance & Ranking** - Configure scoring, semantic ranking, and ranking diagnostics.
  14. Add a scoring profile - https://learn.microsoft.com/en-us/azure/search/index-add-scoring-profiles
  15. Semantic ranker overview - https://learn.microsoft.com/en-us/azure/search/semantic-search-overview
  16. Configure semantic ranker - https://learn.microsoft.com/en-us/azure/search/semantic-how-to-configure
  17. Add semantic ranking to queries - https://learn.microsoft.com/en-us/azure/search/semantic-how-to-query-request
  18. Vector ranking - https://learn.microsoft.com/en-us/azure/search/vector-search-ranking
  19. Hybrid ranking (RRF) - https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking

14. **Developer Tools** - Copy REST payloads, view API versions, and link to SDK samples.
  15. REST API reference hub (schemas and endpoints) - https://learn.microsoft.com/rest/api/searchservice/
  16. .NET SDK overview: Azure.Search.Documents - https://learn.microsoft.com/dotnet/api/overview/azure/search.documents-readme
  17. Samples (starting points) - https://learn.microsoft.com/en-us/azure/search/samples-dotnet

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