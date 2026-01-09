---
name: Frontend Instructions
description: This file provides instructions and guidelines for frontend development using React and TypeScript.
applyTo: "frontend/**"
---
# Frontend Development Instructions

## Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules (`*.module.css`) with standard CSS variables
- **Icons**: FontAwesome (via CDN in `index.html`)

## Design Philosophy
- **Theme**: Dark mode first, available in light mode as well. Use CSS variables defined in `src/styles/variables.css`.
- **Layout**: VS Code-like layout with Sidebar, Header, Tab Bar, and Bottom Panel.
- **Responsiveness**: Use Flexbox and Grid.
- **Reusable Components**: Create and use reusable components for common UI elements.
- **Unified Styling**: Use global CSS variables for colors, spacing, and typography.

## Component Guidelines
- **Common Components**: Always use the reusable components in `src/components/common/` instead of raw HTML elements where possible.
  - `Button`: Use for all clickable actions. Variants: `primary`, `secondary`, `icon`.
  - `Input`, `Select`: Use for form elements.
  - `Card`: Use as a container for page content.
  - `Label`: Use for form labels.
  - `Modal`: Use for popup dialogs.
  - `Breadcrumbs`: Use for navigation paths.
  - `TruncatedTextCell`: Use for table cells with potential overflow text.
  - `JsonViewerModal`: Use for viewing JSON data with syntax highlighting (uses Monaco Editor).
  - `InfoIcon`: small 'i' icon to display a small 'i' icon near all the field properties to explain about that property
  - `SelectWithDescription`: dropdown that supports showing a description alongside the value
- **New Components**:
  - **Reusability**: If a UI element is generic or used in multiple places, create it as a reusable component in `src/components/common/`. If it doesn't exist, create it.
  - Use CSS Modules for styling.
  - Import variables from `src/styles/variables.css` if needed (though they are global).

## State Management
- **LayoutContext**: Use `useLayout()` hook to access:
  - `tabs`, `activeTabId`, `openTab`, `closeTab` for navigation.
  - `theme`, `toggleTheme` for theme switching.
  - `isBottomPanelOpen`, `toggleBottomPanel` for logs.

## Styling Rules
- **Variables**: Use `--bg-color`, `--text-color`, `--accent-color`, etc.
- **Hex Values**: Do not hardcode hex values. If a needed color is missing, define a new variable in `src/styles/variables.css` and use that.
- **Spacing**: Use standard spacing (4px, 8px, 16px).
- **Page Layout**: All main page views (e.g. Lists, Overviews) should have a padding of `20px` around the main container to ensure consistent ease. Tool-like pages (Builders, Explorers) may use full width/height if needed.
- **Typography**: Use system fonts defined in `--font-family`.

## File Structure
- `src/components/common/`: Generic UI components.
- `src/components/layout/`: App shell components (Sidebar, Header, etc.).
- `src/components/pages/`: Page-specific components.
- `src/context/`: React Context definitions.
- `src/styles/`: Global styles and variables.

## Constants and Data Files
- **Location**: `src/data/constants/`
- **Guidelines**: 
  - Do not use a single large constants file. 
  - Split constants into separate JSON files (e.g., `dataTypes.json`, `lexicalAnalyzer.json`, `vectorEncodingFormat.json`).
  - Prefer **one JSON per domain** that includes both the value and its description (when needed).
    - Good: `dataTypes.json` as `[{ "value": "Edm.String", "description": "Text" }]`
    - Good: `lexicalAnalyzer.json` as `[{ "value": "en.lucene", "description": "Lucene analyzer for English." }]`
    - Good: `vectorEncodingFormat.json` as `[{ "value": "packedBit", "description": "..." }]`
    - Avoid: separate files like `dataTypes.json` + `dataTypeDescriptions.json` for the same concept.

## Config-driven editors ($ref reuse)

Some UI editors are generated from config JSON under `src/data/constants/config/` (see `src/components/common/configDriven/`).

- **Type reuse**: `schema.types[]` can contain `{ "$ref": "..." }` entries pointing to separate type definition JSON files.
- **Enum reuse**: For `enum` / `enumArray` fields, `options` can be either inline or `{ "$ref": "..." }` (Prefferable is $ref).
  - Use `$ref` when the same option set is shared across multiple types.

### Folder conventions

- Group related config under a domain folder `src/data/constants/config/<Domain>` (e.g. `src/data/constants/config/TokenFilter/`).
- Put reusable type definitions in `.../<Domain>/types/`.
- Put reusable enum option sets in `.../<Domain>/enums/`.
- For $ref paths, Preferred: domain-relative paths like `TokenFilter/types/MyType.json` or `TokenFilter/enums/MyEnum.json`.

## Running the App
- To start the frontend independently: `npm run start:frontend` (from the root directory)
- To build the frontend: `npm run build:frontend` (from the root directory)
- **Validation**: Always run `npm run build:frontend` after making changes to ensure the application builds successfully.

## API Communication
- **Location**: `src/services/`
- **Usage**: Use `apiClient.ts` for all backend calls. Create feature-specific service modules (e.g., `logService.ts`) that utilize it.
