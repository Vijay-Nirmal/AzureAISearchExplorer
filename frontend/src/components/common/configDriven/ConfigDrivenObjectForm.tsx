import React, { useMemo, useState } from 'react';
import { Input } from '../Input';
import { Label } from '../Label';
import { Button } from '../Button';
import { InfoIcon } from '../InfoIcon';
import { SelectWithDescription } from '../SelectWithDescription';

import type { ConfigDrivenField, ConfigDrivenSchema } from './configDrivenTypes';
import { applyDefaultsForType, buildTypeOptions, getResolvedFieldOptions, getTypeDefinition } from './configDrivenUtils';

interface ConfigDrivenObjectFormProps {
    schema: ConfigDrivenSchema;
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    errors?: Record<string, string>;
}

const getStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(x => String(x)) : []);

const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

export const ConfigDrivenObjectForm: React.FC<ConfigDrivenObjectFormProps> = ({ schema, value, onChange, errors }) => {
    const discriminatorKey = schema.entity.discriminatorKey;
    const nameKey = schema.entity.nameKey;

    const discriminatorValue = String(value[discriminatorKey] || '');

    const typeOptions = useMemo(() => {
        return buildTypeOptions(schema);
    }, [schema]);

    const typeDef = useMemo(() => getTypeDefinition(schema, discriminatorValue), [schema, discriminatorValue]);

    const [pendingStringArrayAdds, setPendingStringArrayAdds] = useState<Record<string, string>>({});

    const commonNameField = schema.commonFields.find(f => f.key === nameKey);
    const commonTypeField = schema.commonFields.find(f => f.key === discriminatorKey);

    const typeFields = typeDef?.fields || [];

    const setField = (key: string, nextValue: unknown) => {
        onChange({ ...value, [key]: nextValue });
    };

    const renderField = (f: ConfigDrivenField) => {
        const fieldError = errors?.[f.key];
        const label = (
            <>
                {f.label} {f.tooltip ? <InfoIcon tooltip={f.tooltip} /> : null}
            </>
        );

        if (f.type === 'string') {
            return (
                <div key={f.key}>
                    <Label>{label}</Label>
                    <Input
                        value={String(value[f.key] ?? '')}
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
                        value={String(value[f.key] ?? '')}
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
            const checked = typeof value[f.key] === 'boolean' ? (value[f.key] as boolean) : (typeof f.default === 'boolean' ? (f.default as boolean) : false);
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
                        value={String(value[f.key] ?? '')}
                        onChange={e => setField(f.key, e.target.value)}
                        options={[{ value: '', label: 'Select...' }, ...options]}
                    />
                    {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
                </div>
            );
        }

        if (f.type === 'enumArray') {
            const options = getResolvedFieldOptions(f).map(o => ({ value: o.value, label: o.label || o.value, description: o.description }));
            const selected = new Set(getStringArray(value[f.key]).map(s => s.trim()).filter(Boolean));

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
            const list = getStringArray(value[f.key]).map(s => s.trim()).filter(Boolean);
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
                                        borderBottom: idx === list.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)'
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

        return null;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                    <Label>
                        {commonNameField?.label || 'Name'} {commonNameField?.tooltip ? <InfoIcon tooltip={commonNameField.tooltip} /> : null}
                    </Label>
                    <Input
                        value={String(value[nameKey] ?? '')}
                        onChange={e => setField(nameKey, e.target.value)}
                        placeholder={commonNameField?.placeholder}
                    />
                    {errors?.[nameKey] && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{errors[nameKey]}</div>}
                </div>

                <div>
                    <Label>
                        {commonTypeField?.label || 'Type'} {commonTypeField?.tooltip ? <InfoIcon tooltip={commonTypeField.tooltip} /> : null}
                    </Label>
                    <SelectWithDescription
                        value={String(value[discriminatorKey] ?? '')}
                        onChange={e => {
                            const nextType = e.target.value;
                            const keepName = String(value[nameKey] ?? '').trim() || `${schema.entity.title.toLowerCase().replace(/\s+/g, '-')}-1`;
                            const next = applyDefaultsForType(schema, nextType, { [nameKey]: keepName });
                            onChange(next);
                        }}
                        options={[{ value: '', label: 'Select type...' }, ...typeOptions]}
                    />
                    {errors?.[discriminatorKey] && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{errors[discriminatorKey]}</div>}
                </div>
            </div>

            {typeDef?.description && (
                <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.8, border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px', background: 'var(--sidebar-bg)' }}>
                    {typeDef.description}
                </div>
            )}

            {typeFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {typeFields
                        .filter(f => f.type !== 'stringArray' && f.type !== 'enumArray')
                        .map(renderField)}
                </div>
            )}

            {typeFields
                .filter(f => f.type === 'stringArray' || f.type === 'enumArray')
                .map(renderField)}
        </div>
    );
};
