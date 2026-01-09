import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';
import { JsonViewerModal } from '../../common/JsonViewerModal';

import charFilterDescriptions from '../../../data/constants/charFilterPropertyDescriptions.json';
import charFilterTypes from '../../../data/constants/charFilterTypes.json';

import type {
    CharFilter,
    MappingCharFilter,
    PatternReplaceCharFilter,
    SearchIndex
} from '../../../types/IndexModels';

interface IndexCharFiltersTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type CharFilterODataType =
    | '#Microsoft.Azure.Search.MappingCharFilter'
    | '#Microsoft.Azure.Search.PatternReplaceCharFilter'
    // allow newer types without breaking UI
    | (string & {});

type CharFilterDraft = Record<string, unknown> & {
    '@odata.type'?: CharFilterODataType;
    name?: string;
    mappings?: string[];
    pattern?: string;
    replacement?: string;
};

const descriptions = charFilterDescriptions as Record<string, string>;

const isMapping = (cf: CharFilterDraft | CharFilter): cf is MappingCharFilter => {
    return (cf as { '@odata.type'?: string })['@odata.type'] === '#Microsoft.Azure.Search.MappingCharFilter';
};

const isPatternReplace = (cf: CharFilterDraft | CharFilter): cf is PatternReplaceCharFilter => {
    return (cf as { '@odata.type'?: string })['@odata.type'] === '#Microsoft.Azure.Search.PatternReplaceCharFilter';
};

const getTypeLabel = (odataType: string | undefined): string => {
    switch (odataType) {
        case '#Microsoft.Azure.Search.MappingCharFilter':
            return 'MappingCharFilter';
        case '#Microsoft.Azure.Search.PatternReplaceCharFilter':
            return 'PatternReplaceCharFilter';
        default:
            return odataType || 'Unknown';
    }
};

const summarizeCharFilter = (cf: CharFilter): string => {
    if (isMapping(cf)) {
        return (cf.mappings || []).length ? `mappings: ${(cf.mappings || []).length}` : '-';
    }
    if (isPatternReplace(cf)) {
        const parts: string[] = [];
        if (cf.pattern) parts.push(`pattern: ${cf.pattern}`);
        if (typeof cf.replacement === 'string') parts.push(`replacement: ${cf.replacement || '(empty)'}`);
        return parts.join(' • ') || '-';
    }
    return 'Unknown char filter type';
};

const normalizeName = (name: string): string => (name || '').trim();

export const IndexCharFiltersTab: React.FC<IndexCharFiltersTabProps> = ({ indexDef, setIndexDef }) => {
    const [charFilterModalOpen, setCharFilterModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempCharFilter, setTempCharFilter] = useState<CharFilterDraft | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);

    const [jsonModalOpen, setJsonModalOpen] = useState(false);
    const [jsonModalData, setJsonModalData] = useState<unknown>(null);
    const [jsonModalTitle, setJsonModalTitle] = useState<string>('');

    const typeOptions = useMemo(() => {
        const list = charFilterTypes as Array<{ value: string; label?: string; description?: string }>;
        return list.map(t => ({ value: t.value, label: t.label || t.value, description: t.description }));
    }, []);

    const openNewCharFilter = () => {
        const existing = (indexDef.charFilters || []) as CharFilter[];
        const draft: CharFilterDraft = {
            '@odata.type': '#Microsoft.Azure.Search.MappingCharFilter',
            name: `charfilter-${existing.length + 1}`,
            mappings: ['a=>b']
        };
        setEditingIndex(null);
        setTempCharFilter(draft);
        setErrorText(null);
        setCharFilterModalOpen(true);
    };

    const openEditCharFilter = (idx: number) => {
        const cf = ((indexDef.charFilters || []) as CharFilter[])[idx];
        if (!cf) return;
        setEditingIndex(idx);
        setTempCharFilter(structuredClone(cf) as CharFilterDraft);
        setErrorText(null);
        setCharFilterModalOpen(true);
    };

    const deleteCharFilter = (idx: number) => {
        setIndexDef(prev => {
            const list = [...((prev.charFilters || []) as CharFilter[])];
            list.splice(idx, 1);
            return { ...prev, charFilters: list };
        });
    };

    const viewJson = (title: string, data: unknown) => {
        setJsonModalTitle(title);
        setJsonModalData(data);
        setJsonModalOpen(true);
    };

    const normalizeCharFilter = (draft: CharFilterDraft): CharFilter | null => {
        const odataType = String(draft['@odata.type'] || '').trim() as CharFilterODataType;
        const name = normalizeName(String(draft.name || ''));
        if (!name) {
            setErrorText('Name is required.');
            return null;
        }

        if (odataType === '#Microsoft.Azure.Search.MappingCharFilter') {
            const mappings = Array.isArray(draft.mappings)
                ? draft.mappings.map(s => String(s).trim()).filter(Boolean)
                : [];

            if (mappings.length === 0) {
                setErrorText('At least one mapping is required (e.g., "a=>b").');
                return null;
            }

            const normalized: MappingCharFilter = {
                '@odata.type': '#Microsoft.Azure.Search.MappingCharFilter',
                name,
                mappings
            };
            setErrorText(null);
            return normalized;
        }

        if (odataType === '#Microsoft.Azure.Search.PatternReplaceCharFilter') {
            const pattern = String(draft.pattern || '').trim();
            const replacement = String(draft.replacement ?? '');

            if (!pattern) {
                setErrorText('Pattern is required.');
                return null;
            }

            const normalized: PatternReplaceCharFilter = {
                '@odata.type': '#Microsoft.Azure.Search.PatternReplaceCharFilter',
                name,
                pattern,
                replacement
            };
            setErrorText(null);
            return normalized;
        }

        // Unknown type: allow saving with trimmed name and preserved fields.
        setErrorText(null);
        return { ...draft, name } as CharFilter;
    };

    const saveFromModal = () => {
        if (!tempCharFilter) return;

        const normalized = normalizeCharFilter(tempCharFilter);
        if (!normalized) return;

        setIndexDef(prev => {
            const list = [...((prev.charFilters || []) as CharFilter[])];
            if (editingIndex === null) list.push(normalized);
            else list[editingIndex] = normalized;
            return { ...prev, charFilters: list };
        });

        setCharFilterModalOpen(false);
        setTempCharFilter(null);
        setEditingIndex(null);
        setErrorText(null);
    };

    const renderMappingsEditor = (draft: MappingCharFilter) => {
        const mappings = draft.mappings || [];
        return (
            <fieldset style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                <legend style={{ padding: '0 8px' }}>Mappings <InfoIcon tooltip={descriptions.mappings} /></legend>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mappings.map((m, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                            <Input
                                value={m}
                                onChange={e => {
                                    const next = [...mappings];
                                    next[idx] = e.target.value;
                                    setTempCharFilter({ ...draft, mappings: next });
                                }}
                                placeholder='e.g. a=>b'
                            />
                            <Button
                                variant="icon"
                                onClick={() => {
                                    const next = [...mappings];
                                    next.splice(idx, 1);
                                    setTempCharFilter({ ...draft, mappings: next });
                                }}
                                title="Remove mapping"
                            >
                                <i className="fas fa-trash"></i>
                            </Button>
                        </div>
                    ))}

                    {mappings.length === 0 && (
                        <div style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '12px' }}>
                            No mappings yet.
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            Tip: mapping format is <span style={{ fontFamily: 'var(--font-mono)' }}>a=&gt;b</span>
                        </div>
                        <Button
                            onClick={() => setTempCharFilter({ ...draft, mappings: [...mappings, ''] })}
                        >
                            <i className="fas fa-plus"></i> Add Mapping
                        </Button>
                    </div>
                </div>
            </fieldset>
        );
    };

    const renderPatternReplaceEditor = (draft: PatternReplaceCharFilter) => {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                    <Label>Pattern <InfoIcon tooltip={descriptions.pattern} /></Label>
                    <Input
                        value={draft.pattern || ''}
                        onChange={e => setTempCharFilter({ ...draft, pattern: e.target.value })}
                        placeholder="e.g. \\s+"
                    />
                </div>
                <div>
                    <Label>Replacement <InfoIcon tooltip={descriptions.replacement} /></Label>
                    <Input
                        value={draft.replacement ?? ''}
                        onChange={e => setTempCharFilter({ ...draft, replacement: e.target.value })}
                        placeholder="e.g. "
                    />
                </div>
            </div>
        );
    };

    const renderEditorModal = () => {
        if (!charFilterModalOpen || !tempCharFilter) return null;

        const odataType = String(tempCharFilter['@odata.type'] || '') as CharFilterODataType;
        const isKnownType =
            odataType === '#Microsoft.Azure.Search.MappingCharFilter' ||
            odataType === '#Microsoft.Azure.Search.PatternReplaceCharFilter';

        return (
            <Modal
                title={editingIndex === null ? 'Add Char Filter' : 'Edit Char Filter'}
                isOpen={charFilterModalOpen}
                onClose={() => {
                    setCharFilterModalOpen(false);
                    setTempCharFilter(null);
                    setEditingIndex(null);
                    setErrorText(null);
                }}
                width="860px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={descriptions.name} /></Label>
                            <Input
                                value={String(tempCharFilter.name || '')}
                                onChange={e => setTempCharFilter({ ...tempCharFilter, name: e.target.value })}
                                placeholder="e.g. cf-normalize"
                            />
                        </div>
                        <div>
                            <Label>Type <InfoIcon tooltip={descriptions.odataType} /></Label>
                            <SelectWithDescription
                                value={String(tempCharFilter['@odata.type'] || '')}
                                onChange={e => {
                                    const nextType = e.target.value as CharFilterODataType;
                                    const name = normalizeName(String(tempCharFilter.name || '')) || 'charfilter-1';

                                    if (nextType === '#Microsoft.Azure.Search.MappingCharFilter') {
                                        const next: CharFilterDraft = {
                                            '@odata.type': '#Microsoft.Azure.Search.MappingCharFilter',
                                            name,
                                            mappings: ['a=>b']
                                        };
                                        setTempCharFilter(next);
                                        setErrorText(null);
                                        return;
                                    }

                                    if (nextType === '#Microsoft.Azure.Search.PatternReplaceCharFilter') {
                                        const next: CharFilterDraft = {
                                            '@odata.type': '#Microsoft.Azure.Search.PatternReplaceCharFilter',
                                            name,
                                            pattern: '\\s+',
                                            replacement: ' '
                                        };
                                        setTempCharFilter(next);
                                        setErrorText(null);
                                        return;
                                    }

                                    setTempCharFilter({ ...tempCharFilter, '@odata.type': nextType });
                                    setErrorText(null);
                                }}
                                options={typeOptions}
                            />
                        </div>
                    </div>

                    {odataType === '#Microsoft.Azure.Search.MappingCharFilter' && isMapping(tempCharFilter) && (
                        renderMappingsEditor(tempCharFilter as MappingCharFilter)
                    )}

                    {odataType === '#Microsoft.Azure.Search.PatternReplaceCharFilter' && isPatternReplace(tempCharFilter) && (
                        renderPatternReplaceEditor(tempCharFilter as PatternReplaceCharFilter)
                    )}

                    {!isKnownType && (
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}>
                            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '8px' }}>
                                This char filter type is not supported by the form editor. You can still save it and/or view the raw JSON.
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => viewJson(`Char Filter: ${String(tempCharFilter.name || '') || '(unnamed)'}`, tempCharFilter)}
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
                        setCharFilterModalOpen(false);
                        setTempCharFilter(null);
                        setEditingIndex(null);
                        setErrorText(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const charFilters = (indexDef.charFilters || []) as CharFilter[];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)' }}>
                <Button onClick={openNewCharFilter}><i className="fas fa-plus"></i> Add Char Filter</Button>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={descriptions.name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Type <InfoIcon tooltip={descriptions.odataType} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Details</th>
                            <th style={{ width: '170px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {charFilters.map((cf, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '4px' }}>{String((cf as { name?: string }).name || '-')}</td>
                                <td style={{ padding: '4px' }}>{getTypeLabel(String((cf as { '@odata.type'?: string })['@odata.type'] || ''))}</td>
                                <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.8, fontSize: '12px' }}>{summarizeCharFilter(cf)}</td>
                                <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                    <Button variant="secondary" onClick={() => openEditCharFilter(i)}>Edit</Button>
                                    <Button
                                        variant="icon"
                                        onClick={() => viewJson(`Char Filter: ${String((cf as { name?: string }).name || '') || '(unnamed)'}`, cf)}
                                        title="View JSON"
                                    >
                                        <i className="fas fa-code"></i>
                                    </Button>
                                    <Button variant="icon" onClick={() => deleteCharFilter(i)} title="Delete">
                                        <i className="fas fa-trash"></i>
                                    </Button>
                                </td>
                            </tr>
                        ))}

                        {charFilters.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-color)', opacity: 0.7 }}>
                                    No char filters configured
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
