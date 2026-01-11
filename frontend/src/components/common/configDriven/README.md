# Config-Driven Forms (common/configDriven)

This folder contains a small, reusable “config-driven form” system.

The goal: render consistent editors for rapidly-evolving Azure Search payloads from JSON config (minimal page code, no UI refactors when fields/types evolve).

## How it works (high level)

You author a *schema JSON* that describes:

- The **entity** you’re editing (title, discriminator field, name field)
- A set of **common fields** shared across all types (typically `name` and `@odata.type`)
- A list of **types** (one per discriminator value), each with fields + optional description

The UI renders a form for a single object using:

- `InfoIcon` for tooltips
- `SelectWithDescription` for enums and type selection

This system also supports nested object editors via `object` / `objectArray` fields (including polymorphic nested objects).

## Core concepts

### `entity`

`entity` is metadata for a polymorphic “family” of objects.

- `title`: UI title used by pages/tabs.
- `description`: shown as a tooltip in the tab header.
- `discriminatorKey`: property that selects the concrete type (usually `@odata.type`).
- `nameKey`: primary identifier field (usually `name`).

`entity` can be inline or `{ "$ref": "..." }`.

### `types[]`

Each type is a concrete shape for a discriminator value.

- `discriminatorValue`: exact value stored in the object (e.g. `#Microsoft.Azure.Search.EdgeNGramTokenFilterV2`).
- `label`: user-friendly name displayed in the UI.
- `description` (optional): shown in the type dropdown + as a callout in the editor.
- `fields`: the fields that apply to this specific type.

Types can be embedded inline or `{ "$ref": "..." }` to keep schemas modular.

### Enums (`enum` / `enumArray`)

Enums are option sets used by fields.

- Options are arrays of `{ value, label?, description? }`.
- Options can be inline or `{ "$ref": "..." }`.

## Schema file structure

A schema JSON matches this shape:

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

## `$ref` support (reusability)

To keep configs small and reusable:

- `entity` can be `{ "$ref": "SomeDomain/entities/MyEntity.json" }`
- `types[]` entries can be `{ "$ref": "SomeDomain/types/MyType.json" }`
- `enum` / `enumArray` field `options` can be `{ "$ref": "SomeDomain/enums/MyEnum.json" }`

Example:

```json
{
  "types": [
    { "$ref": "TokenFilter/types/AsciiFoldingTokenFilter.json" }
  ]
}
```

## Field model (what you can put on a field)

All fields support:

- `key` (string): property name in the JSON object
- `label` (string): display name
- `type` (one of the supported field types)
- `required` (boolean, optional)
- `tooltip` (string, optional)

Common optional properties used by specific field types:

- `placeholder` (string)
- `default` (any)
- `min` / `max` (number)
- `maxLength` (number)
- `pattern` (string regex)
- `orderMatters` (boolean; for arrays that support reorder)

## Supported field types

### `string`

- Renders an `Input`.
- Supports: `required`, `maxLength`, `pattern`, `placeholder`, `default`.

### `number`

- Renders an `Input type="number"`.
- Supports: `min`, `max`, `default`.

### `boolean`

- Renders a checkbox.
- Supports: `default`.

### `enum`

- Renders a `SelectWithDescription`.
- Requires: `options` (inline array or `{ "$ref": "..." }`).
- Supports: `default`.

### `stringArray`

- Renders an “Add value” input + list of items.
- Supports: `required`, `orderMatters`.

### `enumArray`

- Renders a checkbox grid from `options`.
- Each option can show an `InfoIcon` tooltip via `description`.
- Requires: `options` (inline array or `{ "$ref": "..." }`).

### `discriminator`

- Special field used for the entity type selector.
- Options are generated from `types[]`.

### `object` / `objectArray` (nested editors)

Nested fields can reference either:

- a **full schema** (`ConfigDrivenSchema`) – best for polymorphic nested objects (or any nested editor with its own `entity` + `types[]`)
- a **single type definition** (`ConfigDrivenTypeDefinition`) – best for non-polymorphic nested objects

In both cases, `schema` can be inline or `{ "$ref": "..." }`.

- `object`
  - Renders a nested `ConfigDrivenObjectForm` when `schema` is provided.
  - If `schema` points to a single type definition, the UI synthesizes a minimal schema automatically (a non-polymorphic nested editor).
- `objectArray`
  - Schema-level support is present.
  - Today, if `schema` is provided, the editor focuses on the **first** array item (structure support). The add/remove/reorder list UI will be expanded later.

If an `object` / `objectArray` field does **not** provide `schema`, the UI falls back to a raw JSON editor (“Edit JSON”). This is intentional for open dictionaries like `httpHeaders`.

Example: referencing a full nested schema (polymorphic nested entity):

```json
{
  "key": "identity",
  "label": "Identity",
  "type": "object",
  "schema": { "$ref": "Skillset/DataIdentity/dataIdentityConfig.json" }
}
```

Example: referencing a single nested type definition (non-polymorphic nested object):

```json
{
  "key": "commonModelParameters",
  "label": "Common Model Parameters",
  "type": "object",
  "schema": { "$ref": "Skillset/types/ChatCompletionCommonModelParameters.json" }
}
```

## Tooltips & descriptions

- Any field can include `tooltip`; it is displayed via `InfoIcon`.
- `enum` / `enumArray` options can include `description`; it is displayed via `SelectWithDescription` (enum) or per-option `InfoIcon` (enumArray).
- Type definitions can include `description`; it is shown as a short callout when that type is selected.

## Defaults

Defaults come from the JSON config:

- `applyDefaultsForType(schema, discriminatorValue, base)`
  - Sets the discriminator and applies per-field `default` values.
  - Initializes `stringArray`/`enumArray` fields to `[]` if not provided.

The Token Filters tab uses this for “Add …” flows and when changing type.

## Normalization & validation

Use `normalizeBySchema(schema, draft, { preserveUnknown: true })` before saving:

- Trims strings
- Converts numbers and clamps to `min`/`max` when configured
- Normalizes arrays to trimmed string arrays
- Removes empty optional fields (keeps saved JSON clean)
- Returns per-field errors for the UI to display

`preserveUnknown: true` keeps unknown properties in the object. This is important when the service introduces new fields before the UI config is updated.

## Summary text (list/table view)

`summarizeBySchema(schema, obj)` returns compact “key: value” / counts text based on the selected type’s fields. This is used for table “Details” columns.

## How to use in a tab/page

1) Import the schema JSON and cast it:

```ts
import schemaJson from '.../mySchema.json';
import type { ConfigDrivenSchema } from '.../configDrivenTypes';

const schema = schemaJson as unknown as ConfigDrivenSchema;
```

2) Render the editor:

```tsx
<ConfigDrivenObjectForm schema={schema} value={draft} onChange={setDraft} errors={validationErrors} />
```

### Optional UI presentation (props)

The schema JSON describes *data* and *field metadata*.

For **UI layout choices** (like how to present nested objects), prefer passing options as **React props** to `ConfigDrivenObjectForm` rather than encoding them in the schema. This keeps schemas reusable and lets each tab pick the most appropriate layout.

#### `nestedPresentation`

Controls how nested `object` / `objectArray` fields are presented:

- `nestedPresentation="inline"` (default)
  - Current behavior.
  - Nested objects render inline using nested fieldsets.
  - Best for shallow objects (1 level deep) or when you want “everything visible at once”.

- `nestedPresentation="accordion"`
  - Nested objects/arrays render as **full-width collapsible sections**.
  - Prevents the UI from getting cramped as nesting increases.
  - Best for complex shapes like Knowledge Store (`identity`, `parameters`, `projections`, etc.).

Optional accordion behaviors:

- `accordionSingleOpen` (default: `false`)
  - When `true`, opening one section closes the others.

- `accordionDefaultExpanded` (default: `false`)
  - When `true`, sections start expanded.

Example (enable accordion only for a specific tab):

```tsx
<ConfigDrivenObjectForm
  schema={schema}
  value={draft}
  onChange={setDraft}
  errors={validationErrors}
  nestedPresentation="accordion"
  accordionSingleOpen={false}
  accordionDefaultExpanded={false}
/>
```

3) Normalize/validate on save:

```ts
const result = normalizeBySchema(schema, draft, { preserveUnknown: true });
if (!result.value) setValidationErrors(result.errors);
else save(result.value);
```

## Authoring guidance (practical)

### Folder + naming conventions (recommended)

Keep configs under `src/data/constants/config/<Domain>/...` and split by concern:

- **Schema files**: `.../<Domain>/<something>Config.json` (contain `entity/commonFields/types[]`)
- **Entity files**: `.../<Domain>/entities/<EntityName>.json` (entity metadata)
- **Type files**: `.../<Domain>/types/<TypeName>.json` (contain `discriminatorValue/label/fields`)
- **Enum option sets**: `.../<Domain>/enums/<EnumName>.json` (array of `{ value, label?, description? }`)

### When to use what

- Use a **full schema** when the nested object is polymorphic (requires discriminator selection).
- Use a **single type definition** when the nested object has one stable shape.
- Omit `schema` for open dictionaries / dynamic JSON (use the raw JSON fallback editor).

### “Generation” notes

There is no runtime “code generation” requirement: the UI reads JSON configs at build time and resolves `$ref`.

In practice, we often *author* these JSONs by extracting shapes from Azure Search docs / SDK models and then organizing them into:

- shared enum option sets (to avoid duplication)
- reusable type definition JSONs (so multiple schemas can reference the same shape)

## Current limitations (by design)

This system intentionally stays small and targets “flat object editors” first.

Not supported yet:

- Full `objectArray` UX (add/remove/reorder UI across items)
- Conditional fields (show/hide based on other field values)
- Custom per-field renderers (date/time pickers, complex builders)
- Cross-field validation rules

If we need those, the schema format is intentionally extendable so we can add them without breaking existing configs.

### Notes on `objectArray` in accordion mode

When using `nestedPresentation="accordion"`:

- `objectArray` fields are shown as collapsible sections with an item count.
- The UI still focuses on the **first** item for editing (structure support), but the interaction is less cramped.
- The header provides quick actions (Edit JSON / Add item / Clear) so you can work without needing the full list UI.
