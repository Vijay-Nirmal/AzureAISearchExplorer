# Indexes Page Design

## Overview
The Indexes page is the central hub for managing search indexes. It allows users to:
1.  **List** existing indexes with their metadata (document count, size).
2.  **Create** new indexes (Standard and Vector).
3.  **Edit** existing index schemas (add fields, modify settings).
4.  **Delete** indexes.
5.  **Query** indexes using a rich "Index Explorer" interface.

## 1. Index List View
**Goal:** Display a summary of all indexes in the service.

**UI Elements:**
*   **Toolbar:**
    *   `+ Create Index` (Button)
    *   `Refresh` (Button)
*   **Data Grid:**
    *   Columns: Name, Document Count, Storage Size, Vector Index (Yes/No), Created Date, Last Updated.
    *   Actions (per row):
        *   `Query` (Opens Index Explorer)
        *   `Edit` (Opens Index Builder)
        *   `Delete` (confirmation dialog)

## 2. Index Explorer (Query)
**Goal:** Provide a powerful, user-friendly interface to query indexes without memorizing JSON syntax, while still supporting advanced users.

**UI Elements:**
*   **Header:**
    *   **Breadcrumbs:** `Indexes / <Index Name> / Explorer`
    *   **Back Button:** Returns to Index List.
*   **Query Bar:**
    *   `Search Text` (Input): The main `search` parameter.
    *   `Query Type` (Dropdown): Simple (Default) vs. Full (Lucene).
    *   `Search Mode` (Dropdown): Any vs. All.
    *   `Search` (Button): Executes the query.
*   **Advanced Parameters (Collapsible/Side Panel):**
    *   `$filter` (Input): OData filter expression.
    *   `$select` (Input): Comma-separated list of fields to retrieve.
    *   `$orderby` (Input): Sort expression (e.g., `Rating desc`).
    *   `$top` (Number): Page size.
    *   `$skip` (Number): Offset.
    *   `$count` (Checkbox): Include total count.
*   **Result Viewer:**
    *   **Tabs:**
        *   `JSON`: Raw JSON response with syntax highlighting. Shows the full `value` array.
        *   `Table`: flattened grid view.
            *   **Column Management:** User can define columns using JSONPath (e.g., `$.address.city`) or simple dot notation (`address.city`).
            *   **Defaults:** Auto-flatten top-level fields.
*   **Helpers:**
    *   **Syntax Cheatsheet:** Popover or side section showing examples (e.g., `*`, `~`, `^`, `regex`).
    *   **Field Picker:** Quick way to insert field names into Filter/Select inputs.

## 3. Index Builder (Create/Edit)
**Goal:** A comprehensive editor for index indexing policies, fields, and vector configurations.

**UI Structure:**
*   **Header:**
    *   **Breadcrumbs:** `Indexes / <Index Name> / Edit` or `Indexes / Create New`
    *   **Actions:** `Save`, `Discard`, `JSON View` (Toggle).
*   **Tabs:** `Fields`, `Vector Search`, `Suggesters`, `Scoring Profiles`, `Analyzers`, `CORS`, `Semantic Ranking`.

### 3.1. Fields Tab
*   **Grid Layout:**
    *   **Name:** Input.
    *   **Type:** Dropdown (`Edm.String`, `Edm.Int32`, `Edm.Boolean`, `Collection(Edm.String)`, `Collection(Edm.Single)` [Vector], `Edm.ComplexType`, etc.).
    *   **Attributes:** Checkboxes for:
        *   `Key` (Only one, Edm.String).
        *   `Retrievable` (Hidden?).
        *   `Filterable`
        *   `Sortable`
        *   `Facetable`
        *   `Searchable` (Full-text).
    *   **Analyzer:** Dropdown (e.g., `standard.lucene`, `en.microsoft`).
    *   **Vector Dimensions:** Number input (only for Vector types).
    *   **Vector Profile:** Dropdown (linking to Vector Search tab).
    *   **Actions:** Add Field, Delete Field, Move Up/Down.
*   **Complex Types:**
    *   Visualized as a nested grid or tree structure to manage sub-fields.

### 3.2. Vector Search Tab
*   **Algorithms:** List of HNSW / ExhaustiveKnn definitions.
    *   Properties: `m`, `efConstruction`, `efSearch`, `metric` (cosine, euclidean, dotProduct).
*   **Profiles:** Map an algorithm to a compression method and vectorizer (if applicable).
*   **Compressions:** Scalar or Binary quantization settings.

### 3.3 Suggesters Tab
*   **Grid:**
    *   **Name:** Input.
    *   **Source Fields:** Multi-select dropdown of fields.
    *   **Mode:** Always `standard` currently.

### 3.4 CORS Tab
*   **Allowed Origins:** List of strings (e.g., `http://localhost:3000`, `*`).
*   **Max Age (Seconds):** Number input.

### 3.5 Scoring Profiles
*   **Profiles List:** Manage named scoring profiles.
*   **Text Weights:** Boost specific fields.
*   **Functions:** Distance, freshness, magnitude, tag boosting.

### 3.6 JSON View
*   Read-only (or editable) JSON representation of the entire index definition for power users who prefer pasting configs.
