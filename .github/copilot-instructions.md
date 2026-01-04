# Azure AI Search Explorer - Copilot Instructions

## Tech Stack
- **Backend**: ASP.NET Core 8.0 (Web API)
- **Frontend**: React 18+ with TypeScript, built using Vite
- **Desktop Wrapper**: Electron (using Electron.NET or standard Electron with child process)
- **Styling**: CSS Modules or standard CSS (matching the prototype design)

## Coding Guidelines
- **General**:
  - Use modern syntax and features for C# and TypeScript.
  - Follow the "VS Code / Azure Portal" design philosophy: flat, clean, compact, dark mode first.
  - Ensure cross-platform compatibility (Windows, macOS, Linux).

- **Backend (C#)**:
  - Use controller-based APIs as appropriate for clarity.
  - Use `Azure.Search.Documents` SDK for Azure AI Search interactions.
  - Keep the backend stateless where possible.

- **Frontend (React/TypeScript)**:
  - Use Functional Components and Hooks.
  - Use strict type checking.
  - Avoid class-based components.
  - Use `fetch` or `axios` for API calls to the backend.

- **Electron**:
  - Ensure secure communication between the renderer and the main process/backend.
  - Handle window management and native menus appropriately.

## Project Structure
- `/backend`: ASP.NET Core Web API project.
- `/frontend`: React + Vite project.
- `/electron`: Electron main process scripts (if using manual setup).

## Design Specs
- Refer to `UI-design.md` for detailed UI specifications, color palettes, and layout structures.

## Running and Publishing

### Development
- **Install Dependencies**: `npm run install:all`
- **Start App**: `npm run dev`
  - This runs the Backend (ASP.NET Core), Frontend (Vite), and Electron shell concurrently.

### Publishing
- **Build Commands**:
  - **Windows**: `npm run build:win`
  - **macOS**: `npm run build:mac`
  - **Linux**: `npm run build:linux`
  - **Generic**: `npm run build` (Requires manual backend configuration for self-contained builds)
  
  These scripts automatically:
    1. Clean previous builds.
    2. Build the React Frontend.
    3. Publish the .NET Backend (Self-contained for the target OS).
    4. Copy frontend assets to Electron.
    5. Package the Electron app for the target OS.

- **Output**: The packaged application will be in `electron/dist`.
