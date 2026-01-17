# Azure AI Search Explorer

Azure AI Search Explorer is a desktop UI for exploring, validating, and operating Azure AI Search services. It is designed for day‑to‑day work: inspecting service health, managing indexes and ingestion pipelines, and running both classic and agentic retrieval workflows.


> Azure AI Search is an expensive resource to keep running for development and testing. If this project helps you, please consider sponsoring to offset Azure subscription costs.

## Download

Download the latest production build from the Releases page and run the installer for your OS.

## Features

- **API-first coverage** - If a capability is available via Azure AI Search REST APIs, it is targeted for full support in the app.
- **Connection profiles** - Connect to multiple Azure AI Search services using Entra ID, API Key, or Managed Identity.
- **Service overview** - Review service stats, quotas, and limits at a glance.
- **Classic Retrieval** - Run classic queries and manage documents with upload, edit, delete, reset, and export workflows.
- **Classic Visual** - Visualize indexer pipelines and relationships across data sources, skillsets, indexes, aliases, and synonym maps.
- **Indexes** - Create, update, inspect, and manage index definitions.
- **Indexers** - Configure and manage indexer pipelines.
- **Data Sources** - Create and manage data source connections.
- **Skillsets** - Build and edit skillsets with structured tabs and JSON tooling.
- **Aliases** - Manage alias mappings for index routing.
- **Synonym Maps** - Create and maintain synonym maps for relevance tuning.
- **Agentic Retrieval** - Explore agentic retrieval workflows.
- **Knowledge Sources** - Create and manage agentic knowledge source definitions.
- **Knowledge Bases** - Build and manage knowledge bases for retrieval.

## Why This App Exists (Even with Azure Portal)

Azure Portal is a great starting point, but it does not expose the full surface area of Azure AI Search. Many capabilities are only available through the APIs, and day‑to‑day operations can feel fragmented. Azure AI Search Explorer was created to fill those gaps and make the service easier to understand and operate.

- **Full API coverage** - Surface features that are not fully available in the portal.
- **Missing portal features** - Manage synonym maps, autocomplete, document upload/download/edit, different data source types, mostly JSON and advanced configurations for each asset type.
- **Clarity for new users** - The Classic Visual experience shows how data sources, indexers, skillsets, and indexes flow together so you can see what is happening at a glance.

## Screenshots

Add a product screenshot or walkthrough image here.

![Azure AI Search Explorer Screenshot](assets/screenshots/overview.png)

## Local Development

If you need to run locally for development:

- Install dependencies: `npm run install:all`
- Start the app: `npm run dev`

This runs the Backend (ASP.NET Core), Frontend (Vite), and Electron shell together.