# Config-Driven Forms (common/configDriven)

This folder contains a small, reusable “config-driven form” system.

The goal: generate consistent UI for rapidly-changing Azure Search shapes from JSON config (no code changes when fields/types evolve), while keeping the page/tab code minimal.

## What you build

You create a JSON schema (see example: `src/data/constants/config/tokenFilterEditorConfig.json`) that describes:

- The **entity** you’re editing (title, discriminator field, name field)
- A set of **common fields** shared across all types (typically `name` and `@odata.type`)
- A list of **types**, each with its own fields and optional description

The UI renders a form for a single object using:

- `InfoIcon` for tooltips
- `SelectWithDescription` for enums and type selection

## Schema structure

A config JSON should match this shape:

```json
{
  "entity": {
    "title": "Token Filters",
    "description": "The token filters for the index.",
    "discriminatorKey": "@odata.type",
    "nameKey": "name"
  },
  "commonFields": [
    { "key": "name", "label": "Name", "type": "string", "required": true },
    { "key": "@odata.type", "label": "Type", "type": "discriminator", "required": true }
  ],
  "types": [
    {
      "discriminatorValue": "#Microsoft.Azure.Search.AsciiFoldingTokenFilter",
      "label": "AsciiFoldingTokenFilter",
      "description": "…",
      "fields": [
        { "key": "preserveOriginal", "label": "Preserve Original", "type": "boolean", "default": false }
      ]
    }
  ]
}
```

### `$ref` support (reusability)

To keep schemas small and reuse definitions across entities/types:

- `types[]` entries can be either inline type definitions or `{ "$ref": "..." }` pointing to a separate JSON file containing a type definition.
- `enum` / `enumArray` field `options` can be either inline arrays or `{ "$ref": "..." }` pointing to a JSON file containing an array of options.

Example `$ref` usage:

```json
{
  "types": [
    { "$ref": "TokenFilter/types/AsciiFoldingTokenFilter.json" }
  ]
}
```

### `entity`

- `title`: UI title used by pages/tabs.
- `description`: shown as a tooltip in the tab header.
- `discriminatorKey`: which property selects the “type” (usually `@odata.type`).
- `nameKey`: which property is the primary name field (usually `name`).

### `commonFields`

Fields always shown for every object, regardless of type.

Typical pattern:
- `name` (`type: "string"`)
- `@odata.type` (`type: "discriminator"`) – drives which type-specific fields are rendered.

### `types[]`

Each entry describes one concrete discriminator value.

- `discriminatorValue`: the exact value stored in the object (e.g. `#Microsoft.Azure.Search.EdgeNGramTokenFilterV2`).
- `label`: user-friendly name displayed in the UI.
- `description`: shows in the type dropdown and as a callout in the modal.
- `fields`: the fields for this specific type.

## Supported field types (current)

These are implemented today:

- `string`
  - Renders an `Input`.
  - Supports validation: `required`, `maxLength`, `pattern`.
- `number`
  - Renders an `Input type="number"`.
  - Supports: `min`, `max`, `default`.
- `boolean`
  - Renders a checkbox.
  - Supports: `default`.
- `enum`
  - Renders a `SelectWithDescription`.
  - Requires `options: [{ value, label?, description? }]` or `options: { "$ref": "..." }`.
  - Supports: `default`.
- `stringArray`
  - Renders an “Add value” input + list of items.
  - Supports: `orderMatters` (shows up/down buttons), `required`.
- `enumArray`
  - Renders a checkbox grid from `options`.
  - Each option can show an `InfoIcon` tooltip via `description`.
  - `options` can be inline or `options: { "$ref": "..." }`.
  - Supports: `required`.
- `discriminator`
  - Special field used for the entity type selector.
  - Options are generated from `types[]`.

## Tooltips & descriptions

- Any field can include `tooltip`; it is displayed via `InfoIcon`.
- `enum` / `enumArray` options can include `description`; it is displayed via `SelectWithDescription` (enum) or per-option `InfoIcon` (enumArray).
- Type definitions can include `description`; it is shown as a short callout when that type is selected.

## Defaults

Defaults come from the JSON config:

- `applyDefaultsForType(schema, discriminatorValue, base)`
  - Sets the discriminator and applies per-field `default` values.
  - Initializes `stringArray`/`enumArray` fields to `[]` if not provided.

The Token Filters tab uses this for “Add Token Filter” and when changing type.

## Normalization & validation

Use `normalizeBySchema(schema, draft, { preserveUnknown: true })` before saving:

- Trims strings
- Converts numbers and clamps to `min`/`max` when configured
- Normalizes arrays to trimmed string arrays
- Removes empty optional fields (so the saved JSON stays clean)
- Returns per-field errors for the UI to display

`preserveUnknown: true` keeps unknown properties in the object, which is helpful when the service introduces new fields before the UI config is updated.

## Summary text (list/table view)

`summarizeBySchema(schema, obj)` returns a compact "key: value" / counts string based on the selected type’s fields. This is used for the table “Details” column.

## How to use in a tab/page

1) Create a config JSON under `src/data/constants/`.

2) Import and cast it:

```ts
import schemaJson from '.../mySchema.json';
import type { ConfigDrivenSchema } from '.../configDrivenTypes';

const schema = schemaJson as unknown as ConfigDrivenSchema;
```

3) Render the form for a draft object:

```tsx
<ConfigDrivenObjectForm
  schema={schema}
  value={draft}
  onChange={setDraft}
  errors={validationErrors}
/>
```

4) Normalize/validate on save:

```ts
const result = normalizeBySchema(schema, draft, { preserveUnknown: true });
if (!result.value) setValidationErrors(result.errors);
else save(result.value);
```

## Current limitations (by design)

This system currently targets “flat object editors” and intentionally stays small.

Not supported yet:
- Nested object editing
- Conditional fields (show/hide based on other field values)
- Custom per-field renderers (date/time, regex editors, complex builders)
- Cross-field validation rules

If we need those, the schema format is intentionally extendable so we can add them without breaking existing configs.
