## GitHub Copilot Agent Prompt — Features.md editing rules

Purpose: instruct the local Copilot agent how to update `Features.md` for the Azure AI Search Explorer project.

Rules:
- Always keep `Features.md` strictly to one-line UI-focused feature entries that are required to build a portal-like application (no long descriptions).
- Use a multi-level hierarchical grouping (sections and subsections) to organize related features; prefer the TOC (Azure-AI-Search-TOC.md) as the canonical source of topics.
- Each feature line must be actionable from a UI perspective (what the portal must let the user do), not implementation details.
- When adding new entries, mirror structure in `Azure-AI-Search-TOC.md` by checking processed items (the assistant updates the TOC file when a doc is summarized by check marking the markdown checkbox next to the link).
- Iterate in small batches: fetch a few TOC links → update `Features.md` (one-line entries) → mark TOC entries checked → update the todo list via the project todo tool.
- Do not ask for confirmation before continuing; proceed until the whole TOC is covered or the user interrupts.
- When requested, add official doc links or examples, but do not place long URLs or doc text in `Features.md` by default.
- Preserve existing file formatting and headings where possible; minimize unrelated edits.
- Capture links for each feature listed in `Features.md` after the one-line description
