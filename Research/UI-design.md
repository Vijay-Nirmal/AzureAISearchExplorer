# UI Design Specification - Azure AI Search Explorer

## 1. Design Philosophy
*   **Modern**: Uses a flat, clean aesthetic inspired by VS Code and Azure Portal.
*   **Compact**: High information density suitable for power users and developers. Minimized padding and margins where appropriate.
*   **Cross-Platform**: Responsive layout using Flexbox, suitable for wrapping in Electron/Tauri.
*   **Dark Mode First**: Default dark theme to reduce eye strain during long development sessions.

## 2. Color Palette (Dark Theme)
| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--bg-color` | `#1e1e1e` | Main application background |
| `--sidebar-bg` | `#252526` | Sidebar background |
| `--text-color` | `#cccccc` | Primary text color |
| `--accent-color` | `#0078d4` | Primary buttons, active states, focus rings |
| `--border-color` | `#3e3e42` | Borders, separators |
| `--hover-color` | `#2a2d2e` | Hover states for list items and buttons |
| `--active-color` | `#37373d` | Active/Selected states |
| `--header-height` | `40px` | Fixed height for headers |
| `--sidebar-width` | `250px` | Fixed width for sidebar |
| `--tab-height` | `35px` | Fixed height for the tab bar |

### Color Palette (Light Theme)
| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--bg-color` | `#ffffff` | Main application background |
| `--sidebar-bg` | `#f3f3f3` | Sidebar background |
| `--text-color` | `#333333` | Primary text color |
| `--accent-color` | `#0078d4` | Primary buttons, active states, focus rings |
| `--border-color` | `#e1e1e1` | Borders, separators |
| `--hover-color` | `#e8e8e8` | Hover states for list items and buttons |
| `--active-color` | `#ffffff` | Active/Selected states |

## 3. Typography
*   **Font Family**: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` (System UI fonts).
*   **Base Size**: `13px` for standard text.
*   **Monospace**: `'Consolas', 'Courier New', monospace` for code blocks, logs, and JSON previews.
*   **Headers**: `16px` (Page Titles), `14px` (Card Titles), `11px` (Section Headers/Uppercase).

## 4. Layout Structure
The application uses a classic **Sidebar + Main Content** layout.

### Sidebar (`#sidebar`)
*   **Width**: Fixed 250px.
*   **Header**: Contains the **Resource Switcher**.
*   **Body**: Scrollable list of navigation items grouped by category (Classic, Agentic, Monitoring).
*   **Footer**: Fixed area for global **Settings** and **Logs** toggle.

### Main Content (`#main`)
*   **Header**: Displays current page title and page-level actions (Refresh, Save).
*   **Content Area**: Scrollable container for the active page view.
*   **Pages**: Individual views that are toggled based on navigation.
*   **Bottom Panel**: Collapsible panel for logs, output, and errors.

## 5. Navigation System
*   **Grouping**: Navigation items are grouped into logical sections with uppercase, subtle headers.
*   **Icons**: Each navigation item has a distinct icon (FontAwesome) for quick visual recognition.
*   **Active State**: Highlighted with a background color and a left border accent.
*   **Resource Switcher**: A dropdown at the top of the sidebar allows switching between different Azure AI Search services (e.g., Dev, Prod).
*   **Tab Bar**: Located below the header.
    *   **Active Tab**: Light background (in dark mode), top border accent (`2px solid #0078d4`).
    *   **Inactive Tab**: Darker background, gray text.
    *   **Close Button**: Appears on hover or always visible, circular hover effect.

## 6. Component Library

### Cards
*   Container for related content.
*   Background: `#252526`.
*   Border: 1px solid `#3e3e42`.
*   Header: Bordered bottom with title.
*   **Responsive Grid**: Cards are arranged in a grid with `minmax(450px, 1fr)` to adapt to screen width.

### Forms
*   **Inputs/Selects**: Dark background (`#3c3c3c`), light text, 1px border. Focus state uses accent color.
*   **Labels**: Subtle gray (`#aaa`) placed above inputs.

### Data Grids
*   Simple table layout.
*   **Headers**: Left-aligned, gray text.
*   **Rows**: Bottom border separator.
*   **Status Badges**: Pill-shaped indicators for status (Green for Success, Yellow for Warning).

### Bottom Panel (Logs)
*   **Height**: Fixed `180px` when open.
*   **Header**: Uppercase, small font, contains actions (Clear, Close).
*   **Content**: Monospace font.
*   **Log Levels**:
    *   Info: Standard text color.
    *   Warning: `#cca700` (Yellow/Gold).
    *   Error: `#f48771` (Soft Red).

### Buttons
*   **Primary**: Blue background (`#0078d4`), white text.
*   **Secondary**: Dark gray background, white text.
*   **Hover**: Slightly lighter shade.
*   **Icon Buttons**: Transparent background, used in headers and panels.

## 7. New Features & Enhancements
*   **Resource Switcher**: Located at the top left. Enables multi-tenant/multi-environment management within a single window.
*   **Settings Page**: Accessible from the sidebar footer. Includes:
    *   Theme selection (Dark/Light/High Contrast).
    *   Default API Version.
    *   Telemetry preferences.
*   **Icons**: Added to all navigation items to improve usability and aesthetics.
*   **Multi-Tab Interface**: Allows users to open multiple pages simultaneously. Tabs are displayed below the header, similar to VS Code editors.
*   **Theme Toggle**: A quick toggle button in the header to switch between Light and Dark modes instantly.
*   **Breadcrumbs**: Navigation path displayed in the header (e.g., Classic > Service) to provide context.
*   **Responsive Grid Layout**: Pages now use a responsive grid system to display cards side-by-side on larger screens, maximizing space utilization without feeling cramped.
*   **Bottom Panel**: A collapsible panel at the bottom of the main view for displaying logs, errors, and command outputs. Controlled via the Sidebar Footer.
