# Add/Edit Connection Page Design

## Overview
The **Add Connection** page allows users to configure a connection to an Azure AI Search service. It supports multiple authentication strategies to accommodate different security requirements (RBAC, Keys, Managed Identity). This page is also used for **Editing** existing connection details.

## Design Philosophy
*   **Modal/Page Hybrid**: While it functions like a dialog, it will be rendered as a full tab/page within the main content area to maintain the "VS Code" feel and allow for deep linking or persistent state.
*   **Clean & Focused**: The UI focuses solely on the connection parameters.
*   **Validation**: Immediate feedback on connection success/failure.

## UI Structure

### Header
*   **Title**: "Add Connection" or "Edit Connection: [Service Name]"
*   **Actions**:
    *   `Save` (Primary Button)
    *   `Test Connection` (Secondary Button)
    *   `Cancel` (Button)

### Content Area
The content is divided into authentication types using a tabs.

#### 1. Connection Type Selector
*   **Label**: "Authentication Method"
*   **Options**:
    *   `Azure Active Directory (RBAC)` (Default/Recommended)
    *   `API Key` (Legacy/Quick Start)
    *   `Managed Identity` (Azure Environment)

#### 2. Form Fields (Dynamic based on selection)

**A. Azure Active Directory (RBAC)**
*   **Endpoint URL**: `https://[service-name].search.windows.net`
*   **Tenant ID**: (Optional, auto-detect or manual override)
*   **Client ID**: (Optional, for specific app registrations)
*   **Note**: Displays a message that the user will be prompted to sign in via the system browser or device code flow.

**B. API Key**
*   **Endpoint URL**: `https://[service-name].search.windows.net`
*   **Admin Key**: `****************` (Masked input with toggle visibility)
*   **Warning**: "Admin keys provide full access. Consider using RBAC for better security."

**C. Managed Identity**
*   **Endpoint URL**: `https://[service-name].search.windows.net`
*   **Identity Type**:
    *   `System Assigned`
    *   `User Assigned` (If selected, show Client ID field)
*   **Client ID**: (Required only for User Assigned)

#### 3. Display Options (Common)
*   **Alias/Name**: Friendly name for the sidebar (e.g., "Production Search", "Dev Instance"). Defaults to service name from Endpoint.
*   **Group/Environment**: (Optional) Tag to group connections in the sidebar (e.g., "Development", "Staging").

## Sidebar Integration
To facilitate quick management of connections, the sidebar's Resource Switcher area will include:
*   **Edit Icon**: A pencil icon placed next to the resource dropdown. Clicking this opens the current connection in **Edit Mode**.
*   **Delete Icon**: A trash can icon placed next to the resource dropdown. Clicking this prompts for confirmation to remove the connection.

## Interaction Flow
1.  **Entry**:
    *   **Add**: User selects "+ Add New Service" from the Resource Switcher dropdown.
    *   **Edit**: User clicks the "Edit" icon next to the dropdown.
2.  **Input**: User selects Auth Method and fills fields.
3.  **Test**: User clicks "Test Connection".
    *   *Loading*: Spinner appears.
    *   *Success*: Green checkmark, "Successfully connected to [Service Name]".
    *   *Failure*: Red X, error message details (e.g., "401 Unauthorized", "DNS not found").
4.  **Save**: User clicks "Save".
    *   Connection is saved to local storage/settings.
    *   App switches context to the new connection immediately.
    *   Tab closes (optional) or redirects to "Service Overview".

## Edit Mode
*   Pre-fills all fields with existing data.
*   "Endpoint URL" might be read-only or editable with a warning.
*   "Save" updates the existing record.

## JSON Model
```json
{
  "id": "uuid",
  "name": "My Search Service",
  "endpoint": "https://my-search.search.windows.net",
  "authType": "AzureAD" | "ApiKey" | "ManagedIdentity",
  "apiKey": "...", // Null if not ApiKey
  "tenantId": "...",
  "clientId": "...", // For User Assigned MI or specific AD App
  "managedIdentityType": "System" | "User"
}
```
