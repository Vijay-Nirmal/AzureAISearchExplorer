import type {
    ConfigDrivenField,
    ConfigDrivenOption,
    ConfigDrivenRef,
    ConfigDrivenSchema,
    ConfigDrivenTypeDefinition,
    ConfigDrivenTypeEntry
} from './configDrivenTypes';

// Eager-load config JSON so $ref works without dynamic imports.
// Keys are absolute-from-src paths like: /src/data/constants/config/TokenFilter/types/EdgeNGramTokenFilter.json
const configJsonModules = import.meta.glob('/src/data/constants/config/**/*.json', { eager: true });

const normalizeRefPath = (ref: string): string => {
    const t = (ref || '').trim();
    if (!t) return t;

    // Accept:
    // - /src/data/constants/config/... (as-is)
    // - src/data/constants/config/... (prefix with /)
    // - TokenFilter/types/X.json (relative to /src/data/constants/config/)
    if (t.startsWith('/src/')) return t;
    if (t.startsWith('src/')) return `/${t}`;

    const cleaned = t.replace(/^\/+/, '');
    return `/src/data/constants/config/${cleaned}`;
};

const isRef = (v: unknown): v is ConfigDrivenRef => {
    return !!v && typeof v === 'object' && '$ref' in (v as Record<string, unknown>) && typeof (v as any).$ref === 'string';
};

export const resolveConfigRef = <T,>(ref: string): T | null => {
    const key = normalizeRefPath(ref);
    const mod = (configJsonModules as Record<string, any>)[key];
    if (!mod) return null;
    return (mod.default ?? mod) as T;
};

const resolveTypeEntry = (entry: ConfigDrivenTypeEntry, visitedRefs: Set<string>): ConfigDrivenTypeDefinition | null => {
    if (!entry) return null;
    if (!isRef(entry)) return entry as ConfigDrivenTypeDefinition;

    const ref = normalizeRefPath(entry.$ref);
    if (!ref || visitedRefs.has(ref)) return null;
    visitedRefs.add(ref);

    const loaded = resolveConfigRef<ConfigDrivenTypeEntry>(ref);
    if (!loaded) return null;

    // Allow a referenced file to either contain a full type definition, or a nested ref.
    return resolveTypeEntry(loaded, visitedRefs);
};

export const getResolvedTypeDefinitions = (schema: ConfigDrivenSchema): ConfigDrivenTypeDefinition[] => {
    const defs: ConfigDrivenTypeDefinition[] = [];
    for (const entry of schema.types || []) {
        const def = resolveTypeEntry(entry, new Set<string>());
        if (def) defs.push(def);
    }
    return defs;
};

export const getResolvedFieldOptions = (field: ConfigDrivenField): ConfigDrivenOption[] => {
    // Prefer explicit optionsRef if present.
    if (typeof field.optionsRef === 'string' && field.optionsRef.trim()) {
        const loaded = resolveConfigRef<ConfigDrivenOption[] | { options: ConfigDrivenOption[] }>(field.optionsRef);
        if (Array.isArray(loaded)) return loaded;
        if (loaded && typeof loaded === 'object' && Array.isArray((loaded as any).options)) return (loaded as any).options;
        return [];
    }

    const raw = field.options;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (isRef(raw)) {
        const loaded = resolveConfigRef<ConfigDrivenOption[] | { options: ConfigDrivenOption[] }>(raw.$ref);
        if (Array.isArray(loaded)) return loaded;
        if (loaded && typeof loaded === 'object' && Array.isArray((loaded as any).options)) return (loaded as any).options;
        return [];
    }

    return [];
};

export const getTypeDefinition = (schema: ConfigDrivenSchema, discriminatorValue: string | undefined): ConfigDrivenTypeDefinition | null => {
    if (!discriminatorValue) return null;
    return getResolvedTypeDefinitions(schema).find(t => t.discriminatorValue === discriminatorValue) || null;
};

export const buildTypeOptions = (schema: ConfigDrivenSchema) => {
    return getResolvedTypeDefinitions(schema).map(t => ({
        value: t.discriminatorValue,
        label: t.label,
        description: t.description
    }));
};

export const applyDefaultsForType = (
    schema: ConfigDrivenSchema,
    discriminatorValue: string,
    base: Record<string, unknown>
): Record<string, unknown> => {
    const typeDef = getTypeDefinition(schema, discriminatorValue);
    const next: Record<string, unknown> = { ...base };
    next[schema.entity.discriminatorKey] = discriminatorValue;

    const allFields = [...schema.commonFields, ...(typeDef?.fields || [])];
    for (const field of allFields) {
        if (field.key === schema.entity.discriminatorKey) continue;
        if (typeof next[field.key] !== 'undefined') continue;
        if (typeof field.default !== 'undefined') next[field.key] = field.default as unknown;
        else if (field.type === 'stringArray' || field.type === 'enumArray') next[field.key] = [];
    }

    return next;
};

const trimString = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const normalizeArrayOfStrings = (v: unknown): string[] => {
    if (!Array.isArray(v)) return [];
    return v.map(x => String(x).trim()).filter(Boolean);
};

const parseNumber = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return null;
        const n = Number(t);
        return Number.isFinite(n) ? n : null;
    }
    return null;
};

export interface NormalizeResult {
    value: Record<string, unknown> | null;
    errors: Record<string, string>;
}

export const normalizeBySchema = (
    schema: ConfigDrivenSchema,
    draft: Record<string, unknown>,
    opts?: { preserveUnknown?: boolean }
): NormalizeResult => {
    const preserveUnknown = opts?.preserveUnknown ?? true;

    const discriminatorKey = schema.entity.discriminatorKey;
    const nameKey = schema.entity.nameKey;

    const discriminatorValue = trimString(draft[discriminatorKey]);
    const typeDef = getTypeDefinition(schema, discriminatorValue);

    const errors: Record<string, string> = {};

    if (!discriminatorValue) errors[discriminatorKey] = 'Type is required.';

    const fields: ConfigDrivenField[] = [...schema.commonFields, ...(typeDef?.fields || [])];

    const knownKeys = new Set(fields.map(f => f.key));
    knownKeys.add(discriminatorKey);
    knownKeys.add(nameKey);

    const out: Record<string, unknown> = preserveUnknown ? { ...draft } : {};

    // Always keep discriminator and name
    out[discriminatorKey] = discriminatorValue || draft[discriminatorKey];

    const rawName = trimString(draft[nameKey]);
    out[nameKey] = rawName;

    // Validate name with config constraints if present in schema common fields
    const nameField = schema.commonFields.find(f => f.key === nameKey);
    if (nameField?.required && !rawName) errors[nameKey] = 'Name is required.';
    if (nameField?.maxLength && rawName && rawName.length > nameField.maxLength) errors[nameKey] = `Must be ${nameField.maxLength} characters or less.`;
    if (nameField?.pattern && rawName) {
        try {
            const re = new RegExp(nameField.pattern);
            if (!re.test(rawName)) errors[nameKey] = 'Invalid format.';
        } catch {
            // ignore invalid regex
        }
    }

    for (const field of fields) {
        const key = field.key;
        if (key === discriminatorKey || key === nameKey) continue;

        const raw = draft[key];

        if (field.type === 'string') {
            const s = trimString(raw);
            if (!s) {
                if (field.required) errors[key] = 'Required.';
                else delete out[key];
            } else {
                if (field.maxLength && s.length > field.maxLength) errors[key] = `Must be ${field.maxLength} characters or less.`;
                if (field.pattern) {
                    try {
                        const re = new RegExp(field.pattern);
                        if (!re.test(s)) errors[key] = 'Invalid format.';
                    } catch {
                        // ignore
                    }
                }
                out[key] = s;
            }
            continue;
        }

        if (field.type === 'number') {
            const n = parseNumber(raw);
            if (n === null) {
                if (field.required) errors[key] = 'Required.';
                else delete out[key];
            } else {
                let v = n;
                if (typeof field.min === 'number') v = Math.max(field.min, v);
                if (typeof field.max === 'number') v = Math.min(field.max, v);
                out[key] = v;
            }
            continue;
        }

        if (field.type === 'boolean') {
            if (typeof raw === 'boolean') out[key] = raw;
            else if (typeof raw === 'string') out[key] = raw.toLowerCase() === 'true';
            else if (typeof field.default === 'boolean') out[key] = field.default;
            else delete out[key];
            continue;
        }

        if (field.type === 'enum') {
            const s = trimString(raw);
            if (!s) {
                if (field.required) errors[key] = 'Required.';
                else delete out[key];
            } else {
                out[key] = s;
            }
            continue;
        }

        if (field.type === 'stringArray') {
            const arr = normalizeArrayOfStrings(raw);
            if (arr.length === 0) {
                if (field.required) errors[key] = 'At least one value is required.';
                else delete out[key];
            } else {
                out[key] = arr;
            }
            continue;
        }

        if (field.type === 'enumArray') {
            const arr = normalizeArrayOfStrings(raw);
            if (arr.length === 0) {
                if (field.required) errors[key] = 'At least one value is required.';
                else delete out[key];
            } else {
                out[key] = arr;
            }
            continue;
        }

        // discriminator handled elsewhere
    }

    // Strip unknowns if requested
    if (!preserveUnknown) {
        for (const key of Object.keys(out)) {
            if (!knownKeys.has(key)) delete out[key];
        }
    }

    if (Object.keys(errors).length > 0) return { value: null, errors };

    // If we don't have a known type, still allow saving (as long as name/type exist)
    if (!typeDef && discriminatorValue) {
        return { value: out, errors: {} };
    }

    return { value: out, errors: {} };
};

export const summarizeBySchema = (schema: ConfigDrivenSchema, obj: Record<string, unknown>): string => {
    const discriminatorKey = schema.entity.discriminatorKey;
    const nameKey = schema.entity.nameKey;

    const typeDef = getTypeDefinition(schema, typeof obj[discriminatorKey] === 'string' ? (obj[discriminatorKey] as string) : undefined);
    const fields = [...(typeDef?.fields || [])];

    const parts: string[] = [];

    for (const f of fields) {
        if (f.key === discriminatorKey || f.key === nameKey) continue;
        const v = obj[f.key];
        if (typeof v === 'undefined' || v === null) continue;

        if (f.type === 'boolean') {
            const b = typeof v === 'boolean' ? v : String(v).toLowerCase() === 'true';
            // Show booleans only when they differ from default, or when true and default is false.
            if (typeof f.default === 'boolean') {
                if (b !== f.default) parts.push(`${f.key}: ${b ? 'true' : 'false'}`);
            } else if (b) {
                parts.push(`${f.key}: true`);
            }
            continue;
        }

        if (f.type === 'number') {
            const n = typeof v === 'number' ? v : Number(String(v));
            if (Number.isFinite(n)) parts.push(`${f.key}: ${n}`);
            continue;
        }

        if (f.type === 'string') {
            const s = String(v).trim();
            if (s) parts.push(`${f.key}: ${s.length > 40 ? s.slice(0, 37) + '…' : s}`);
            continue;
        }

        if (f.type === 'enum') {
            const s = String(v).trim();
            if (s) parts.push(`${f.key}: ${s}`);
            continue;
        }

        if (f.type === 'stringArray' || f.type === 'enumArray') {
            const arr = Array.isArray(v) ? v : [];
            parts.push(`${f.key}: ${arr.length}`);
            continue;
        }
    }

    return parts.join(' • ') || '-';
};
