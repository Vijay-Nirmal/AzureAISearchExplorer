export type ConfigDrivenFieldType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'enum'
    | 'stringArray'
    | 'enumArray'
    | 'object'
    | 'objectArray'
    | 'discriminator';

export interface ConfigDrivenRef {
    $ref: string;
}

export interface ConfigDrivenOption {
    value: string;
    label?: string;
    description?: string;
}

export interface ConfigDrivenField {
    key: string;
    label: string;
    type: ConfigDrivenFieldType;

    /** Optional UI hint for how this field should be rendered by the config-driven form. */
    presentation?: 'default' | 'table';

    required?: boolean;
    tooltip?: string;

    placeholder?: string;

    default?: unknown;

    min?: number;
    max?: number;
    maxLength?: number;
    pattern?: string;

    orderMatters?: boolean;

    // For enum/enumArray fields, options can be defined inline or referenced via $ref.
    options?: ConfigDrivenOption[] | ConfigDrivenRef;
    optionsRef?: string;

    // For object/objectArray fields, schema can be defined inline or referenced via $ref.
    // This enables nested object editing (including polymorphic entities).
    // The reference can point to either:
    // - a full ConfigDrivenSchema (polymorphic entity or structured nested editor)
    // - a single ConfigDrivenTypeDefinition (non-polymorphic nested object)
    schema?: ConfigDrivenSchema | ConfigDrivenTypeDefinition | ConfigDrivenRef;
    schemaRef?: string;
}

export interface ConfigDrivenTypeDefinition {
    discriminatorValue: string;
    label: string;
    description?: string;
    fields: ConfigDrivenField[];
}

export type ConfigDrivenTypeEntry = ConfigDrivenTypeDefinition | ConfigDrivenRef;

export interface ConfigDrivenEntityDefinition {
    title: string;
    description?: string;
    discriminatorKey: string;
    nameKey: string;
}

export interface ConfigDrivenSchema {
    entity: ConfigDrivenEntityDefinition | ConfigDrivenRef;
    commonFields: ConfigDrivenField[];
    // Types can be defined inline or referenced via $ref to a JSON file.
    types: ConfigDrivenTypeEntry[];
}
