# Azure AI Search Explorer

Azure AI Search Explorer is a lightweight GUI for exploring and managing an Azure AI Search service.
It helps you create and inspect indexes, ingestion pipelines (data sources, indexers, skillsets), and run queries (full-text, vector, hybrid).
Under the hood it uses Azure AI Search REST APIs, making it useful for learning, debugging, and validating configurations.

## Features

- **Connection Management**: Securely connect to multiple Azure AI Search services using Azure AD (RBAC), API Keys, or Managed Identities.
- **Service Overview**: View comprehensive service statistics, quotas, and limits.
  - **Management Plane Integration**: Inspect service properties (SKU, Location, Tags) and scale Replicas/Partitions directly from the UI.

## Running Instructions

- Install dependencies: `npm run install:all`
- Start the app in development mode: `npm run dev`
  This will start the Backend (ASP.NET Core), Frontend (Vite), and Electron shell concurrently.

## Publishing Instructions

- Windows: `npm run build:win`
- macOS: `npm run build:mac`
- Linux: `npm run build:linux`

Artifacts will be in `electron/dist` folder.