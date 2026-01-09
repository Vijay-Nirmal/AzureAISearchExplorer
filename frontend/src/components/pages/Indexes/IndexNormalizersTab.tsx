import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';
import { JsonViewerModal } from '../../common/JsonViewerModal';

import normalizerDescriptions from '../../../data/constants/normalizerPropertyDescriptions.json';
import normalizerTypes from '../../../data/constants/normalizerTypes.json';
import tokenFilterNames from '../../../data/constants/tokenFilterNames.json';
import charFilterNames from '../../../data/constants/charFilterNames.json';
import builtInNormalizers from '../../../data/constants/lexicalNormalizer.json';

import type { CustomNormalizer, LexicalNormalizer, SearchIndex } from '../../../types/IndexModels';

interface IndexNormalizersTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type NormalizerODataType =
    | '#Microsoft.Azure.Search.CustomNormalizer'
    // allow newer types without breaking UI
    | (string & {});

type NormalizerDraft = Record<string, unknown> & {
    '@odata.type'?: NormalizerODataType;
    name?: string;
    charFilters?: string[];
    tokenFilters?: string[];
};

const descriptions = normalizerDescriptions as Record<string, string>;

const getTypeLabel = (odataType: string | undefined): string => {
    switch (odataType) {
        case '#Microsoft.Azure.Search.CustomNormalizer':
            return 'CustomNormalizer';
        default:
            return odataType || 'Unknown';
    }
};

const getNamedItems = (list: unknown[] | undefined): string[] => {
    if (!Array.isArray(list)) return [];
    const result: string[] = [];
    for (const item of list) {
        if (item && typeof item === 'object') {
            const name = (item as { name?: unknown }).name;
            if (typeof name === 'string' && name.trim()) result.push(name.trim());
        }
    }
    return Array.from(new Set(result));
};

const normalizeName = (name: string): string => (name || '').trim();

const summarizeList = (list: string[] | undefined): string => {
    const arr = (list || []).map(s => String(s).trim()).filter(Boolean);
    return arr.length ? arr.join(', ') : '-';
};

const normalizeStringList = (list: unknown): string[] => {
    if (!Array.isArray(list)) return [];
    return list.map(s => String(s).trim()).filter(Boolean);
};

const validateNormalizerName = (name: string, existingNames: Set<string>): string | null => {
    const trimmed = normalizeName(name);
    if (!trimmed) return 'Name is required.';
    if (trimmed.length > 128) return 'Name must be 128 characters or less.';

    // Must start/end with alphanumeric; allowed chars in between: letters, digits, spaces, dashes, underscores.
    const allowed = /^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9])?$/;
    if (!allowed.test(trimmed)) {
        return 'Name must start/end with alphanumeric and contain only letters, digits, spaces, dashes, or underscores.';
    }

    const lower = trimmed.toLowerCase();
    if (lower.endsWith('.microsoft') || lower.endsWith('.lucene')) {
        return "Name cannot end with '.microsoft' or '.lucene'.";
    }

    // Reserved built-in normalizer names.
    const reserved = new Set<string>([
        'asciifolding',
        'standard',
        'lowercase',
        'uppercase',
        'elision'
    ]);
    if (reserved.has(lower)) return `Name '${trimmed}' is reserved by the service.`;

    // Also protect against any additional built-in list entries if present.
    if (existingNames.has(lower)) return `A normalizer named '${trimmed}' already exists.`;

    return null;
};

const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

export const IndexNormalizersTab: React.FC<IndexNormalizersTabProps> = ({ indexDef, setIndexDef }) => {
    const [normalizerModalOpen, setNormalizerModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempNormalizer, setTempNormalizer] = useState<NormalizerDraft | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);

    const [charAddValue, setCharAddValue] = useState<string>('');
    const [tokenAddValue, setTokenAddValue] = useState<string>('');

    const [jsonModalOpen, setJsonModalOpen] = useState(false);
    const [jsonModalData, setJsonModalData] = useState<unknown>(null);
    const [jsonModalTitle, setJsonModalTitle] = useState<string>('');

    const typeOptions = useMemo(() => {
        const list = normalizerTypes as Array<{ value: string; label?: string; description?: string }>;
        return list.map(t => ({ value: t.value, label: t.label || t.value, description: t.description }));
    }, []);

    const customCharFilterNames = useMemo(() => getNamedItems(indexDef.charFilters as unknown[] | undefined), [indexDef.charFilters]);
    const customTokenFilterNames = useMemo(() => getNamedItems(indexDef.tokenFilters as unknown[] | undefined), [indexDef.tokenFilters]);

    const charFilterOptions = useMemo(() => {
        const base = (charFilterNames as Array<{ value: string; description?: string }>).map(cf => ({
            value: cf.value,
            label: cf.value,
            description: cf.description
        }));
        const custom = customCharFilterNames
            .filter(n => !base.some(b => b.value === n))
            .map(n => ({ value: n, label: n, description: 'Custom char filter (defined in index)' }));
        return [...base, ...custom];
    }, [customCharFilterNames]);

    const tokenFilterOptions = useMemo(() => {
        const base = (tokenFilterNames as Array<{ value: string; description?: string }>).map(tf => ({
            value: tf.value,
            label: tf.value,
            description: tf.description
        }));
        const custom = customTokenFilterNames
            .filter(n => !base.some(b => b.value === n))
            .map(n => ({ value: n, label: n, description: 'Custom token filter (defined in index)' }));
        return [...base, ...custom];
    }, [customTokenFilterNames]);

    const reservedBuiltInNames = useMemo(() => {
        const fromFile = (builtInNormalizers as Array<{ value: string }>).map(x => String(x.value || '').toLowerCase()).filter(Boolean);
        return new Set(fromFile);
    }, []);

    const viewJson = (title: string, data: unknown) => {
        setJsonModalTitle(title);
        setJsonModalData(data);
        setJsonModalOpen(true);
    };

    const openNewNormalizer = () => {
        const existing = (indexDef.normalizers || []) as LexicalNormalizer[];
        const draft: NormalizerDraft = {
            '@odata.type': '#Microsoft.Azure.Search.CustomNormalizer',
            name: `normalizer-${existing.length + 1}`,
            charFilters: [],
            tokenFilters: []
        };
        setEditingIndex(null);
        setTempNormalizer(draft);
        setErrorText(null);
        setCharAddValue('');
        setTokenAddValue('');
        setNormalizerModalOpen(true);
    };

    const openEditNormalizer = (idx: number) => {
        const n = ((indexDef.normalizers || []) as LexicalNormalizer[])[idx];
        if (!n) return;
        setEditingIndex(idx);
        setTempNormalizer(structuredClone(n) as NormalizerDraft);
        setErrorText(null);
        setCharAddValue('');
        setTokenAddValue('');
        setNormalizerModalOpen(true);
    };

    const deleteNormalizer = (idx: number) => {
        setIndexDef(prev => {
            const list = [...((prev.normalizers || []) as LexicalNormalizer[])];
            list.splice(idx, 1);
            return { ...prev, normalizers: list };
        });
    };

    const normalizeNormalizer = (draft: NormalizerDraft): LexicalNormalizer | null => {
        const odataType = String(draft['@odata.type'] || '').trim() as NormalizerODataType;
        const name = normalizeName(String(draft.name || ''));

        const existing = ((indexDef.normalizers || []) as LexicalNormalizer[])
            .map(x => String((x as { name?: string }).name || '').toLowerCase())
            .filter(Boolean);

        // exclude current item when editing
        const existingSet = new Set(existing);
        if (editingIndex !== null) {
            const current = ((indexDef.normalizers || []) as LexicalNormalizer[])[editingIndex];
            const currentName = String((current as { name?: string }).name || '').toLowerCase();
            if (currentName) existingSet.delete(currentName);
        }

        // include built-in names too (to avoid confusion even if service blocks anyway)
        for (const r of reservedBuiltInNames) existingSet.add(r);

        const nameError = validateNormalizerName(name, existingSet);
        if (nameError) {
            setErrorText(nameError);
            return null;
        }

        if (odataType === '#Microsoft.Azure.Search.CustomNormalizer') {
            const charFilters = normalizeStringList(draft.charFilters);
            const tokenFilters = normalizeStringList(draft.tokenFilters);

            const normalized: CustomNormalizer = {
                '@odata.type': '#Microsoft.Azure.Search.CustomNormalizer',
                name,
                charFilters: charFilters.length ? charFilters : undefined,
                tokenFilters: tokenFilters.length ? tokenFilters : undefined
            };
            setErrorText(null);
            return normalized;
        }

        // Unknown type: allow saving with trimmed name and preserved fields.
        setErrorText(null);
        return { ...draft, name } as LexicalNormalizer;
    };

    const saveFromModal = () => {
        if (!tempNormalizer) return;

        const normalized = normalizeNormalizer(tempNormalizer);
        if (!normalized) return;

        setIndexDef(prev => {
            const list = [...((prev.normalizers || []) as LexicalNormalizer[])];
            if (editingIndex === null) list.push(normalized);
            else list[editingIndex] = normalized;
            return { ...prev, normalizers: list };
        });

        setNormalizerModalOpen(false);
        setTempNormalizer(null);
        setEditingIndex(null);
        setErrorText(null);
        setCharAddValue('');
        setTokenAddValue('');
    };

    const addIfValid = (list: string[], value: string, setList: (next: string[]) => void) => {
        const v = String(value || '').trim();
        if (!v) return;
        if (list.includes(v)) return;
        setList([...list, v]);
    };

    const renderEditorModal = () => {
        if (!normalizerModalOpen || !tempNormalizer) return null;

        const odataType = String(tempNormalizer['@odata.type'] || '') as NormalizerODataType;
        const isKnownType = odataType === '#Microsoft.Azure.Search.CustomNormalizer';

        const charFilters = normalizeStringList(tempNormalizer.charFilters);
        const tokenFilters = normalizeStringList(tempNormalizer.tokenFilters);

        return (
            <Modal
                title={editingIndex === null ? 'Add Normalizer' : 'Edit Normalizer'}
                isOpen={normalizerModalOpen}
                onClose={() => {
                    setNormalizerModalOpen(false);
                    setTempNormalizer(null);
                    setEditingIndex(null);
                    setErrorText(null);
                    setCharAddValue('');
                    setTokenAddValue('');
                }}
                width="920px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={descriptions.name} /></Label>
                            <Input
                                value={String(tempNormalizer.name || '')}
                                onChange={e => setTempNormalizer({ ...tempNormalizer, name: e.target.value })}
                                placeholder="e.g. norm-keyword"
                            />
                        </div>
                        <div>
                            <Label>Type <InfoIcon tooltip={descriptions.odataType} /></Label>
                            <SelectWithDescription
                                value={String(tempNormalizer['@odata.type'] || '')}
                                onChange={e => {
                                    const nextType = e.target.value as NormalizerODataType;
                                    const name = normalizeName(String(tempNormalizer.name || '')) || 'normalizer-1';

                                    if (nextType === '#Microsoft.Azure.Search.CustomNormalizer') {
                                        const next: NormalizerDraft = {
                                            '@odata.type': '#Microsoft.Azure.Search.CustomNormalizer',
                                            name,
                                            charFilters: [],
                                            tokenFilters: []
                                        };
                                        setTempNormalizer(next);
                                        setErrorText(null);
                                        return;
                                    }

                                    setTempNormalizer({ ...tempNormalizer, '@odata.type': nextType });
                                    setErrorText(null);
                                }}
                                options={typeOptions}
                            />
                        </div>
                    </div>

                    {odataType === '#Microsoft.Azure.Search.CustomNormalizer' && (
                        <>
                            <fieldset style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                                <legend style={{ padding: '0 8px' }}>Char Filters <InfoIcon tooltip={descriptions.charFilters} /></legend>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'end' }}>
                                        <div>
                                            <Label style={{ fontSize: '12px', opacity: 0.9 }}>Add from list</Label>
                                            <SelectWithDescription
                                                value={charAddValue}
                                                onChange={e => setCharAddValue(e.target.value)}
                                                options={[{ value: '', label: 'Select char filter...' }, ...charFilterOptions]}
                                            />
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                addIfValid(charFilters, charAddValue, next => setTempNormalizer({ ...tempNormalizer, charFilters: next }));
                                                setCharAddValue('');
                                            }}
                                        >
                                            <i className="fas fa-plus"></i> Add
                                        </Button>
                                    </div>

                                    <div style={{ padding: '10px', background: '#252526', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                        {charFilters.length === 0 && (
                                            <div style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '12px' }}>None selected.</div>
                                        )}
                                        {charFilters.map((item, idx) => (
                                            <div key={`${item}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: idx === charFilters.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item}</div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <Button variant="icon" onClick={() => setTempNormalizer({ ...tempNormalizer, charFilters: moveItem(charFilters, idx, idx - 1) })} title="Move up" disabled={idx === 0}>
                                                        <i className="fas fa-arrow-up"></i>
                                                    </Button>
                                                    <Button variant="icon" onClick={() => setTempNormalizer({ ...tempNormalizer, charFilters: moveItem(charFilters, idx, idx + 1) })} title="Move down" disabled={idx === charFilters.length - 1}>
                                                        <i className="fas fa-arrow-down"></i>
                                                    </Button>
                                                    <Button
                                                        variant="icon"
                                                        onClick={() => {
                                                            const next = [...charFilters];
                                                            next.splice(idx, 1);
                                                            setTempNormalizer({ ...tempNormalizer, charFilters: next });
                                                        }}
                                                        title="Remove"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Selected: {charFilters.length} (order matters)</div>
                                </div>
                            </fieldset>

                            <fieldset style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                                <legend style={{ padding: '0 8px' }}>Token Filters <InfoIcon tooltip={descriptions.tokenFilters} /></legend>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'end' }}>
                                        <div>
                                            <Label style={{ fontSize: '12px', opacity: 0.9 }}>Add from list</Label>
                                            <SelectWithDescription
                                                value={tokenAddValue}
                                                onChange={e => setTokenAddValue(e.target.value)}
                                                options={[{ value: '', label: 'Select token filter...' }, ...tokenFilterOptions]}
                                            />
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                addIfValid(tokenFilters, tokenAddValue, next => setTempNormalizer({ ...tempNormalizer, tokenFilters: next }));
                                                setTokenAddValue('');
                                            }}
                                        >
                                            <i className="fas fa-plus"></i> Add
                                        </Button>
                                    </div>

                                    <div style={{ padding: '10px', background: '#252526', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                        {tokenFilters.length === 0 && (
                                            <div style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '12px' }}>None selected.</div>
                                        )}
                                        {tokenFilters.map((item, idx) => (
                                            <div key={`${item}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: idx === tokenFilters.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item}</div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <Button variant="icon" onClick={() => setTempNormalizer({ ...tempNormalizer, tokenFilters: moveItem(tokenFilters, idx, idx - 1) })} title="Move up" disabled={idx === 0}>
                                                        <i className="fas fa-arrow-up"></i>
                                                    </Button>
                                                    <Button variant="icon" onClick={() => setTempNormalizer({ ...tempNormalizer, tokenFilters: moveItem(tokenFilters, idx, idx + 1) })} title="Move down" disabled={idx === tokenFilters.length - 1}>
                                                        <i className="fas fa-arrow-down"></i>
                                                    </Button>
                                                    <Button
                                                        variant="icon"
                                                        onClick={() => {
                                                            const next = [...tokenFilters];
                                                            next.splice(idx, 1);
                                                            setTempNormalizer({ ...tempNormalizer, tokenFilters: next });
                                                        }}
                                                        title="Remove"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Selected: {tokenFilters.length} (order matters)</div>
                                </div>
                            </fieldset>
                        </>
                    )}

                    {!isKnownType && (
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}>
                            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '8px' }}>
                                This normalizer type is not supported by the form editor. You can still save it and/or view the raw JSON.
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => viewJson(`Normalizer: ${String(tempNormalizer.name || '') || '(unnamed)'}`, tempNormalizer)}
                            >
                                <i className="fas fa-code"></i> View JSON
                            </Button>
                        </div>
                    )}

                    {errorText && (
                        <div style={{ color: 'var(--status-error-text)', fontSize: '12px' }}>
                            {errorText}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFromModal}>Save</Button>
                    <Button onClick={() => {
                        setNormalizerModalOpen(false);
                        setTempNormalizer(null);
                        setEditingIndex(null);
                        setErrorText(null);
                        setCharAddValue('');
                        setTokenAddValue('');
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const normalizers = (indexDef.normalizers || []) as LexicalNormalizer[];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)' }}>
                <Button onClick={openNewNormalizer}><i className="fas fa-plus"></i> Add Normalizer</Button>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={descriptions.name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Type <InfoIcon tooltip={descriptions.odataType} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Char Filters <InfoIcon tooltip={descriptions.charFilters} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Token Filters <InfoIcon tooltip={descriptions.tokenFilters} /></th>
                            <th style={{ width: '220px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {normalizers.map((n, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '4px' }}>{String((n as { name?: string }).name || '-')}</td>
                                <td style={{ padding: '4px' }}>{getTypeLabel(String((n as { '@odata.type'?: string })['@odata.type'] || ''))}</td>
                                <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.8, fontSize: '12px' }}>{summarizeList((n as { charFilters?: string[] }).charFilters)}</td>
                                <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.8, fontSize: '12px' }}>{summarizeList((n as { tokenFilters?: string[] }).tokenFilters)}</td>
                                <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                    <Button variant="secondary" onClick={() => openEditNormalizer(i)}>Edit</Button>
                                    <Button
                                        variant="icon"
                                        onClick={() => viewJson(`Normalizer: ${String((n as { name?: string }).name || '') || '(unnamed)'}`, n)}
                                        title="View JSON"
                                    >
                                        <i className="fas fa-code"></i>
                                    </Button>
                                    <Button variant="icon" onClick={() => deleteNormalizer(i)} title="Delete">
                                        <i className="fas fa-trash"></i>
                                    </Button>
                                </td>
                            </tr>
                        ))}

                        {normalizers.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-color)', opacity: 0.7 }}>
                                    No normalizers configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {renderEditorModal()}

            <JsonViewerModal
                isOpen={jsonModalOpen}
                onClose={() => {
                    setJsonModalOpen(false);
                    setJsonModalData(null);
                    setJsonModalTitle('');
                }}
                title={jsonModalTitle}
                data={jsonModalData}
            />
        </div>
    );
};
