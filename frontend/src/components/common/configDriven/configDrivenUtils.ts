import type {
    ConfigDrivenField,
    ConfigDrivenOption,
    ConfigDrivenRef,
    ConfigDrivenSchema,
    ConfigDrivenEntityDefinition,
    ConfigDrivenTypeDefinition,
    ConfigDrivenTypeEntry
} from './configDrivenTypes';

// Eager-load config JSON so $ref works without dynamic imports.
// Keys are absolute-from-src paths like: /src/data/constants/config/TokenFilter/types/EdgeNGramTokenFilter.json
// NOTE: Use a relative glob to avoid Windows drive-letter casing issues during `vite build`
// (Rollup can end up computing relative paths like `../../../../d:/...` which it cannot resolve).
const rawConfigJsonModules = import.meta.glob('../../../data/constants/config/**/*.json', { eager: true });

const configJsonModules = Object.fromEntries(
    Object.entries(rawConfigJsonModules).map(([key, mod]) => {
        const marker = 'data/constants/config/';
        const idx = key.replace(/\\/g, '/').indexOf(marker);
        const normalizedKey = idx >= 0 ? `/src/${key.replace(/\\/g, '/').slice(idx)}` : key;
        return [normalizedKey, mod];
    })
);

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
    if (!v || typeof v !== 'object') return false;
    const rec = v as Record<string, unknown>;
    return typeof rec.$ref === 'string';
};

const resolveEntityEntry = (entry: ConfigDrivenEntityDefinition | ConfigDrivenRef, visitedRefs: Set<string>): ConfigDrivenEntityDefinition | null => {
    if (!entry) return null;
    if (!isRef(entry)) return entry as ConfigDrivenEntityDefinition;

    const ref = normalizeRefPath(entry.$ref);
    if (!ref || visitedRefs.has(ref)) return null;
    visitedRefs.add(ref);

    const loaded = resolveConfigRef<ConfigDrivenEntityDefinition | ConfigDrivenRef>(ref);
    if (!loaded) return null;
    return resolveEntityEntry(loaded, visitedRefs);
};

export const getResolvedEntity = (schema: ConfigDrivenSchema): ConfigDrivenEntityDefinition => {
    const resolved = resolveEntityEntry(schema.entity, new Set<string>());
    // Fallback to a safe default to avoid crashing the UI.
    return (
        resolved || {
            title: 'Entity',
            discriminatorKey: '@odata.type',
            nameKey: 'name'
        }
    );
};

export const resolveConfigRef = <T,>(ref: string): T | null => {
    const key = normalizeRefPath(ref);
    const mod = (configJsonModules as Record<string, unknown>)[key];
    if (!mod) return null;

    if (typeof mod === 'object' && mod !== null) {
        const rec = mod as Record<string, unknown>;
        if ('default' in rec) return rec.default as T;
    }

    return mod as T;
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
        if (loaded && typeof loaded === 'object') {
            const rec = loaded as Record<string, unknown>;
            if (Array.isArray(rec.options)) return rec.options as ConfigDrivenOption[];
        }
        return [];
    }

    const raw = field.options;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (isRef(raw)) {
        const loaded = resolveConfigRef<ConfigDrivenOption[] | { options: ConfigDrivenOption[] }>(raw.$ref);
        if (Array.isArray(loaded)) return loaded;
        if (loaded && typeof loaded === 'object') {
            const rec = loaded as Record<string, unknown>;
            if (Array.isArray(rec.options)) return rec.options as ConfigDrivenOption[];
        }
        return [];
    }

    return [];
};

export const getResolvedFieldSchema = (field: ConfigDrivenField): ConfigDrivenSchema | null => {
    const resolved = getResolvedFieldNestedDefinition(field);
    return resolved?.kind === 'schema' ? resolved.schema : null;
};

export type ResolvedNestedDefinition =
    | { kind: 'schema'; schema: ConfigDrivenSchema }
    | { kind: 'type'; typeDef: ConfigDrivenTypeDefinition };

const isSchemaLike = (v: unknown): v is ConfigDrivenSchema => {
    if (!v || typeof v !== 'object') return false;
    const rec = v as Record<string, unknown>;
    return 'entity' in rec && 'types' in rec && 'commonFields' in rec;
};

const isTypeDefinitionLike = (v: unknown): v is ConfigDrivenTypeDefinition => {
    if (!v || typeof v !== 'object') return false;
    const rec = v as Record<string, unknown>;
    return Array.isArray(rec.fields);
};

export const getResolvedFieldNestedDefinition = (field: ConfigDrivenField): ResolvedNestedDefinition | null => {
    const resolveAny = (v: unknown): ResolvedNestedDefinition | null => {
        if (!v) return null;

        if (isSchemaLike(v)) return { kind: 'schema', schema: v as ConfigDrivenSchema };
        if (isTypeDefinitionLike(v)) return { kind: 'type', typeDef: v as ConfigDrivenTypeDefinition };

        // Some configs may wrap as { schema: ... }
        if (typeof v === 'object' && v !== null) {
            const rec = v as Record<string, unknown>;
            if (rec.schema) return resolveAny(rec.schema);
        }

        return null;
    };

    if (typeof field.schemaRef === 'string' && field.schemaRef.trim()) {
        const loaded = resolveConfigRef<unknown>(field.schemaRef);
        return resolveAny(loaded);
    }

    const raw = field.schema;
    if (!raw) return null;
    if (isRef(raw)) {
        const loaded = resolveConfigRef<unknown>(raw.$ref);
        return resolveAny(loaded);
    }

    return resolveAny(raw);
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

export const getResolvedFieldDefinition = (
    schema: ConfigDrivenSchema,
    discriminatorValue: string | undefined,
    fieldKey: string
): ConfigDrivenField | null => {
    const fromCommon = (schema.commonFields || []).find(f => f.key === fieldKey);
    if (fromCommon) return fromCommon;

    const typeDef = getTypeDefinition(schema, discriminatorValue);
    const fromType = (typeDef?.fields || []).find(f => f.key === fieldKey);
    return fromType || null;
};

export const getFieldTooltipFromSchema = (
    schema: ConfigDrivenSchema,
    discriminatorValue: string | undefined,
    fieldKey: string
): string | undefined => {
    const t = (getResolvedFieldDefinition(schema, discriminatorValue, fieldKey)?.tooltip || '').trim();
    return t ? t : undefined;
};

export const getTypeDescriptionFromSchema = (schema: ConfigDrivenSchema, discriminatorValue: string | undefined): string | undefined => {
    const t = (getTypeDefinition(schema, discriminatorValue)?.description || '').trim();
    return t ? t : undefined;
};

export const applyDefaultsForType = (
    schema: ConfigDrivenSchema,
    discriminatorValue: string,
    base: Record<string, unknown>
): Record<string, unknown> => {
    const entity = getResolvedEntity(schema);
    const discriminatorKey = entity.discriminatorKey;
    const resolvedTypes = getResolvedTypeDefinitions(schema);
    const hasTypeSelector = resolvedTypes.length > 1 || schema.commonFields.some(f => f.key === discriminatorKey);
    const typeDef = getTypeDefinition(schema, discriminatorValue);
    const next: Record<string, unknown> = { ...base };

    if (hasTypeSelector) {
        next[discriminatorKey] = discriminatorValue;
    }

    const allFields = [...schema.commonFields, ...(typeDef?.fields || [])];
    for (const field of allFields) {
        if (field.key === discriminatorKey) continue;
        if (typeof getByPath(next, field.key) !== 'undefined') continue;
        if (typeof field.default !== 'undefined') setByPathMut(next, field.key, field.default as unknown);
        else if (field.type === 'stringArray' || field.type === 'enumArray') setByPathMut(next, field.key, []);
    }

    return next;
};

const trimString = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
    return !!v && typeof v === 'object' && !Array.isArray(v);
};

const getByPath = (obj: Record<string, unknown> | null | undefined, path: string): unknown => {
    if (!obj) return undefined;
    if (!path || path.startsWith('@') || !path.includes('.')) return obj[path];
    const parts = path.split('.').filter(Boolean);
    let cur: unknown = obj;
    for (const p of parts) {
        if (!isPlainObject(cur)) return undefined;
        cur = cur[p];
    }
    return cur;
};

const ensureObjectAt = (parent: Record<string, unknown>, key: string): Record<string, unknown> => {
    const existing = parent[key];
    if (isPlainObject(existing)) return existing;
    const next: Record<string, unknown> = {};
    parent[key] = next;
    return next;
};

const setByPathMut = (obj: Record<string, unknown>, path: string, value: unknown) => {
    if (path.startsWith('@') || !path.includes('.')) {
        obj[path] = value;
        return;
    }
    const parts = path.split('.').filter(Boolean);
    let cur: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        cur = ensureObjectAt(cur, parts[i]);
    }
    cur[parts[parts.length - 1]] = value;
};

const deleteByPathMut = (obj: Record<string, unknown>, path: string) => {
    if (path.startsWith('@') || !path.includes('.')) {
        delete obj[path];
        return;
    }
    const parts = path.split('.').filter(Boolean);
    let cur: unknown = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!isPlainObject(cur)) return;
        cur = cur[parts[i]];
    }
    if (!isPlainObject(cur)) return;
    delete cur[parts[parts.length - 1]];
};

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

    const entity = getResolvedEntity(schema);

    const discriminatorKey = entity.discriminatorKey;
    const nameKey = entity.nameKey;

    const resolvedTypes = getResolvedTypeDefinitions(schema);
    const hasTypeSelector = resolvedTypes.length > 1 || schema.commonFields.some(f => f.key === discriminatorKey);
    const hasNameField = schema.commonFields.some(f => f.key === nameKey);

    const discriminatorValue = hasTypeSelector
        ? trimString(getByPath(draft, discriminatorKey))
        : (resolvedTypes.length === 1 ? String(resolvedTypes[0]?.discriminatorValue || '') : trimString(getByPath(draft, discriminatorKey)));

    const typeDef = resolvedTypes.length === 1 ? resolvedTypes[0] : getTypeDefinition(schema, discriminatorValue);

    const errors: Record<string, string> = {};

    if (hasTypeSelector && !discriminatorValue) errors[discriminatorKey] = 'Type is required.';

    const fields: ConfigDrivenField[] = [...schema.commonFields, ...(typeDef?.fields || [])];

    const out: Record<string, unknown> = preserveUnknown ? { ...draft } : {};

    if (hasTypeSelector) {
        setByPathMut(out, discriminatorKey, discriminatorValue || getByPath(draft, discriminatorKey));
    }

    const rawName = hasNameField ? trimString(getByPath(draft, nameKey)) : '';
    if (hasNameField) setByPathMut(out, nameKey, rawName);

    // Validate name with config constraints if present in schema common fields
    const nameField = schema.commonFields.find(f => f.key === nameKey);
    if (hasNameField) {
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
    }

    for (const field of fields) {
        const key = field.key;
        if (key === discriminatorKey || key === nameKey) continue;

        const raw = getByPath(draft, key);

        if (field.type === 'string') {
            const s = trimString(raw);
            if (!s) {
                if (field.required) errors[key] = 'Required.';
                else deleteByPathMut(out, key);
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
                setByPathMut(out, key, s);
            }
            continue;
        }

        if (field.type === 'number') {
            const n = parseNumber(raw);
            if (n === null) {
                if (field.required) errors[key] = 'Required.';
                else deleteByPathMut(out, key);
            } else {
                let v = n;
                if (typeof field.min === 'number') v = Math.max(field.min, v);
                if (typeof field.max === 'number') v = Math.min(field.max, v);
                setByPathMut(out, key, v);
            }
            continue;
        }

        if (field.type === 'boolean') {
            if (typeof raw === 'boolean') setByPathMut(out, key, raw);
            else if (typeof raw === 'string') setByPathMut(out, key, raw.toLowerCase() === 'true');
            else if (typeof field.default === 'boolean') setByPathMut(out, key, field.default);
            else deleteByPathMut(out, key);
            continue;
        }

        if (field.type === 'enum') {
            const s = trimString(raw);
            if (!s) {
                if (field.required) errors[key] = 'Required.';
                else deleteByPathMut(out, key);
            } else {
                setByPathMut(out, key, s);
            }
            continue;
        }

        if (field.type === 'stringArray') {
            const arr = normalizeArrayOfStrings(raw);
            if (arr.length === 0) {
                if (field.required) errors[key] = 'At least one value is required.';
                else deleteByPathMut(out, key);
            } else {
                setByPathMut(out, key, arr);
            }
            continue;
        }

        if (field.type === 'enumArray') {
            const arr = normalizeArrayOfStrings(raw);
            if (arr.length === 0) {
                if (field.required) errors[key] = 'At least one value is required.';
                else deleteByPathMut(out, key);
            } else {
                setByPathMut(out, key, arr);
            }
            continue;
        }

        // discriminator handled elsewhere
    }

    // Strip unknowns if requested (path-aware)
    if (!preserveUnknown) {
        const next: Record<string, unknown> = {};
        if (hasTypeSelector) setByPathMut(next, discriminatorKey, discriminatorValue);
        if (hasNameField) setByPathMut(next, nameKey, rawName);
        for (const f of fields) {
            if (f.key === discriminatorKey || f.key === nameKey) continue;
            const v = getByPath(out, f.key);
            if (typeof v === 'undefined') continue;
            setByPathMut(next, f.key, v);
        }
        for (const k of Object.keys(out)) delete out[k];
        Object.assign(out, next);
    }

    if (Object.keys(errors).length > 0) return { value: null, errors };

    // If we don't have a known type, still allow saving (as long as name/type exist)
    if (!typeDef && discriminatorValue) {
        return { value: out, errors: {} };
    }

    return { value: out, errors: {} };
};

export const summarizeBySchema = (schema: ConfigDrivenSchema, obj: Record<string, unknown>): string => {
    const entity = getResolvedEntity(schema);
    const discriminatorKey = entity.discriminatorKey;
    const nameKey = entity.nameKey;

    const resolvedTypes = getResolvedTypeDefinitions(schema);
    const typeDef = resolvedTypes.length === 1
        ? resolvedTypes[0]
        : getTypeDefinition(schema, typeof getByPath(obj, discriminatorKey) === 'string' ? (getByPath(obj, discriminatorKey) as string) : undefined);

    const fields = (() => {
        const byKey = new Map<string, ConfigDrivenField>();
        for (const f of [...(schema.commonFields || []), ...(typeDef?.fields || [])]) {
            if (!byKey.has(f.key)) byKey.set(f.key, f);
        }
        return Array.from(byKey.values());
    })();

    const parts: string[] = [];

    for (const f of fields) {
        if (f.key === discriminatorKey || f.key === nameKey) continue;
        const v = getByPath(obj, f.key);
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
