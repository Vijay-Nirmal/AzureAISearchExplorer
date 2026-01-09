import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import analyzerDescriptions from '../../../data/constants/analyzerPropertyDescriptions.json';
import analyzerTypes from '../../../data/constants/analyzerTypes.json';
import charFilterNames from '../../../data/constants/charFilterNames.json';
import tokenFilterNames from '../../../data/constants/tokenFilterNames.json';
import lexicalTokenizerNames from '../../../data/constants/lexicalTokenizerNames.json';
import regexFlags from '../../../data/constants/regexFlags.json';

import type {
    CustomAnalyzer,
    LexicalAnalyzer,
    LuceneStandardAnalyzer,
    PatternAnalyzer,
    SearchIndex,
    StopAnalyzer
} from '../../../types/IndexModels';

interface IndexAnalyzersTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type AnalyzerODataType =
    | '#Microsoft.Azure.Search.CustomAnalyzer'
    | '#Microsoft.Azure.Search.StandardAnalyzer'
    | '#Microsoft.Azure.Search.PatternAnalyzer'
    | '#Microsoft.Azure.Search.StopAnalyzer';

const splitList = (input: string): string[] => {
    return input
        .split(/\r?\n|,/g)
        .map(s => s.trim())
        .filter(Boolean);
};

const joinList = (list: string[] | undefined): string => {
    return (list || []).join(', ');
};

const summarizeAnalyzer = (a: LexicalAnalyzer): string => {
    const type = (a as any)['@odata.type'] as string | undefined;
    if (type === '#Microsoft.Azure.Search.CustomAnalyzer') {
        const ca = a as CustomAnalyzer;
        const parts: string[] = [];
        if (ca.tokenizer) parts.push(`tokenizer: ${ca.tokenizer}`);
        if ((ca.charFilters || []).length) parts.push(`charFilters: ${(ca.charFilters || []).length}`);
        if ((ca.tokenFilters || []).length) parts.push(`tokenFilters: ${(ca.tokenFilters || []).length}`);
        return parts.join(' • ') || '-';
    }
    if (type === '#Microsoft.Azure.Search.StandardAnalyzer') {
        const sa = a as LuceneStandardAnalyzer;
        const parts: string[] = [];
        if (typeof sa.maxTokenLength === 'number') parts.push(`maxTokenLength: ${sa.maxTokenLength}`);
        if ((sa.stopwords || []).length) parts.push(`stopwords: ${(sa.stopwords || []).length}`);
        return parts.join(' • ') || '-';
    }
    if (type === '#Microsoft.Azure.Search.PatternAnalyzer') {
        const pa = a as PatternAnalyzer;
        const parts: string[] = [];
        if (pa.pattern) parts.push(`pattern: ${pa.pattern}`);
        if (typeof pa.lowercase === 'boolean') parts.push(`lowercase: ${pa.lowercase ? 'true' : 'false'}`);
        if ((pa.flags || []).length) parts.push(`flags: ${(pa.flags || []).length}`);
        if ((pa.stopwords || []).length) parts.push(`stopwords: ${(pa.stopwords || []).length}`);
        return parts.join(' • ') || '-';
    }
    if (type === '#Microsoft.Azure.Search.StopAnalyzer') {
        const st = a as StopAnalyzer;
        return (st.stopwords || []).length ? `stopwords: ${(st.stopwords || []).length}` : '-';
    }
    return 'Unknown analyzer type';
};

const getTypeLabel = (odataType: string | undefined): string => {
    switch (odataType) {
        case '#Microsoft.Azure.Search.CustomAnalyzer':
            return 'CustomAnalyzer';
        case '#Microsoft.Azure.Search.StandardAnalyzer':
            return 'LuceneStandardAnalyzer';
        case '#Microsoft.Azure.Search.PatternAnalyzer':
            return 'PatternAnalyzer';
        case '#Microsoft.Azure.Search.StopAnalyzer':
            return 'StopAnalyzer';
        default:
            return odataType || 'Unknown';
    }
};

export const IndexAnalyzersTab: React.FC<IndexAnalyzersTabProps> = ({ indexDef, setIndexDef }) => {
    const [analyzerModalOpen, setAnalyzerModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempAnalyzer, setTempAnalyzer] = useState<LexicalAnalyzer | null>(null);

    const analyzerTypeOptions = useMemo(() => {
        const list = analyzerTypes as Array<{ value: string; description?: string }>;
        return list.map(t => ({ value: t.value, label: t.value, description: t.description }));
    }, []);

    const tokenizerOptions = useMemo(() => {
        const list = lexicalTokenizerNames as Array<{ value: string; description?: string }>;
        return list.map(t => ({ value: t.value, label: t.value, description: t.description }));
    }, []);

    const charFilterOptions = useMemo(() => {
        const list = charFilterNames as Array<{ value: string; description?: string }>;
        return list.map(c => ({ value: c.value, label: c.value, description: c.description }));
    }, []);

    const tokenFilterOptions = useMemo(() => {
        const list = tokenFilterNames as Array<{ value: string; description?: string }>;
        return list.map(t => ({ value: t.value, label: t.value, description: t.description }));
    }, []);

    const regexFlagOptions = useMemo(() => {
        const list = regexFlags as Array<{ value: string; description?: string }>;
        return list.map(f => ({ value: f.value, label: f.value, description: f.description }));
    }, []);

    const openNewAnalyzer = () => {
        const existing = (indexDef.analyzers || []) as LexicalAnalyzer[];
        const draft: CustomAnalyzer = {
            '@odata.type': '#Microsoft.Azure.Search.CustomAnalyzer',
            name: `analyzer-${existing.length + 1}`,
            tokenizer: 'standard_v2',
            charFilters: [],
            tokenFilters: []
        };
        setEditingIndex(null);
        setTempAnalyzer(draft);
        setAnalyzerModalOpen(true);
    };

    const openEditAnalyzer = (idx: number) => {
        const an = ((indexDef.analyzers || []) as LexicalAnalyzer[])[idx];
        if (!an) return;
        setEditingIndex(idx);
        setTempAnalyzer(structuredClone(an));
        setAnalyzerModalOpen(true);
    };

    const deleteAnalyzer = (idx: number) => {
        setIndexDef(prev => {
            const list = [...((prev.analyzers || []) as LexicalAnalyzer[])];
            list.splice(idx, 1);
            return { ...prev, analyzers: list };
        });
    };

    const normalizeAnalyzer = (draft: LexicalAnalyzer): LexicalAnalyzer | null => {
        const odataType = ((draft as any)['@odata.type'] || '') as AnalyzerODataType | '';
        const name = ((draft as any).name || '').trim();
        if (!name) return null;

        if (odataType === '#Microsoft.Azure.Search.CustomAnalyzer') {
            const tokenizer = String((draft as any).tokenizer || '').trim();
            if (!tokenizer) return null;
            const charFilters = Array.isArray((draft as any).charFilters) ? (draft as any).charFilters.map((s: string) => String(s).trim()).filter(Boolean) : [];
            const tokenFilters = Array.isArray((draft as any).tokenFilters) ? (draft as any).tokenFilters.map((s: string) => String(s).trim()).filter(Boolean) : [];
            const normalized: CustomAnalyzer = {
                '@odata.type': '#Microsoft.Azure.Search.CustomAnalyzer',
                name,
                tokenizer,
                ...(charFilters.length ? { charFilters } : {}),
                ...(tokenFilters.length ? { tokenFilters } : {})
            };
            return normalized;
        }

        if (odataType === '#Microsoft.Azure.Search.StandardAnalyzer') {
            const raw = String((draft as any).maxTokenLength ?? '').trim();
            const parsed = raw ? Number.parseInt(raw, 10) : NaN;
            const maxTokenLength = Number.isFinite(parsed) ? Math.min(300, Math.max(1, parsed)) : undefined;
            const stopwords = Array.isArray((draft as any).stopwords)
                ? (draft as any).stopwords.map((s: string) => String(s).trim()).filter(Boolean)
                : splitList(String((draft as any).stopwordsText || ''));

            const normalized: LuceneStandardAnalyzer = {
                '@odata.type': '#Microsoft.Azure.Search.StandardAnalyzer',
                name,
                ...(typeof maxTokenLength === 'number' ? { maxTokenLength } : {}),
                ...(stopwords.length ? { stopwords } : {})
            };
            return normalized;
        }

        if (odataType === '#Microsoft.Azure.Search.PatternAnalyzer') {
            const flags = Array.isArray((draft as any).flags) ? (draft as any).flags.map((s: string) => String(s).trim()).filter(Boolean) : [];
            const lowercase = typeof (draft as any).lowercase === 'boolean' ? (draft as any).lowercase : undefined;
            const pattern = String((draft as any).pattern || '').trim();
            const stopwords = Array.isArray((draft as any).stopwords)
                ? (draft as any).stopwords.map((s: string) => String(s).trim()).filter(Boolean)
                : splitList(String((draft as any).stopwordsText || ''));

            const normalized: PatternAnalyzer = {
                '@odata.type': '#Microsoft.Azure.Search.PatternAnalyzer',
                name,
                ...(pattern ? { pattern } : {}),
                ...(typeof lowercase === 'boolean' ? { lowercase } : {}),
                ...(flags.length ? { flags } : {}),
                ...(stopwords.length ? { stopwords } : {})
            };
            return normalized;
        }

        if (odataType === '#Microsoft.Azure.Search.StopAnalyzer') {
            const stopwords = Array.isArray((draft as any).stopwords)
                ? (draft as any).stopwords.map((s: string) => String(s).trim()).filter(Boolean)
                : splitList(String((draft as any).stopwordsText || ''));
            const normalized: StopAnalyzer = {
                '@odata.type': '#Microsoft.Azure.Search.StopAnalyzer',
                name,
                ...(stopwords.length ? { stopwords } : {})
            };
            return normalized;
        }

        // unknown type: keep minimally
        return { ...(draft as any), name } as LexicalAnalyzer;
    };

    const saveFromModal = () => {
        if (!tempAnalyzer) return;

        const normalized = normalizeAnalyzer(tempAnalyzer);
        if (!normalized) return;

        setIndexDef(prev => {
            const list = [...((prev.analyzers || []) as LexicalAnalyzer[])];
            if (editingIndex === null) list.push(normalized);
            else list[editingIndex] = normalized;
            return { ...prev, analyzers: list };
        });

        setAnalyzerModalOpen(false);
        setTempAnalyzer(null);
        setEditingIndex(null);
    };

    const renderMultiSelect = (
        title: string,
        tooltip: string,
        options: Array<{ value: string; label?: string; description?: string }>,
        selected: string[] | undefined,
        onChange: (next: string[]) => void
    ) => {
        const selectedSet = new Set(selected || []);
        return (
            <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                <legend style={{ padding: '0 8px' }}>{title} <InfoIcon tooltip={tooltip} /></legend>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '10px 16px',
                        padding: '12px',
                        backgroundColor: '#252526',
                        borderRadius: '4px',
                        alignItems: 'start'
                    }}
                >
                    {options.length === 0 && (
                        <div style={{ color: '#888', fontSize: '12px' }}>
                            No options available
                        </div>
                    )}

                    {options.map(opt => (
                        <label
                            key={opt.value}
                            style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                minHeight: '22px',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}
                            title={opt.label || opt.value}
                        >
                            <input
                                type="checkbox"
                                checked={selectedSet.has(opt.value)}
                                onChange={e => {
                                    const set = new Set(selected || []);
                                    if (e.target.checked) set.add(opt.value);
                                    else set.delete(opt.value);
                                    onChange(Array.from(set));
                                }}
                                style={{ margin: 0 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.2, minWidth: 0 }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label || opt.value}</span>
                                {opt.description && (
                                    <span
                                        onClick={(e) => {
                                            // Don't toggle the checkbox when clicking the tooltip icon
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

                <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
                    <span>Selected: {(selected || []).length}</span>
                </div>
            </fieldset>
        );
    };

    const renderEditorModal = () => {
        if (!analyzerModalOpen || !tempAnalyzer) return null;

        const odataType = ((tempAnalyzer as any)['@odata.type'] || '') as AnalyzerODataType | '';

        return (
            <Modal
                title={editingIndex === null ? 'Add Analyzer' : 'Edit Analyzer'}
                isOpen={analyzerModalOpen}
                onClose={() => {
                    setAnalyzerModalOpen(false);
                    setTempAnalyzer(null);
                    setEditingIndex(null);
                }}
                width="860px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={(analyzerDescriptions as any).name} /></Label>
                            <Input
                                value={String((tempAnalyzer as any).name || '')}
                                onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), name: e.target.value })}
                                placeholder="e.g. analyzer-default"
                            />
                        </div>

                        <div>
                            <Label>Type <InfoIcon tooltip={(analyzerDescriptions as any)['@odata.type']} /></Label>
                            <SelectWithDescription
                                value={String((tempAnalyzer as any)['@odata.type'] || '')}
                                onChange={e => {
                                    const nextType = e.target.value as AnalyzerODataType;
                                    const name = String((tempAnalyzer as any).name || '').trim() || 'analyzer-1';

                                    if (nextType === '#Microsoft.Azure.Search.CustomAnalyzer') {
                                        const next: CustomAnalyzer = {
                                            '@odata.type': nextType,
                                            name,
                                            tokenizer: 'standard_v2',
                                            charFilters: [],
                                            tokenFilters: []
                                        };
                                        setTempAnalyzer(next);
                                        return;
                                    }
                                    if (nextType === '#Microsoft.Azure.Search.StandardAnalyzer') {
                                        const next: LuceneStandardAnalyzer = {
                                            '@odata.type': nextType,
                                            name,
                                            maxTokenLength: 255,
                                            stopwords: []
                                        };
                                        setTempAnalyzer(next);
                                        return;
                                    }
                                    if (nextType === '#Microsoft.Azure.Search.PatternAnalyzer') {
                                        const next: PatternAnalyzer = {
                                            '@odata.type': nextType,
                                            name,
                                            lowercase: true,
                                            pattern: '\\W+',
                                            flags: [],
                                            stopwords: []
                                        };
                                        setTempAnalyzer(next);
                                        return;
                                    }
                                    if (nextType === '#Microsoft.Azure.Search.StopAnalyzer') {
                                        const next: StopAnalyzer = {
                                            '@odata.type': nextType,
                                            name,
                                            stopwords: []
                                        };
                                        setTempAnalyzer(next);
                                        return;
                                    }

                                    setTempAnalyzer({ ...(tempAnalyzer as any), '@odata.type': nextType } as any);
                                }}
                                options={analyzerTypeOptions}
                            />
                        </div>
                    </div>

                    {odataType === '#Microsoft.Azure.Search.CustomAnalyzer' && (
                        <>
                            <div>
                                <Label>Tokenizer <InfoIcon tooltip={(analyzerDescriptions as any).tokenizer} /></Label>
                                <SelectWithDescription
                                    value={String((tempAnalyzer as any).tokenizer || '')}
                                    onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), tokenizer: e.target.value })}
                                    options={tokenizerOptions}
                                />
                            </div>

                            {renderMultiSelect(
                                'Char Filters',
                                (analyzerDescriptions as any).charFilters,
                                charFilterOptions,
                                (tempAnalyzer as any).charFilters || [],
                                (next) => setTempAnalyzer({ ...(tempAnalyzer as any), charFilters: next })
                            )}

                            {renderMultiSelect(
                                'Token Filters',
                                (analyzerDescriptions as any).tokenFilters,
                                tokenFilterOptions,
                                (tempAnalyzer as any).tokenFilters || [],
                                (next) => setTempAnalyzer({ ...(tempAnalyzer as any), tokenFilters: next })
                            )}
                        </>
                    )}

                    {odataType === '#Microsoft.Azure.Search.StandardAnalyzer' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Max Token Length <InfoIcon tooltip={(analyzerDescriptions as any).maxTokenLength} /></Label>
                                    <Input
                                        type="number"
                                        value={String((tempAnalyzer as any).maxTokenLength ?? '')}
                                        onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), maxTokenLength: e.target.value })}
                                        min={1}
                                        max={300}
                                        placeholder="255"
                                    />
                                </div>
                                <div>
                                    <Label>Stopwords <InfoIcon tooltip={(analyzerDescriptions as any).stopwords} /></Label>
                                    <Input
                                        value={joinList((tempAnalyzer as any).stopwords)}
                                        onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), stopwords: splitList(e.target.value) })}
                                        placeholder="Comma or newline separated"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {odataType === '#Microsoft.Azure.Search.PatternAnalyzer' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Pattern <InfoIcon tooltip={(analyzerDescriptions as any).pattern} /></Label>
                                    <Input
                                        value={String((tempAnalyzer as any).pattern ?? '')}
                                        onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), pattern: e.target.value })}
                                        placeholder="\\W+"
                                    />
                                </div>
                                <div>
                                    <Label>Lowercase <InfoIcon tooltip={(analyzerDescriptions as any).lowercase} /></Label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                        <input
                                            type="checkbox"
                                            checked={typeof (tempAnalyzer as any).lowercase === 'boolean' ? (tempAnalyzer as any).lowercase : true}
                                            onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), lowercase: e.target.checked })}
                                        />
                                        <span>Convert terms to lower case</span>
                                    </label>
                                </div>
                            </div>

                            {renderMultiSelect(
                                'Regex Flags',
                                (analyzerDescriptions as any).flags,
                                regexFlagOptions,
                                (tempAnalyzer as any).flags || [],
                                (next) => setTempAnalyzer({ ...(tempAnalyzer as any), flags: next })
                            )}

                            <div>
                                <Label>Stopwords <InfoIcon tooltip={(analyzerDescriptions as any).stopwords} /></Label>
                                <Input
                                    value={joinList((tempAnalyzer as any).stopwords)}
                                    onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), stopwords: splitList(e.target.value) })}
                                    placeholder="Comma or newline separated"
                                />
                            </div>
                        </>
                    )}

                    {odataType === '#Microsoft.Azure.Search.StopAnalyzer' && (
                        <div>
                            <Label>Stopwords <InfoIcon tooltip={(analyzerDescriptions as any).stopwords} /></Label>
                            <Input
                                value={joinList((tempAnalyzer as any).stopwords)}
                                onChange={e => setTempAnalyzer({ ...(tempAnalyzer as any), stopwords: splitList(e.target.value) })}
                                placeholder="Comma or newline separated"
                            />
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFromModal}>Save</Button>
                    <Button onClick={() => {
                        setAnalyzerModalOpen(false);
                        setTempAnalyzer(null);
                        setEditingIndex(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const analyzers = (indexDef.analyzers || []) as LexicalAnalyzer[];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444' }}>
                <Button onClick={openNewAnalyzer}><i className="fas fa-plus"></i> Add Analyzer</Button>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={(analyzerDescriptions as any).name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Type <InfoIcon tooltip={(analyzerDescriptions as any)['@odata.type']} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Details</th>
                            <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analyzers.map((an, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '4px' }}>{String((an as any).name || '-')}</td>
                                <td style={{ padding: '4px' }}>{getTypeLabel((an as any)['@odata.type'])}</td>
                                <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>{summarizeAnalyzer(an)}</td>
                                <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                    <Button variant="secondary" onClick={() => openEditAnalyzer(i)}>Edit</Button>
                                    <Button variant="icon" onClick={() => deleteAnalyzer(i)}><i className="fas fa-trash"></i></Button>
                                </td>
                            </tr>
                        ))}

                        {analyzers.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                    No analyzers configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {renderEditorModal()}
        </div>
    );
};
