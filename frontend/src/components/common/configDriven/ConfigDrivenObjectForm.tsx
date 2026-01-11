import React, { useMemo, useState } from 'react';
import { Input } from '../Input';
import { Label } from '../Label';
import { Button } from '../Button';
import { InfoIcon } from '../InfoIcon';
import { SelectWithDescription } from '../SelectWithDescription';
import { JsonEditorModal } from '../JsonEditorModal';

import type { ConfigDrivenField, ConfigDrivenSchema } from './configDrivenTypes';
import {
    applyDefaultsForType,
    buildTypeOptions,
    getResolvedEntity,
    getResolvedFieldNestedDefinition,
    getResolvedFieldOptions,
    getResolvedTypeDefinitions,
    summarizeBySchema,
    getTypeDefinition
} from './configDrivenUtils';

interface ConfigDrivenObjectFormProps {
    schema: ConfigDrivenSchema;
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    errors?: Record<string, string>;

    /**
     * Controls how nested object/objectArray fields are presented.
     * - 'inline' (default): current nested fieldset rendering.
     * - 'accordion': nested sections are collapsible and full-width to avoid cramped UI.
     */
    nestedPresentation?: 'inline' | 'accordion';

    /** If true, only one accordion section is open at a time (accordion mode only). */
    accordionSingleOpen?: boolean;

    /** If true, accordion sections start expanded by default (accordion mode only). */
    accordionDefaultExpanded?: boolean;
}

const getStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(x => String(x)) : []);

const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

const splitPath = (path: string): string[] => {
    const t = String(path || '');
    if (!t) return [];
    // Treat OData/@-prefixed keys as literal (e.g. "@odata.type"), not as dot paths.
    if (t.startsWith('@')) return [t];
    return t.split('.').filter(Boolean);
};

const getByPath = (obj: Record<string, unknown>, path: string): unknown => {
    const parts = splitPath(path);
    if (parts.length === 0) return undefined;

    let cur: unknown = obj;
    for (const p of parts) {
        if (typeof cur !== 'object' || cur === null) return undefined;

        if (Array.isArray(cur)) {
            const idx = Number(p);
            if (!Number.isInteger(idx)) return undefined;
            cur = cur[idx];
            continue;
        }

        cur = (cur as Record<string, unknown>)[p];
    }
    return cur;
};

const setByPath = (obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
    const parts = splitPath(path);
    if (parts.length === 0) return obj;

    const next: Record<string, unknown> = { ...obj };
    let cur: Record<string, unknown> = next;

    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const existing = cur[key];
        const child = (existing && typeof existing === 'object' && !Array.isArray(existing)) ? { ...(existing as Record<string, unknown>) } : {};
        cur[key] = child;
        cur = child;
    }

    cur[parts[parts.length - 1]] = value;
    return next;
};

const deleteByPath = (obj: Record<string, unknown>, path: string): Record<string, unknown> => {
    const parts = splitPath(path);
    if (parts.length === 0) return obj;

    const next: Record<string, unknown> = { ...obj };
    let cur: Record<string, unknown> = next;

    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const existing = cur[key];
        if (!existing || typeof existing !== 'object' || Array.isArray(existing)) return obj;
        const child = { ...(existing as Record<string, unknown>) };
        cur[key] = child;
        cur = child;
    }

    delete cur[parts[parts.length - 1]];
    return next;
};

export const ConfigDrivenObjectForm: React.FC<ConfigDrivenObjectFormProps> = ({
    schema,
    value,
    onChange,
    errors,
    nestedPresentation = 'inline',
    accordionSingleOpen = false,
    accordionDefaultExpanded = false
}) => {
    const entity = useMemo(() => getResolvedEntity(schema), [schema]);
    const discriminatorKey = entity.discriminatorKey;
    const nameKey = entity.nameKey;

    const resolvedTypes = useMemo(() => getResolvedTypeDefinitions(schema), [schema]);
    const fixedTypeDef = resolvedTypes.length === 1 ? resolvedTypes[0] : null;

    const discriminatorValue = String(getByPath(value, discriminatorKey) || '');

    const typeOptions = useMemo(() => {
        return buildTypeOptions(schema);
    }, [schema]);

    const typeDef = useMemo(() => {
        if (fixedTypeDef) return fixedTypeDef;
        return getTypeDefinition(schema, discriminatorValue);
    }, [schema, discriminatorValue, fixedTypeDef]);

    const [pendingStringArrayAdds, setPendingStringArrayAdds] = useState<Record<string, string>>({});

    const [rawJsonEditorOpen, setRawJsonEditorOpen] = useState(false);
    const [rawJsonEditorFieldKey, setRawJsonEditorFieldKey] = useState<string | null>(null);
    const [rawJsonEditorTitle, setRawJsonEditorTitle] = useState('');

    const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({});

    const commonNameField = schema.commonFields.find(f => f.key === nameKey);
    const commonTypeField = schema.commonFields.find(f => f.key === discriminatorKey);

    const showNameField = !!commonNameField;
    const showTypeField = !fixedTypeDef && (!!commonTypeField || resolvedTypes.length > 1);

    const typeFields = typeDef?.fields || [];

    const setField = (key: string, nextValue: unknown) => {
        onChange(setByPath(value, key, nextValue));
    };

    const openRawJson = (fieldKey: string, title: string) => {
        setRawJsonEditorFieldKey(fieldKey);
        setRawJsonEditorTitle(title);
        setRawJsonEditorOpen(true);
    };

    const isAccordionMode = nestedPresentation === 'accordion';

    const isSectionOpen = (key: string) => {
        if (!isAccordionMode) return true;
        if (Object.prototype.hasOwnProperty.call(accordionOpen, key)) return !!accordionOpen[key];
        return accordionDefaultExpanded;
    };

    const toggleSection = (key: string) => {
        setAccordionOpen(prev => {
            const currently = Object.prototype.hasOwnProperty.call(prev, key) ? !!prev[key] : accordionDefaultExpanded;
            if (!accordionSingleOpen) return { ...prev, [key]: !currently };

            // single-open: close all others
            const next: Record<string, boolean> = {};
            for (const k of Object.keys(prev)) next[k] = false;
            next[key] = !currently;
            return next;
        });
    };

    const renderField = (f: ConfigDrivenField) => {
        const fieldError = errors?.[f.key];
        const label = (
            <>
                {f.label} {f.tooltip ? <InfoIcon tooltip={f.tooltip} /> : null}
            </>
        );

        if (f.type === 'string') {
            const inputType = (() => {
                const k = String(f.key || '').toLowerCase();
                const lbl = String(f.label || '').toLowerCase();
                if (k.includes('secret') || lbl.includes('secret')) return 'password';
                return 'text';
            })();
            return (
                <div key={f.key}>
                    <Label>{label}</Label>
                    <Input
                        type={inputType}
                        value={String(getByPath(value, f.key) ?? '')}
                        onChange={e => setField(f.key, e.target.value)}
                        placeholder={f.placeholder}
                    />
                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                </div>
            );
        }

        if (f.type === 'number') {
            return (
                <div key={f.key}>
                    <Label>{label}</Label>
                    <Input
                        type="number"
                        value={String(getByPath(value, f.key) ?? '')}
                        onChange={e => setField(f.key, e.target.value)}
                        min={typeof f.min === 'number' ? f.min : undefined}
                        max={typeof f.max === 'number' ? f.max : undefined}
                        placeholder={typeof f.default !== 'undefined' ? String(f.default) : f.placeholder}
                    />
                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                </div>
            );
        }

        if (f.type === 'boolean') {
            const raw = getByPath(value, f.key);
            const checked = typeof raw === 'boolean' ? (raw as boolean) : (typeof f.default === 'boolean' ? (f.default as boolean) : false);
            return (
                <div key={f.key}>
                    <Label>{label}</Label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => setField(f.key, e.target.checked)}
                        />
                        <span>{checked ? 'True' : 'False'}</span>
                    </label>
                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                </div>
            );
        }

        if (f.type === 'enum') {
            const options = getResolvedFieldOptions(f).map(o => ({ value: o.value, label: o.label || o.value, description: o.description }));
            return (
                <div key={f.key}>
                    <Label>{label}</Label>
                    <SelectWithDescription
                        value={String(getByPath(value, f.key) ?? '')}
                        onChange={e => setField(f.key, e.target.value)}
                        options={[{ value: '', label: 'Select...' }, ...options]}
                    />
                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                </div>
            );
        }

        if (f.type === 'enumArray') {
            const options = getResolvedFieldOptions(f).map(o => ({ value: o.value, label: o.label || o.value, description: o.description }));
            const selected = new Set(getStringArray(getByPath(value, f.key)).map(s => s.trim()).filter(Boolean));

            return (
                <fieldset key={f.key} style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                    <legend style={{ padding: '0 8px' }}>{f.label} {f.tooltip ? <InfoIcon tooltip={f.tooltip} /> : null}</legend>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '10px 16px',
                            padding: '12px',
                            backgroundColor: 'var(--sidebar-bg)',
                            borderRadius: '4px',
                            alignItems: 'start'
                        }}
                    >
                        {options.length === 0 && (
                            <div style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '12px' }}>No options available</div>
                        )}

                        {options.map(opt => (
                            <label
                                key={opt.value}
                                style={{ display: 'flex', gap: '8px', alignItems: 'center', minHeight: '22px', padding: '2px 6px', borderRadius: '4px' }}
                                title={opt.label}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(opt.value)}
                                    onChange={e => {
                                        const next = new Set(selected);
                                        if (e.target.checked) next.add(opt.value);
                                        else next.delete(opt.value);
                                        setField(f.key, Array.from(next));
                                    }}
                                    style={{ margin: 0 }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.2, minWidth: 0 }}>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                                    {opt.description && (
                                        <span
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            <InfoIcon tooltip={opt.description} />
                                        </span>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>

                    <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-color)', opacity: 0.8 }}>
                        Selected: {selected.size}
                    </div>

                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '8px' }}>{fieldError}</div>}
                </fieldset>
            );
        }

        if (f.type === 'stringArray') {
            const list = getStringArray(getByPath(value, f.key)).map(s => s.trim()).filter(Boolean);
            const addText = pendingStringArrayAdds[f.key] || '';

            return (
                <fieldset key={f.key} style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                    <legend style={{ padding: '0 8px' }}>{f.label} {f.tooltip ? <InfoIcon tooltip={f.tooltip} /> : null}</legend>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'end' }}>
                            <div>
                                <Label style={{ fontSize: '12px', opacity: 0.9 }}>Add value</Label>
                                <Input
                                    value={addText}
                                    onChange={e => setPendingStringArrayAdds(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder || 'Type value and click Add'}
                                />
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const v = addText.trim();
                                    if (!v) return;
                                    setField(f.key, [...list, v]);
                                    setPendingStringArrayAdds(prev => ({ ...prev, [f.key]: '' }));
                                }}
                            >
                                <i className="fas fa-plus"></i> Add
                            </Button>
                        </div>

                        <div style={{ padding: '10px', background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                            {list.length === 0 && (
                                <div style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '12px' }}>None added.</div>
                            )}

                            {list.map((item, idx) => (
                                <div
                                    key={`${item}-${idx}`}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: '8px',
                                        alignItems: 'center',
                                        padding: '6px 0',
                                        borderBottom: idx === list.length - 1 ? 'none' : '1px solid var(--border-color)'
                                    }}
                                >
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item}</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {f.orderMatters && (
                                            <>
                                                <Button
                                                    variant="icon"
                                                    onClick={() => setField(f.key, moveItem(list, idx, idx - 1))}
                                                    title="Move up"
                                                    disabled={idx === 0}
                                                >
                                                    <i className="fas fa-arrow-up"></i>
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    onClick={() => setField(f.key, moveItem(list, idx, idx + 1))}
                                                    title="Move down"
                                                    disabled={idx === list.length - 1}
                                                >
                                                    <i className="fas fa-arrow-down"></i>
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="icon"
                                            onClick={() => {
                                                const next = [...list];
                                                next.splice(idx, 1);
                                                setField(f.key, next);
                                            }}
                                            title="Remove"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Count: {list.length}{f.orderMatters ? ' (order matters)' : ''}</div>

                        {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px' }}>{fieldError}</div>}
                    </div>
                </fieldset>
            );
        }

        if (f.type === 'object' || f.type === 'objectArray') {
            const nestedDef = getResolvedFieldNestedDefinition(f);

            const nestedSchema: ConfigDrivenSchema | null = (() => {
                if (!nestedDef) return null;
                if (nestedDef.kind === 'schema') return nestedDef.schema;

                // Allow a single type definition to be used as a nested object editor.
                // We synthesize a minimal schema (non-polymorphic) so the existing form can render.
                return {
                    entity: {
                        title: f.label,
                        description: f.tooltip,
                        discriminatorKey: '@odata.type',
                        nameKey: 'name'
                    },
                    commonFields: [],
                    types: [nestedDef.typeDef]
                };
            })();

            // If no schema is provided yet, we can't render a nested editor.
            if (!nestedSchema) {
                const open = () => openRawJson(f.key, `${f.label} (JSON)`);

                const rawValue = getByPath(value, f.key);
                const preview = (() => {
                    try {
                        if (rawValue === undefined || rawValue === null) return '';
                        return JSON.stringify(rawValue, null, 2);
                    } catch {
                        return '';
                    }
                })();

                return (
                    <div key={f.key}>
                        <Label>{label}</Label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                            <Button variant="secondary" onClick={open}>
                                <i className="fas fa-code"></i> Edit JSON
                            </Button>
                            <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.7 }}>
                                {f.type === 'object'
                                    ? 'No schema provided; edit as raw JSON object.'
                                    : 'No schema provided; edit as raw JSON array.'}
                            </div>
                        </div>
                        {preview && (
                            <pre style={{ marginTop: '10px', fontSize: '11px', opacity: 0.85, maxHeight: '160px', overflow: 'auto', background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px' }}>
                                {preview}
                            </pre>
                        )}
                        {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                    </div>
                );
            }

            if (f.type === 'object') {
                const raw = getByPath(value, f.key);
                const nestedValue = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

                if (isAccordionMode) {
                    const open = isSectionOpen(f.key);
                    const summary = summarizeBySchema(nestedSchema, nestedValue);

                    return (
                        <div key={f.key} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                            <button
                                type="button"
                                onClick={() => toggleSection(f.key)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    background: 'var(--sidebar-bg)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    color: 'var(--text-color)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                    <i className={`fas ${open ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{f.label}</span>
                                    {f.tooltip ? <InfoIcon tooltip={f.tooltip} /> : null}
                                    {summary && (
                                        <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {summary}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <Button
                                        variant="secondary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openRawJson(f.key, `${f.label} (JSON)`);
                                        }}
                                        title="Edit raw JSON"
                                    >
                                        <i className="fas fa-code"></i> Edit JSON
                                    </Button>
                                </div>
                            </button>

                            {open && (
                                <div style={{ padding: '12px' }}>
                                    <ConfigDrivenObjectForm
                                        schema={nestedSchema}
                                        value={nestedValue}
                                        onChange={(next) => setField(f.key, next)}
                                        nestedPresentation={nestedPresentation}
                                        accordionSingleOpen={accordionSingleOpen}
                                        accordionDefaultExpanded={accordionDefaultExpanded}
                                    />
                                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '8px' }}>{fieldError}</div>}
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <fieldset key={f.key} style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 6px', fontSize: '12px', color: 'var(--text-color)' }}>{label}</legend>
                        <ConfigDrivenObjectForm
                            schema={nestedSchema}
                            value={nestedValue}
                            onChange={(next) => setField(f.key, next)}
                            nestedPresentation={nestedPresentation}
                            accordionSingleOpen={accordionSingleOpen}
                            accordionDefaultExpanded={accordionDefaultExpanded}
                        />
                        {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                    </fieldset>
                );
            }

            // objectArray: render first item only for now (structure support), to avoid complex nested list UI.
            const arrRaw = getByPath(value, f.key);
            const arr = Array.isArray(arrRaw) ? (arrRaw as unknown[]) : [];

            const addFirstItem = () => {
                const nestedType = getResolvedTypeDefinitions(nestedSchema)[0]?.discriminatorValue;
                const initial = nestedType ? applyDefaultsForType(nestedSchema, nestedType, {}) : {};
                setField(f.key, [initial]);
            };

            const clearAll = () => setField(f.key, []);

            const first = arr[0] && typeof arr[0] === 'object' && !Array.isArray(arr[0]) ? (arr[0] as Record<string, unknown>) : {};
            if (isAccordionMode) {
                const open = isSectionOpen(f.key);
                const summary = arr.length > 0 ? summarizeBySchema(nestedSchema, first) : '';
                return (
                    <div key={f.key} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                        <button
                            type="button"
                            onClick={() => toggleSection(f.key)}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 12px',
                                background: 'var(--sidebar-bg)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                cursor: 'pointer',
                                color: 'var(--text-color)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <i className={`fas ${open ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{f.label}</span>
                                {f.tooltip ? <InfoIcon tooltip={f.tooltip} /> : null}
                                <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.75 }}>
                                    Items: {arr.length}
                                </span>
                                {summary && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {summary}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <Button
                                    variant="secondary"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openRawJson(f.key, `${f.label} (JSON)`);
                                    }}
                                    title="Edit raw JSON"
                                >
                                    <i className="fas fa-code"></i> Edit JSON
                                </Button>
                                {arr.length === 0 ? (
                                    <Button
                                        variant="secondary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            addFirstItem();
                                            // Auto-open after add for convenience
                                            setAccordionOpen(prev => ({ ...prev, [f.key]: true }));
                                        }}
                                    >
                                        <i className="fas fa-plus"></i> Add item
                                    </Button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            clearAll();
                                        }}
                                    >
                                        <i className="fas fa-trash"></i> Clear
                                    </Button>
                                )}
                            </div>
                        </button>

                        {open && (
                            <div style={{ padding: '12px' }}>
                                {arr.length === 0 ? (
                                    <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.7 }}>
                                        No items yet.
                                    </div>
                                ) : (
                                    <ConfigDrivenObjectForm
                                        schema={nestedSchema}
                                        value={first}
                                        onChange={(next) => {
                                            const nextArr = [...arr];
                                            if (nextArr.length === 0) nextArr.push(next);
                                            else nextArr[0] = next;
                                            setField(f.key, nextArr);
                                        }}
                                        nestedPresentation={nestedPresentation}
                                        accordionSingleOpen={accordionSingleOpen}
                                        accordionDefaultExpanded={accordionDefaultExpanded}
                                    />
                                )}
                                {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '8px' }}>{fieldError}</div>}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <fieldset key={f.key} style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                    <legend style={{ padding: '0 6px', fontSize: '12px', color: 'var(--text-color)' }}>{label}</legend>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.7 }}>
                            Items: {arr.length} (list UI will be added later)
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Button variant="secondary" onClick={() => openRawJson(f.key, `${f.label} (JSON)`)} title="Edit raw JSON">
                                <i className="fas fa-code"></i> Edit JSON
                            </Button>
                            {arr.length === 0 ? (
                                <Button variant="secondary" onClick={addFirstItem}>
                                    <i className="fas fa-plus"></i> Add item
                                </Button>
                            ) : (
                                <Button variant="secondary" onClick={clearAll}>
                                    <i className="fas fa-trash"></i> Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {arr.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.7 }}>
                            No items yet.
                        </div>
                    ) : (
                        <ConfigDrivenObjectForm
                            schema={nestedSchema}
                            value={first}
                            onChange={(next) => {
                                const nextArr = [...arr];
                                if (nextArr.length === 0) nextArr.push(next);
                                else nextArr[0] = next;
                                setField(f.key, nextArr);
                            }}
                            nestedPresentation={nestedPresentation}
                            accordionSingleOpen={accordionSingleOpen}
                            accordionDefaultExpanded={accordionDefaultExpanded}
                        />
                    )}
                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                </fieldset>
            );
        }

        return null;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(showNameField || showTypeField) && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: showNameField && showTypeField ? '1fr 1fr' : '1fr',
                        gap: '16px'
                    }}
                >
                    {showNameField && (
                        <div>
                            <Label>
                                {commonNameField?.label || 'Name'} {commonNameField?.tooltip ? <InfoIcon tooltip={commonNameField.tooltip} /> : null}
                            </Label>
                            <Input
                                value={String(getByPath(value, nameKey) ?? '')}
                                onChange={e => setField(nameKey, e.target.value)}
                                placeholder={commonNameField?.placeholder}
                            />
                            {errors?.[nameKey] && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{errors[nameKey]}</div>}
                        </div>
                    )}

                    {showTypeField && (
                        <div>
                            <Label>
                                {commonTypeField?.label || 'Type'} {commonTypeField?.tooltip ? <InfoIcon tooltip={commonTypeField.tooltip} /> : null}
                            </Label>
                            <SelectWithDescription
                                value={String(getByPath(value, discriminatorKey) ?? '')}
                                onChange={e => {
                                    const nextType = e.target.value;
                                    const keepName = String(getByPath(value, nameKey) ?? '').trim() || `${entity.title.toLowerCase().replace(/\s+/g, '-')}-1`;
                                    const next = applyDefaultsForType(schema, nextType, { [nameKey]: keepName });
                                    onChange(next);
                                }}
                                options={[{ value: '', label: 'Select type...' }, ...typeOptions]}
                            />
                            {errors?.[discriminatorKey] && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{errors[discriminatorKey]}</div>}
                        </div>
                    )}
                </div>
            )}

            {typeDef?.description && (
                <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.8, border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px', background: 'var(--sidebar-bg)' }}>
                    {typeDef.description}
                </div>
            )}

            {typeFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {typeFields
                        .filter(f => f.type !== 'stringArray' && f.type !== 'enumArray')
                        .filter(f => !isAccordionMode || (f.type !== 'object' && f.type !== 'objectArray'))
                        .map(renderField)}
                </div>
            )}

            {isAccordionMode && typeFields.some(f => f.type === 'object' || f.type === 'objectArray') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {typeFields
                        .filter(f => f.type === 'object' || f.type === 'objectArray')
                        .map(renderField)}
                </div>
            )}

            {typeFields
                .filter(f => f.type === 'stringArray' || f.type === 'enumArray')
                .map(renderField)}

            <JsonEditorModal
                isOpen={rawJsonEditorOpen}
                onClose={() => {
                    setRawJsonEditorOpen(false);
                    setRawJsonEditorFieldKey(null);
                    setRawJsonEditorTitle('');
                }}
                title={rawJsonEditorTitle}
                value={rawJsonEditorFieldKey ? getByPath(value, rawJsonEditorFieldKey as string) : {}}
                onSave={(nextValue) => {
                    const key = rawJsonEditorFieldKey;
                    if (!key) return;

                    const field = (typeFields as ConfigDrivenField[]).find(x => x.key === key) || (schema.commonFields || []).find(x => x.key === key);
                    const expectedType = field?.type;

                    if (expectedType === 'object') {
                        if (nextValue !== null && (typeof nextValue !== 'object' || Array.isArray(nextValue))) {
                            alert(`${key} must be a JSON object.`);
                            return;
                        }
                    }

                    if (expectedType === 'objectArray') {
                        if (!Array.isArray(nextValue)) {
                            alert(`${key} must be a JSON array.`);
                            return;
                        }
                    }

                    if (typeof nextValue === 'undefined' || nextValue === null) onChange(deleteByPath(value, key));
                    else setField(key, nextValue as unknown);
                }}
            />
        </div>
    );
};
