import React, { useMemo } from 'react';
import { Button } from '../../common/Button';
import { InfoIcon } from '../../common/InfoIcon';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import similarityDescriptions from '../../../data/constants/similarityPropertyDescriptions.json';
import similarityTypes from '../../../data/constants/similarityTypes.json';

import type { SearchIndex } from '../../../types/IndexModels';

interface IndexSimilarityTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type SimilarityKind = 'default' | 'classic' | 'bm25' | 'custom';

type ClassicSimilarity = {
    '@odata.type': '#Microsoft.Azure.Search.ClassicSimilarity' | (string & {});
};

type BM25Similarity = {
    '@odata.type': '#Microsoft.Azure.Search.BM25Similarity' | (string & {});
    b?: number;
    k1?: number;
};

type Similarity = ClassicSimilarity | BM25Similarity | (Record<string, unknown> & { '@odata.type'?: string });

const getOdataType = (similarity: unknown): string | undefined => {
    if (!similarity || typeof similarity !== 'object') return undefined;
    const raw = (similarity as Record<string, unknown>)['@odata.type'];
    return typeof raw === 'string' ? raw : undefined;
};

const getSimilarityKind = (similarity: unknown): SimilarityKind => {
    if (similarity === undefined || similarity === null) return 'default';
    if (typeof similarity !== 'object') return 'custom';

    const odataType = getOdataType(similarity);
    if (!odataType) return 'custom';
    if (odataType.includes('BM25Similarity')) return 'bm25';
    if (odataType.includes('ClassicSimilarity')) return 'classic';
    return 'custom';
};

const parseOptionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return undefined;
    return n;
};

export const IndexSimilarityTab: React.FC<IndexSimilarityTabProps> = ({ indexDef, setIndexDef }) => {
    const similarity = indexDef.similarity as Similarity | undefined;
    const kind = getSimilarityKind(similarity);

    const typeOptions = useMemo(() => {
        const list = similarityTypes as Array<{ value: string; description?: string }>;
        const base = list.map(t => {
            const label = t.value === 'default'
                ? 'Default (ClassicSimilarity)'
                : t.value === 'classic'
                    ? 'ClassicSimilarity'
                    : t.value === 'bm25'
                        ? 'BM25Similarity'
                        : t.value;

            return { value: t.value, label, description: t.description };
        });

        if (kind === 'custom') {
            base.push({
                value: 'custom',
                label: 'Custom / Unknown',
                description: 'A similarity object exists but is not recognized. You can view it as JSON, reset to default, or switch to a known type.'
            });
        }

        return base;
    }, [kind]);

    const setSimilarityKind = (nextKind: SimilarityKind) => {
        setIndexDef(prev => {
            if (nextKind === 'default') {
                const next: SearchIndex = { ...prev };
                delete (next as unknown as Record<string, unknown>)['similarity'];
                return next;
            }

            if (nextKind === 'classic') {
                const next: SearchIndex = { ...prev };
                next.similarity = { '@odata.type': '#Microsoft.Azure.Search.ClassicSimilarity' };
                return next;
            }

            if (nextKind === 'bm25') {
                const existing = prev.similarity;
                const existingObj = (existing && typeof existing === 'object') ? (existing as Record<string, unknown>) : undefined;
                const existingB = typeof existingObj?.['b'] === 'number' ? (existingObj['b'] as number) : undefined;
                const existingK1 = typeof existingObj?.['k1'] === 'number' ? (existingObj['k1'] as number) : undefined;

                const draft: BM25Similarity = {
                    '@odata.type': '#Microsoft.Azure.Search.BM25Similarity',
                    b: existingB ?? 0.75,
                    k1: existingK1 ?? 1.2
                };

                const next: SearchIndex = { ...prev };
                next.similarity = draft;
                return next;
            }

            // custom: keep as-is
            return prev;
        });
    };

    const bm25 = (kind === 'bm25' ? similarity : undefined) as BM25Similarity | undefined;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    padding: '8px',
                    backgroundColor: 'var(--sidebar-bg)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setSimilarityKind('default')}
                        disabled={kind === 'default'}
                    >
                        <i className="fas fa-undo"></i> Reset to Default
                    </Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)' }}>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>
                        Similarity is set at index creation time
                    </span>
                    <InfoIcon tooltip={similarityDescriptions.immutability} />
                </div>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <h4
                    style={{
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        color: 'var(--text-color)',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    Similarity <InfoIcon tooltip={similarityDescriptions.similarity} />
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '920px' }}>
                    <div>
                        <Label>Algorithm <InfoIcon tooltip={similarityDescriptions.algorithm} /></Label>
                        <SelectWithDescription
                            value={kind === 'custom' ? 'custom' : kind}
                            onChange={e => setSimilarityKind(e.target.value as SimilarityKind)}
                            options={typeOptions}
                        />
                    </div>

                    <div>
                        <Label>@odata.type <InfoIcon tooltip={similarityDescriptions.odataType} /></Label>
                        <Input
                            value={getOdataType(similarity) ?? ''}
                            placeholder={kind === 'default' ? '(not set)' : ''}
                            disabled
                        />
                    </div>
                </div>

                {kind === 'bm25' && (
                    <div
                        style={{
                            marginTop: '16px',
                            maxWidth: '920px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            padding: '12px',
                            backgroundColor: 'var(--hover-color)'
                        }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <Label>b <InfoIcon tooltip={similarityDescriptions.b} /></Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={1}
                                    value={bm25?.b ?? ''}
                                    onChange={e => {
                                        const b = parseOptionalNumber(e.target.value);
                                        setIndexDef(prev => {
                                            const next: SearchIndex = { ...prev };

                                            const cur = prev.similarity;
                                            const curObj = (cur && typeof cur === 'object') ? (cur as Record<string, unknown>) : {};
                                            const rest: Record<string, unknown> = { ...curObj };
                                            delete rest['b'];

                                            const nextSimilarity: Record<string, unknown> = {
                                                ...rest,
                                                '@odata.type': '#Microsoft.Azure.Search.BM25Similarity',
                                                ...(b === undefined ? {} : { b })
                                            };

                                            next.similarity = nextSimilarity;
                                            return next;
                                        });
                                    }}
                                    placeholder="0.75"
                                />
                            </div>

                            <div>
                                <Label>k1 <InfoIcon tooltip={similarityDescriptions.k1} /></Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    value={bm25?.k1 ?? ''}
                                    onChange={e => {
                                        const k1 = parseOptionalNumber(e.target.value);
                                        setIndexDef(prev => {
                                            const next: SearchIndex = { ...prev };

                                            const cur = prev.similarity;
                                            const curObj = (cur && typeof cur === 'object') ? (cur as Record<string, unknown>) : {};
                                            const rest: Record<string, unknown> = { ...curObj };
                                            delete rest['k1'];

                                            const nextSimilarity: Record<string, unknown> = {
                                                ...rest,
                                                '@odata.type': '#Microsoft.Azure.Search.BM25Similarity',
                                                ...(k1 === undefined ? {} : { k1 })
                                            };

                                            next.similarity = nextSimilarity;
                                            return next;
                                        });
                                    }}
                                    placeholder="1.2"
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                            Leaving values blank lets the service defaults apply.
                        </div>
                    </div>
                )}

                {kind === 'custom' && (
                    <div
                        style={{
                            marginTop: '16px',
                            padding: '12px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--hover-color)',
                            maxWidth: '920px'
                        }}
                    >
                        <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '10px' }}>
                            This similarity object is not recognized. You can reset to default, or switch to a known type.
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="secondary" onClick={() => setSimilarityKind('default')}>
                                <i className="fas fa-undo"></i> Reset to Default
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
