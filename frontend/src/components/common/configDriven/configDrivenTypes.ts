export type ConfigDrivenFieldType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'enum'
    | 'stringArray'
    | 'enumArray'
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
    entity: ConfigDrivenEntityDefinition;
    commonFields: ConfigDrivenField[];
    // Types can be defined inline or referenced via $ref to a JSON file.
    types: ConfigDrivenTypeEntry[];
}
