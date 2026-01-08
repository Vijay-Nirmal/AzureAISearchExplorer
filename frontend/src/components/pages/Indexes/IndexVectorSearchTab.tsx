import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import algorithmKinds from '../../../data/constants/vectorSearchAlgorithmKinds.json';
import algorithmMetrics from '../../../data/constants/vectorSearchAlgorithmMetrics.json';
import algorithmDescriptions from '../../../data/constants/vectorSearchAlgorithmPropertyDescriptions.json';
import profileDescriptions from '../../../data/constants/vectorSearchProfilePropertyDescriptions.json';
import compressionKinds from '../../../data/constants/vectorSearchCompressionKinds.json';
import rescoreStorageMethods from '../../../data/constants/vectorSearchCompressionRescoreStorageMethods.json';
import compressionTargetDataTypes from '../../../data/constants/vectorSearchCompressionTargetDataTypes.json';
import compressionDescriptions from '../../../data/constants/vectorSearchCompressionPropertyDescriptions.json';

import vectorizerKinds from '../../../data/constants/vectorSearchVectorizerKinds.json';
import vectorizerDescriptions from '../../../data/constants/vectorSearchVectorizerPropertyDescriptions.json';
import azureOpenAIModelNames from '../../../data/constants/azureOpenAIModelNames.json';
import identityKinds from '../../../data/constants/searchIndexerDataIdentityKinds.json';
import webApiHttpMethods from '../../../data/constants/webApiHttpMethods.json';

import type {
    SearchIndex,
    VectorSearch,
    VectorSearchAlgorithm,
    VectorSearchCompression,
    VectorSearchCompressionRescoreStorageMethod,
    VectorSearchCompressionTargetDataType,
    VectorSearchProfile,
    VectorSearchRescoringOptions,
    VectorSearchScalarQuantizationParameters,
    VectorSearchVectorizer,
    AzureOpenAIVectorizer,
    WebApiVectorizer,
    AzureOpenAIEmbeddingSkill,
    WebApiParameters,
    InputFieldMappingEntry,
    OutputFieldMappingEntry,
    SearchIndexerDataIdentity
} from '../../../types/IndexModels';

interface IndexVectorSearchTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type EditableCompression = VectorSearchCompression & {
    name: string;
    kind: string;
    truncationDimension?: number | null;
    rescoringOptions?: VectorSearchRescoringOptions;
    scalarQuantizationParameters?: VectorSearchScalarQuantizationParameters;
};

type EditableVectorizer = VectorSearchVectorizer;

const DEFAULT_AOAI_ODATA = '#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill' as const;
const DEFAULT_NONE_IDENTITY_ODATA = '#Microsoft.Azure.Search.DataNoneIdentity' as const;
const DEFAULT_USER_ASSIGNED_IDENTITY_ODATA = '#Microsoft.Azure.Search.DataUserAssignedIdentity' as const;

const identityToKind = (identity?: SearchIndexerDataIdentity): 'none' | 'userAssigned' | '' => {
    if (!identity || typeof identity !== 'object') return '';
    const odata = (identity as { '@odata.type'?: string })['@odata.type'];
    if (odata === DEFAULT_NONE_IDENTITY_ODATA) return 'none';
    if (odata === DEFAULT_USER_ASSIGNED_IDENTITY_ODATA) return 'userAssigned';
    return '';
};

const kindToIdentity = (kind: 'none' | 'userAssigned' | ''): SearchIndexerDataIdentity | undefined => {
    if (!kind) return undefined;
    if (kind === 'none') return { '@odata.type': DEFAULT_NONE_IDENTITY_ODATA };
    return { '@odata.type': DEFAULT_USER_ASSIGNED_IDENTITY_ODATA, userAssignedIdentity: '' };
};

const getUserAssignedIdentityValue = (identity?: SearchIndexerDataIdentity): string => {
    if (!identity || typeof identity !== 'object') return '';
    const rec = identity as Record<string, unknown>;
    if (rec['@odata.type'] !== DEFAULT_USER_ASSIGNED_IDENTITY_ODATA) return '';
    return typeof rec.userAssignedIdentity === 'string' ? rec.userAssignedIdentity : '';
};

const sanitizeMappingEntries = (entries?: InputFieldMappingEntry[]): InputFieldMappingEntry[] | undefined => {
    if (!entries || !Array.isArray(entries) || entries.length === 0) return undefined;
    const cleaned = entries
        .map(e => {
            const child = sanitizeMappingEntries(e.inputs);
            const name = (e.name || '').trim();
            const source = (e.source || '').trim();
            const sourceContext = (e.sourceContext || '').trim();
            const out: InputFieldMappingEntry = {
                name: name || undefined,
                source: source || undefined,
                sourceContext: sourceContext || undefined,
                inputs: child
            };
            // keep if it has any meaningful content
            if (out.name || out.source || out.sourceContext || (out.inputs && out.inputs.length)) return out;
            return null;
        })
        .filter(Boolean) as InputFieldMappingEntry[];
    return cleaned.length ? cleaned : undefined;
};

const sanitizeOutputEntries = (entries?: OutputFieldMappingEntry[]): OutputFieldMappingEntry[] | undefined => {
    if (!entries || !Array.isArray(entries) || entries.length === 0) return undefined;
    const cleaned = entries
        .map(e => {
            const name = (e.name || '').trim();
            const targetName = (e.targetName || '').trim();
            const out: OutputFieldMappingEntry = {
                name: name || undefined,
                targetName: targetName || undefined
            };
            if (out.name || out.targetName) return out;
            return null;
        })
        .filter(Boolean) as OutputFieldMappingEntry[];
    return cleaned.length ? cleaned : undefined;
};

const getProfileAlgorithm = (profile: VectorSearchProfile): string => {
    return (profile.algorithmConfigurationName || profile.algorithm || '').trim();
};

const getProfileCompression = (profile: VectorSearchProfile): string => {
    return (profile.compressionName || profile.compression || '').trim();
};

const getCompressionRescoringOptions = (c: VectorSearchCompression): VectorSearchRescoringOptions | undefined => {
    if (typeof c !== 'object' || c === null) return undefined;
    if (!('rescoringOptions' in c)) return undefined;
    return (c as { rescoringOptions?: VectorSearchRescoringOptions }).rescoringOptions;
};

const getCompressionScalarParams = (c: VectorSearchCompression): VectorSearchScalarQuantizationParameters | undefined => {
    if (typeof c !== 'object' || c === null) return undefined;
    if (!('scalarQuantizationParameters' in c)) return undefined;
    return (c as { scalarQuantizationParameters?: VectorSearchScalarQuantizationParameters }).scalarQuantizationParameters;
};

export const IndexVectorSearchTab: React.FC<IndexVectorSearchTabProps> = ({ indexDef, setIndexDef }) => {
    // Vector Algorithms Editor State
    const [algorithmModalOpen, setAlgorithmModalOpen] = useState(false);
    const [editingAlgorithmIndex, setEditingAlgorithmIndex] = useState<number | null>(null);
    const [tempAlgorithm, setTempAlgorithm] = useState<VectorSearchAlgorithm | null>(null);

    // Vector Profiles Editor State
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [editingProfileIndex, setEditingProfileIndex] = useState<number | null>(null);
    const [tempProfile, setTempProfile] = useState<VectorSearchProfile | null>(null);

    // Vector Compressions Editor State
    const [compressionModalOpen, setCompressionModalOpen] = useState(false);
    const [editingCompressionIndex, setEditingCompressionIndex] = useState<number | null>(null);
    const [tempCompression, setTempCompression] = useState<EditableCompression | null>(null);

    // Vector Vectorizers Editor State
    const [vectorizerModalOpen, setVectorizerModalOpen] = useState(false);
    const [editingVectorizerIndex, setEditingVectorizerIndex] = useState<number | null>(null);
    const [tempVectorizer, setTempVectorizer] = useState<EditableVectorizer | null>(null);

    const ensureVectorSearchExists = (): VectorSearch => {
        const current = indexDef.vectorSearch;
        if (current) return current;
        return { algorithms: [], profiles: [], compressions: [], vectorizers: [] };
    };

    const updateVectorSearch = <K extends keyof VectorSearch>(key: K, newList: NonNullable<VectorSearch[K]>) => {
        setIndexDef(prev => ({
            ...prev,
            vectorSearch: {
                ...(prev.vectorSearch || {}),
                [key]: newList
            }
        }));
    };

    const kindOptions = useMemo(() => {
        return algorithmKinds.map(k => ({
            value: k.value,
            label: k.value === 'hnsw' ? 'HNSW' : k.value === 'exhaustiveKnn' ? 'Exhaustive KNN' : k.value,
            description: k.description
        }));
    }, []);

    const metricOptions = useMemo(() => {
        return algorithmMetrics.map(m => ({
            value: m.value,
            label:
                m.value === 'dotProduct' ? 'Dot Product' :
                    m.value === 'euclidean' ? 'Euclidean' :
                        m.value === 'hamming' ? 'Hamming' :
                            m.value === 'cosine' ? 'Cosine' :
                                m.value,
            description: m.description
        }));
    }, []);

    const compressionKindOptions = useMemo(() => {
        return compressionKinds.map(k => ({
            value: k.value,
            label:
                k.value === 'binaryQuantization' ? 'Binary Quantization' :
                    k.value === 'scalarQuantization' ? 'Scalar Quantization' :
                        k.value,
            description: k.description
        }));
    }, []);

    const storageOptions = useMemo(() => {
        return rescoreStorageMethods.map(s => ({
            value: s.value,
            label: s.value === 'preserveOriginals' ? 'Preserve Originals' : s.value === 'discardOriginals' ? 'Discard Originals' : s.value,
            description: s.description
        }));
    }, []);

    const qdtOptions = useMemo(() => {
        return compressionTargetDataTypes.map(t => ({
            value: t.value,
            label: t.value.toUpperCase(),
            description: t.description
        }));
    }, []);

    const vectorizerKindOptions = useMemo(() => {
        return vectorizerKinds.map(k => ({
            value: k.value,
            label: k.value === 'azureOpenAI' ? 'Azure OpenAI' : k.value === 'customWebApi' ? 'Custom Web API' : k.value,
            description: k.description
        }));
    }, []);

    const aoaiModelOptions = useMemo(() => {
        return (azureOpenAIModelNames as Array<{ value: string; description?: string }>).map(m => ({
            value: m.value,
            label: m.value,
            description: m.description
        }));
    }, []);

    const identityOptions = useMemo(() => {
        return (identityKinds as Array<{ value: string; description?: string }>).map(i => ({
            value: i.value,
            label: i.value === 'none' ? 'None' : i.value === 'userAssigned' ? 'User Assigned' : i.value,
            description: i.description
        }));
    }, []);

    const httpMethodOptions = useMemo(() => {
        return (webApiHttpMethods as Array<{ value: string; description?: string }>).map(m => ({
            value: m.value,
            label: m.value,
            description: m.description
        }));
    }, []);

    // --- Algorithms ---

    const openNewAlgorithmEditor = () => {
        const existing = ensureVectorSearchExists().algorithms || [];
        const defaultName = `algo-${existing.length + 1}`;
        const draft: VectorSearchAlgorithm = {
            name: defaultName,
            kind: 'hnsw',
            hnswParameters: {
                m: 4,
                efConstruction: 400,
                efSearch: 500,
                metric: 'cosine'
            }
        };
        setEditingAlgorithmIndex(null);
        setTempAlgorithm(draft);
        setAlgorithmModalOpen(true);
    };

    const openEditAlgorithmEditor = (idx: number) => {
        const existing = ensureVectorSearchExists().algorithms || [];
        const algo = existing[idx];
        if (!algo) return;
        setEditingAlgorithmIndex(idx);
        setTempAlgorithm(structuredClone(algo));
        setAlgorithmModalOpen(true);
    };

    const deleteAlgorithm = (idx: number) => {
        const list = [...(ensureVectorSearchExists().algorithms || [])];
        list.splice(idx, 1);
        updateVectorSearch('algorithms', list);
    };

    const saveAlgorithmFromModal = () => {
        if (!tempAlgorithm) return;

        let normalized: VectorSearchAlgorithm;
        if (tempAlgorithm.kind === 'hnsw') {
            normalized = {
                ...tempAlgorithm,
                kind: 'hnsw',
                hnswParameters: {
                    m: tempAlgorithm.hnswParameters?.m ?? 4,
                    efConstruction: tempAlgorithm.hnswParameters?.efConstruction ?? 400,
                    efSearch: tempAlgorithm.hnswParameters?.efSearch ?? 500,
                    metric: tempAlgorithm.hnswParameters?.metric ?? 'cosine'
                },
                exhaustiveKnnParameters: undefined
            };
        } else if (tempAlgorithm.kind === 'exhaustiveKnn') {
            normalized = {
                ...tempAlgorithm,
                kind: 'exhaustiveKnn',
                exhaustiveKnnParameters: {
                    metric: tempAlgorithm.exhaustiveKnnParameters?.metric ?? 'cosine'
                },
                hnswParameters: undefined
            };
        } else {
            normalized = { ...tempAlgorithm };
        }

        const list = [...(ensureVectorSearchExists().algorithms || [])];
        if (editingAlgorithmIndex === null) list.push(normalized);
        else list[editingAlgorithmIndex] = normalized;

        updateVectorSearch('algorithms', list);
        setAlgorithmModalOpen(false);
        setTempAlgorithm(null);
        setEditingAlgorithmIndex(null);
    };

    const renderAlgorithmEditorModal = () => {
        if (!algorithmModalOpen || !tempAlgorithm) return null;

        const isHnsw = tempAlgorithm.kind === 'hnsw';
        const isExhaustive = tempAlgorithm.kind === 'exhaustiveKnn';
        const metricValue = isHnsw
            ? (tempAlgorithm.hnswParameters?.metric || 'cosine')
            : (tempAlgorithm.exhaustiveKnnParameters?.metric || 'cosine');

        return (
            <Modal
                title={editingAlgorithmIndex === null ? 'Add Algorithm' : 'Edit Algorithm'}
                isOpen={algorithmModalOpen}
                onClose={() => {
                    setAlgorithmModalOpen(false);
                    setTempAlgorithm(null);
                    setEditingAlgorithmIndex(null);
                }}
                width="720px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={algorithmDescriptions.name} /></Label>
                            <Input value={tempAlgorithm.name} onChange={e => setTempAlgorithm({ ...tempAlgorithm, name: e.target.value })} />
                        </div>
                        <div>
                            <Label>Kind <InfoIcon tooltip={algorithmDescriptions.kind} /></Label>
                            <SelectWithDescription
                                value={tempAlgorithm.kind}
                                onChange={e => {
                                    const newKind = e.target.value;
                                    if (newKind === 'hnsw') {
                                        setTempAlgorithm({
                                            ...tempAlgorithm,
                                            kind: 'hnsw',
                                            hnswParameters: {
                                                m: tempAlgorithm.hnswParameters?.m ?? 4,
                                                efConstruction: tempAlgorithm.hnswParameters?.efConstruction ?? 400,
                                                efSearch: tempAlgorithm.hnswParameters?.efSearch ?? 500,
                                                metric: tempAlgorithm.hnswParameters?.metric ?? 'cosine'
                                            },
                                            exhaustiveKnnParameters: undefined
                                        });
                                        return;
                                    }
                                    if (newKind === 'exhaustiveKnn') {
                                        setTempAlgorithm({
                                            ...tempAlgorithm,
                                            kind: 'exhaustiveKnn',
                                            exhaustiveKnnParameters: {
                                                metric: tempAlgorithm.exhaustiveKnnParameters?.metric ?? tempAlgorithm.hnswParameters?.metric ?? 'cosine'
                                            },
                                            hnswParameters: undefined
                                        });
                                        return;
                                    }
                                    setTempAlgorithm({ ...tempAlgorithm, kind: newKind });
                                }}
                                options={kindOptions}
                            />
                        </div>
                    </div>

                    <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 8px' }}>Parameters</legend>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <Label>Metric <InfoIcon tooltip={algorithmDescriptions.metric} /></Label>
                                <SelectWithDescription
                                    value={metricValue}
                                    onChange={e => {
                                        const metric = e.target.value;
                                        if (isHnsw) {
                                            setTempAlgorithm({
                                                ...tempAlgorithm,
                                                hnswParameters: {
                                                    ...(tempAlgorithm.hnswParameters || {}),
                                                    metric
                                                }
                                            });
                                        } else if (isExhaustive) {
                                            setTempAlgorithm({
                                                ...tempAlgorithm,
                                                exhaustiveKnnParameters: {
                                                    ...(tempAlgorithm.exhaustiveKnnParameters || {}),
                                                    metric
                                                }
                                            });
                                        }
                                    }}
                                    options={metricOptions}
                                />
                            </div>

                            {isHnsw && (
                                <>
                                    <div>
                                        <Label>m <InfoIcon tooltip={algorithmDescriptions.m} /></Label>
                                        <Input
                                            type="number"
                                            value={tempAlgorithm.hnswParameters?.m ?? 4}
                                            onChange={e => setTempAlgorithm({
                                                ...tempAlgorithm,
                                                hnswParameters: {
                                                    ...(tempAlgorithm.hnswParameters || {}),
                                                    m: parseInt(e.target.value)
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label>efConstruction <InfoIcon tooltip={algorithmDescriptions.efConstruction} /></Label>
                                        <Input
                                            type="number"
                                            value={tempAlgorithm.hnswParameters?.efConstruction ?? 400}
                                            onChange={e => setTempAlgorithm({
                                                ...tempAlgorithm,
                                                hnswParameters: {
                                                    ...(tempAlgorithm.hnswParameters || {}),
                                                    efConstruction: parseInt(e.target.value)
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label>efSearch <InfoIcon tooltip={algorithmDescriptions.efSearch} /></Label>
                                        <Input
                                            type="number"
                                            value={tempAlgorithm.hnswParameters?.efSearch ?? 500}
                                            onChange={e => setTempAlgorithm({
                                                ...tempAlgorithm,
                                                hnswParameters: {
                                                    ...(tempAlgorithm.hnswParameters || {}),
                                                    efSearch: parseInt(e.target.value)
                                                }
                                            })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </fieldset>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveAlgorithmFromModal}>Save</Button>
                    <Button onClick={() => {
                        setAlgorithmModalOpen(false);
                        setTempAlgorithm(null);
                        setEditingAlgorithmIndex(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    // --- Profiles ---

    const openNewProfileEditor = () => {
        const existing = ensureVectorSearchExists().profiles || [];
        const defaultName = `profile-${existing.length + 1}`;
        const draft: VectorSearchProfile = {
            name: defaultName,
            algorithm: '',
            algorithmConfigurationName: ''
        };
        setEditingProfileIndex(null);
        setTempProfile(draft);
        setProfileModalOpen(true);
    };

    const openEditProfileEditor = (idx: number) => {
        const existing = ensureVectorSearchExists().profiles || [];
        const profile = existing[idx];
        if (!profile) return;
        setEditingProfileIndex(idx);
        setTempProfile(structuredClone(profile));
        setProfileModalOpen(true);
    };

    const deleteProfile = (idx: number) => {
        const list = [...(ensureVectorSearchExists().profiles || [])];
        list.splice(idx, 1);
        updateVectorSearch('profiles', list);
    };

    const saveProfileFromModal = () => {
        if (!tempProfile) return;

        const algorithm = getProfileAlgorithm(tempProfile);
        const compression = getProfileCompression(tempProfile);

        const normalized: VectorSearchProfile = {
            ...tempProfile,
            name: (tempProfile.name || '').trim(),
            algorithm,
            algorithmConfigurationName: algorithm || undefined,
            compression: compression || undefined,
            compressionName: compression || undefined,
            vectorizer: tempProfile.vectorizer ? tempProfile.vectorizer.trim() : undefined
        };

        const list = [...(ensureVectorSearchExists().profiles || [])];
        if (editingProfileIndex === null) list.push(normalized);
        else list[editingProfileIndex] = normalized;

        updateVectorSearch('profiles', list);
        setProfileModalOpen(false);
        setTempProfile(null);
        setEditingProfileIndex(null);
    };

    const renderProfileEditorModal = () => {
        if (!profileModalOpen || !tempProfile) return null;

        const algorithms = ensureVectorSearchExists().algorithms || [];
        const profiles = ensureVectorSearchExists().profiles || [];
        void profiles; // keep for future extensions

        const algorithmOptions = algorithms.map(a => ({
            value: a.name,
            label: a.name,
            description: (() => {
                const metric = a.kind === 'hnsw' ? a.hnswParameters?.metric : a.exhaustiveKnnParameters?.metric;
                const parts = [a.kind ? `kind: ${a.kind}` : null, metric ? `metric: ${metric}` : null].filter(Boolean);
                return parts.length ? parts.join(', ') : undefined;
            })()
        }));

        const compressionOptions = (ensureVectorSearchExists().compressions || [])
            .map(c => ({
                value: c.name ?? '',
                label: c.name ?? '',
                description: c.kind ? `kind: ${c.kind}` : undefined
            }))
            .filter(o => o.value);

        const vectorizerOptions = (ensureVectorSearchExists().vectorizers || [])
            .map(v => ({
                value: v.name,
                label: v.name,
                description: v.kind ? `kind: ${v.kind}` : undefined
            }))
            .filter(o => o.value);

        return (
            <Modal
                title={editingProfileIndex === null ? 'Add Profile' : 'Edit Profile'}
                isOpen={profileModalOpen}
                onClose={() => {
                    setProfileModalOpen(false);
                    setTempProfile(null);
                    setEditingProfileIndex(null);
                }}
                width="720px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={profileDescriptions.name} /></Label>
                            <Input
                                value={tempProfile.name}
                                onChange={e => setTempProfile({ ...tempProfile, name: e.target.value })}
                                placeholder="e.g. default-profile"
                            />
                        </div>
                        <div>
                            <Label>Algorithm <InfoIcon tooltip={profileDescriptions.algorithm} /></Label>
                            <SelectWithDescription
                                value={getProfileAlgorithm(tempProfile)}
                                onChange={e => setTempProfile({
                                    ...tempProfile,
                                    algorithm: e.target.value || undefined,
                                    algorithmConfigurationName: e.target.value || undefined
                                })}
                                options={[{ value: '', label: '(Select Algorithm)' }, ...algorithmOptions]}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Compression <InfoIcon tooltip={profileDescriptions.compression} /></Label>
                            <SelectWithDescription
                                value={getProfileCompression(tempProfile)}
                                onChange={e => setTempProfile({
                                    ...tempProfile,
                                    compression: e.target.value || undefined,
                                    compressionName: e.target.value || undefined
                                })}
                                options={[{ value: '', label: '(None)' }, ...compressionOptions]}
                            />
                            {compressionOptions.length === 0 && (
                                <div style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                                    No compression configurations defined yet.
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Vectorizer <InfoIcon tooltip={profileDescriptions.vectorizer} /></Label>
                            <SelectWithDescription
                                value={tempProfile.vectorizer || ''}
                                onChange={e => setTempProfile({ ...tempProfile, vectorizer: e.target.value || undefined })}
                                options={[{ value: '', label: '(None)' }, ...vectorizerOptions]}
                            />
                            {vectorizerOptions.length === 0 && (
                                <div style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                                    No vectorizers defined yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveProfileFromModal}>Save</Button>
                    <Button onClick={() => {
                        setProfileModalOpen(false);
                        setTempProfile(null);
                        setEditingProfileIndex(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    // --- Vectorizers ---

    const openNewVectorizerEditor = () => {
        const existing = ensureVectorSearchExists().vectorizers || [];
        const defaultName = `vectorizer-${existing.length + 1}`;
        const draft: AzureOpenAIVectorizer = {
            kind: 'azureOpenAI',
            name: defaultName,
            azureOpenAIParameters: {
                '@odata.type': DEFAULT_AOAI_ODATA,
                context: '/document',
                inputs: [],
                outputs: []
            }
        };
        setEditingVectorizerIndex(null);
        setTempVectorizer(draft);
        setVectorizerModalOpen(true);
    };

    const openEditVectorizerEditor = (idx: number) => {
        const existing = ensureVectorSearchExists().vectorizers || [];
        const v = existing[idx];
        if (!v) return;
        setEditingVectorizerIndex(idx);
        setTempVectorizer(structuredClone(v));
        setVectorizerModalOpen(true);
    };

    const deleteVectorizer = (idx: number) => {
        const list = [...(ensureVectorSearchExists().vectorizers || [])];
        list.splice(idx, 1);
        updateVectorSearch('vectorizers', list);
    };

    const saveVectorizerFromModal = () => {
        if (!tempVectorizer) return;

        const name = (tempVectorizer.name || '').trim();
        const kind = (tempVectorizer.kind || '').trim();
        if (!name) return;

        let normalized: VectorSearchVectorizer;

        if (kind === 'azureOpenAI') {
            const aoai = tempVectorizer as AzureOpenAIVectorizer;
            const p: AzureOpenAIEmbeddingSkill = {
                ...(aoai.azureOpenAIParameters || {}),
                '@odata.type': DEFAULT_AOAI_ODATA,
                apiKey: aoai.azureOpenAIParameters?.apiKey?.trim() || undefined,
                context: aoai.azureOpenAIParameters?.context?.trim() || undefined,
                deploymentId: aoai.azureOpenAIParameters?.deploymentId?.trim() || undefined,
                description: aoai.azureOpenAIParameters?.description?.trim() || undefined,
                modelName: (aoai.azureOpenAIParameters?.modelName || '').trim() || undefined,
                name: aoai.azureOpenAIParameters?.name?.trim() || undefined,
                resourceUri: aoai.azureOpenAIParameters?.resourceUri?.trim() || undefined,
                dimensions: aoai.azureOpenAIParameters?.dimensions ?? undefined,
                authIdentity: aoai.azureOpenAIParameters?.authIdentity,
                inputs: sanitizeMappingEntries(aoai.azureOpenAIParameters?.inputs),
                outputs: sanitizeOutputEntries(aoai.azureOpenAIParameters?.outputs)
            };
            normalized = {
                kind: 'azureOpenAI',
                name,
                azureOpenAIParameters: p
            };
        } else if (kind === 'customWebApi') {
            const w = tempVectorizer as WebApiVectorizer;
            const p: WebApiParameters = {
                ...(w.customWebApiParameters || {}),
                uri: w.customWebApiParameters?.uri?.trim() || undefined,
                httpMethod: w.customWebApiParameters?.httpMethod?.trim() || undefined,
                timeout: w.customWebApiParameters?.timeout?.trim() || undefined,
                authResourceId: w.customWebApiParameters?.authResourceId?.trim() || undefined,
                authIdentity: w.customWebApiParameters?.authIdentity,
                httpHeaders: w.customWebApiParameters?.httpHeaders
            };
            normalized = {
                kind: 'customWebApi',
                name,
                customWebApiParameters: p
            };
        } else {
            normalized = { ...tempVectorizer, kind, name } as VectorSearchVectorizer;
        }

        const list = [...(ensureVectorSearchExists().vectorizers || [])];
        if (editingVectorizerIndex === null) list.push(normalized);
        else list[editingVectorizerIndex] = normalized;

        updateVectorSearch('vectorizers', list);
        setVectorizerModalOpen(false);
        setTempVectorizer(null);
        setEditingVectorizerIndex(null);
    };

    const renderInputMappingsEditor = (
        entries: InputFieldMappingEntry[] | undefined,
        onChange: (next: InputFieldMappingEntry[]) => void,
        level: number = 0
    ) => {
        const list = entries || [];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {list.map((entry, idx) => (
                    <div
                        key={`${level}-${idx}`}
                        style={{
                            padding: '10px',
                            backgroundColor: '#252526',
                            borderRadius: '4px',
                            borderLeft: level > 0 ? '2px solid var(--accent-color)' : '2px solid transparent',
                            marginLeft: level > 0 ? 12 : 0
                        }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                            <div>
                                <Label>Name <InfoIcon tooltip={vectorizerDescriptions.mapping_name} /></Label>
                                <Input
                                    value={entry.name || ''}
                                    onChange={e => {
                                        const next = [...list];
                                        next[idx] = { ...next[idx], name: e.target.value };
                                        onChange(next);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Source <InfoIcon tooltip={vectorizerDescriptions.mapping_source} /></Label>
                                <Input
                                    value={entry.source || ''}
                                    onChange={e => {
                                        const next = [...list];
                                        next[idx] = { ...next[idx], source: e.target.value };
                                        onChange(next);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Source Context <InfoIcon tooltip={vectorizerDescriptions.mapping_sourceContext} /></Label>
                                <Input
                                    value={entry.sourceContext || ''}
                                    onChange={e => {
                                        const next = [...list];
                                        next[idx] = { ...next[idx], sourceContext: e.target.value };
                                        onChange(next);
                                    }}
                                    placeholder="e.g. /document"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const next = [...list];
                                        const child = next[idx].inputs ? [...(next[idx].inputs || [])] : [];
                                        child.push({ name: '', source: '', sourceContext: '', inputs: [] });
                                        next[idx] = { ...next[idx], inputs: child };
                                        onChange(next);
                                    }}
                                >
                                    + Child
                                </Button>
                                <Button
                                    variant="icon"
                                    onClick={() => {
                                        const next = [...list];
                                        next.splice(idx, 1);
                                        onChange(next);
                                    }}
                                >
                                    <i className="fas fa-trash"></i>
                                </Button>
                            </div>
                        </div>

                        {(entry.inputs && entry.inputs.length > 0) && (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Recursive Inputs <InfoIcon tooltip={vectorizerDescriptions.mapping_inputs} />
                                </div>
                                {renderInputMappingsEditor(entry.inputs, (childNext) => {
                                    const next = [...list];
                                    next[idx] = { ...next[idx], inputs: childNext };
                                    onChange(next);
                                }, level + 1)}
                            </div>
                        )}
                    </div>
                ))}

                <div>
                    <Button
                        onClick={() => {
                            const next = [...list, { name: '', source: '', sourceContext: '', inputs: [] }];
                            onChange(next);
                        }}
                    >
                        <i className="fas fa-plus"></i> Add Input
                    </Button>
                </div>
            </div>
        );
    };

    const renderOutputsEditor = (
        entries: OutputFieldMappingEntry[] | undefined,
        onChange: (next: OutputFieldMappingEntry[]) => void
    ) => {
        const list = entries || [];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={vectorizerDescriptions.mapping_name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Target Name <InfoIcon tooltip={vectorizerDescriptions.mapping_targetName} /></th>
                            <th style={{ width: '80px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((entry, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '4px' }}>
                                    <Input
                                        value={entry.name || ''}
                                        onChange={e => {
                                            const next = [...list];
                                            next[idx] = { ...next[idx], name: e.target.value };
                                            onChange(next);
                                        }}
                                        placeholder="e.g. embedding"
                                    />
                                </td>
                                <td style={{ padding: '4px' }}>
                                    <Input
                                        value={entry.targetName || ''}
                                        onChange={e => {
                                            const next = [...list];
                                            next[idx] = { ...next[idx], targetName: e.target.value };
                                            onChange(next);
                                        }}
                                        placeholder="(Optional)"
                                    />
                                </td>
                                <td style={{ padding: '4px' }}>
                                    <Button variant="icon" onClick={() => {
                                        const next = [...list];
                                        next.splice(idx, 1);
                                        onChange(next);
                                    }}>
                                        <i className="fas fa-trash"></i>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {list.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: '#888' }}>
                                    No outputs defined
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div>
                    <Button onClick={() => onChange([...list, { name: '', targetName: '' }])}>
                        <i className="fas fa-plus"></i> Add Output
                    </Button>
                </div>
            </div>
        );
    };

    const renderVectorizerEditorModal = () => {
        if (!vectorizerModalOpen || !tempVectorizer) return null;

        const kind = tempVectorizer.kind;
        const isAoai = kind === 'azureOpenAI';
        const isWebApi = kind === 'customWebApi';

        const aoaiParams = isAoai ? ((tempVectorizer as AzureOpenAIVectorizer).azureOpenAIParameters || { '@odata.type': DEFAULT_AOAI_ODATA }) : undefined;
        const webApiParams = isWebApi ? ((tempVectorizer as WebApiVectorizer).customWebApiParameters || {}) : undefined;

        const aoaiIdentityKind = identityToKind(aoaiParams?.authIdentity);
        const webApiIdentityKind = identityToKind(webApiParams?.authIdentity);

        return (
            <Modal
                title={editingVectorizerIndex === null ? 'Add Vectorizer' : 'Edit Vectorizer'}
                isOpen={vectorizerModalOpen}
                onClose={() => {
                    setVectorizerModalOpen(false);
                    setTempVectorizer(null);
                    setEditingVectorizerIndex(null);
                }}
                width="860px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={vectorizerDescriptions.name} /></Label>
                            <Input
                                value={tempVectorizer.name || ''}
                                onChange={e => setTempVectorizer({ ...tempVectorizer, name: e.target.value })}
                                placeholder="e.g. aoai-default"
                            />
                        </div>
                        <div>
                            <Label>Kind <InfoIcon tooltip={vectorizerDescriptions.kind} /></Label>
                            <SelectWithDescription
                                value={kind || ''}
                                onChange={e => {
                                    const newKind = e.target.value;
                                    if (newKind === 'azureOpenAI') {
                                        const next: AzureOpenAIVectorizer = {
                                            kind: 'azureOpenAI',
                                            name: tempVectorizer.name || 'vectorizer',
                                            azureOpenAIParameters: {
                                                '@odata.type': DEFAULT_AOAI_ODATA,
                                                context: '/document',
                                                inputs: [],
                                                outputs: []
                                            }
                                        };
                                        setTempVectorizer(next);
                                        return;
                                    }
                                    if (newKind === 'customWebApi') {
                                        const next: WebApiVectorizer = {
                                            kind: 'customWebApi',
                                            name: tempVectorizer.name || 'vectorizer',
                                            customWebApiParameters: {
                                                httpMethod: 'POST',
                                                httpHeaders: {}
                                            }
                                        };
                                        setTempVectorizer(next);
                                        return;
                                    }
                                    setTempVectorizer({ ...tempVectorizer, kind: newKind } as EditableVectorizer);
                                }}
                                options={vectorizerKindOptions}
                            />
                        </div>
                    </div>

                    {isAoai && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Azure OpenAI Parameters</legend>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>@odata.type <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_odataType} /></Label>
                                    <Input value={DEFAULT_AOAI_ODATA} disabled />
                                </div>
                                <div>
                                    <Label>Model Name <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_modelName} /></Label>
                                    <SelectWithDescription
                                        value={aoaiParams?.modelName || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as AzureOpenAIVectorizer),
                                            azureOpenAIParameters: {
                                                ...(aoaiParams || {}),
                                                modelName: e.target.value || undefined
                                            }
                                        })}
                                        options={[{ value: '', label: '(Not Set)' }, ...aoaiModelOptions]}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                                <div>
                                    <Label>Resource URI <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_resourceUri} /></Label>
                                    <Input
                                        value={aoaiParams?.resourceUri || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as AzureOpenAIVectorizer),
                                            azureOpenAIParameters: {
                                                ...(aoaiParams || {}),
                                                resourceUri: e.target.value
                                            }
                                        })}
                                        placeholder="https://{resource}.openai.azure.com"
                                    />
                                </div>
                                <div>
                                    <Label>Deployment ID <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_deploymentId} /></Label>
                                    <Input
                                        value={aoaiParams?.deploymentId || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as AzureOpenAIVectorizer),
                                            azureOpenAIParameters: {
                                                ...(aoaiParams || {}),
                                                deploymentId: e.target.value
                                            }
                                        })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '12px' }}>
                                <div>
                                    <Label>Dimensions <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_dimensions} /></Label>
                                    <Input
                                        type="number"
                                        value={aoaiParams?.dimensions ?? ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as AzureOpenAIVectorizer),
                                            azureOpenAIParameters: {
                                                ...(aoaiParams || {}),
                                                dimensions: e.target.value === '' ? undefined : parseInt(e.target.value)
                                            }
                                        })}
                                        placeholder="(Optional)"
                                    />
                                </div>
                                <div>
                                    <Label>Context <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_context} /></Label>
                                    <Input
                                        value={aoaiParams?.context || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as AzureOpenAIVectorizer),
                                            azureOpenAIParameters: {
                                                ...(aoaiParams || {}),
                                                context: e.target.value
                                            }
                                        })}
                                        placeholder="/document"
                                    />
                                </div>
                                <div>
                                    <Label>Skill Name <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_skillName} /></Label>
                                    <Input
                                        value={aoaiParams?.name || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as AzureOpenAIVectorizer),
                                            azureOpenAIParameters: {
                                                ...(aoaiParams || {}),
                                                name: e.target.value
                                            }
                                        })}
                                        placeholder="(Optional)"
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <Label>Description <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_description} /></Label>
                                <textarea
                                    style={{ width: '100%', height: '70px', backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid #3c3c3c', fontFamily: 'var(--font-family)' }}
                                    value={aoaiParams?.description || ''}
                                    onChange={e => setTempVectorizer({
                                        ...(tempVectorizer as AzureOpenAIVectorizer),
                                        azureOpenAIParameters: {
                                            ...(aoaiParams || {}),
                                            description: e.target.value
                                        }
                                    })}
                                />
                            </div>

                            <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px', marginTop: '12px' }}>
                                <legend style={{ padding: '0 8px' }}>Authentication</legend>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <Label>Auth Identity <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_authIdentity} /></Label>
                                        <SelectWithDescription
                                            value={aoaiIdentityKind}
                                            onChange={e => {
                                                const kind = (e.target.value as 'none' | 'userAssigned' | '');
                                                setTempVectorizer({
                                                    ...(tempVectorizer as AzureOpenAIVectorizer),
                                                    azureOpenAIParameters: {
                                                        ...(aoaiParams || {}),
                                                        authIdentity: kindToIdentity(kind)
                                                    }
                                                });
                                            }}
                                            options={[{ value: '', label: '(Not Set)' }, ...identityOptions]}
                                        />
                                    </div>
                                    <div>
                                        <Label>User Assigned Identity <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_userAssignedIdentity} /></Label>
                                        <Input
                                            disabled={aoaiIdentityKind !== 'userAssigned'}
                                            value={aoaiIdentityKind === 'userAssigned'
                                                ? getUserAssignedIdentityValue(aoaiParams?.authIdentity)
                                                : ''}
                                            onChange={e => {
                                                if (aoaiIdentityKind !== 'userAssigned') return;
                                                setTempVectorizer({
                                                    ...(tempVectorizer as AzureOpenAIVectorizer),
                                                    azureOpenAIParameters: {
                                                        ...(aoaiParams || {}),
                                                        authIdentity: {
                                                            '@odata.type': DEFAULT_USER_ASSIGNED_IDENTITY_ODATA,
                                                            userAssignedIdentity: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                            placeholder="/subscriptions/.../resourceGroups/.../providers/Microsoft.ManagedIdentity/userAssignedIdentities/..."
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px' }}>
                                    <Label>API Key <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_apiKey} /></Label>
                                    <Input
                                        type="password"
                                        value={aoaiParams?.apiKey || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as AzureOpenAIVectorizer),
                                            azureOpenAIParameters: {
                                                ...(aoaiParams || {}),
                                                apiKey: e.target.value
                                            }
                                        })}
                                        placeholder="(Optional if using managed identity)"
                                    />
                                </div>
                            </fieldset>

                            <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px', marginTop: '12px' }}>
                                <legend style={{ padding: '0 8px' }}>Inputs</legend>
                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                                    {vectorizerDescriptions.azureOpenAI_inputs}
                                </div>
                                {renderInputMappingsEditor(aoaiParams?.inputs || [], (next) => {
                                    setTempVectorizer({
                                        ...(tempVectorizer as AzureOpenAIVectorizer),
                                        azureOpenAIParameters: {
                                            ...(aoaiParams || {}),
                                            inputs: next
                                        }
                                    });
                                })}
                            </fieldset>

                            <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px', marginTop: '12px' }}>
                                <legend style={{ padding: '0 8px' }}>Outputs</legend>
                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                                    {vectorizerDescriptions.azureOpenAI_outputs}
                                </div>
                                {renderOutputsEditor(aoaiParams?.outputs || [], (next) => {
                                    setTempVectorizer({
                                        ...(tempVectorizer as AzureOpenAIVectorizer),
                                        azureOpenAIParameters: {
                                            ...(aoaiParams || {}),
                                            outputs: next
                                        }
                                    });
                                })}
                            </fieldset>
                        </fieldset>
                    )}

                    {isWebApi && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Web API Parameters</legend>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>URI <InfoIcon tooltip={vectorizerDescriptions.webApi_uri} /></Label>
                                    <Input
                                        value={webApiParams?.uri || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as WebApiVectorizer),
                                            customWebApiParameters: {
                                                ...(webApiParams || {}),
                                                uri: e.target.value
                                            }
                                        })}
                                        placeholder="https://my-api.azurewebsites.net/vectorize"
                                    />
                                </div>
                                <div>
                                    <Label>HTTP Method <InfoIcon tooltip={vectorizerDescriptions.webApi_httpMethod} /></Label>
                                    <SelectWithDescription
                                        value={webApiParams?.httpMethod || 'POST'}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as WebApiVectorizer),
                                            customWebApiParameters: {
                                                ...(webApiParams || {}),
                                                httpMethod: e.target.value
                                            }
                                        })}
                                        options={httpMethodOptions}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                                <div>
                                    <Label>Timeout <InfoIcon tooltip={vectorizerDescriptions.webApi_timeout} /></Label>
                                    <Input
                                        value={webApiParams?.timeout || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as WebApiVectorizer),
                                            customWebApiParameters: {
                                                ...(webApiParams || {}),
                                                timeout: e.target.value
                                            }
                                        })}
                                        placeholder="PT30S"
                                    />
                                </div>
                                <div>
                                    <Label>Auth Resource ID <InfoIcon tooltip={vectorizerDescriptions.webApi_authResourceId} /></Label>
                                    <Input
                                        value={webApiParams?.authResourceId || ''}
                                        onChange={e => setTempVectorizer({
                                            ...(tempVectorizer as WebApiVectorizer),
                                            customWebApiParameters: {
                                                ...(webApiParams || {}),
                                                authResourceId: e.target.value
                                            }
                                        })}
                                    />
                                </div>
                            </div>

                            <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px', marginTop: '12px' }}>
                                <legend style={{ padding: '0 8px' }}>Authentication</legend>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <Label>Auth Identity <InfoIcon tooltip={vectorizerDescriptions.webApi_authIdentity} /></Label>
                                        <SelectWithDescription
                                            value={webApiIdentityKind}
                                            onChange={e => {
                                                const kind = (e.target.value as 'none' | 'userAssigned' | '');
                                                setTempVectorizer({
                                                    ...(tempVectorizer as WebApiVectorizer),
                                                    customWebApiParameters: {
                                                        ...(webApiParams || {}),
                                                        authIdentity: kindToIdentity(kind)
                                                    }
                                                });
                                            }}
                                            options={[{ value: '', label: '(Not Set)' }, ...identityOptions]}
                                        />
                                    </div>
                                    <div>
                                        <Label>User Assigned Identity <InfoIcon tooltip={vectorizerDescriptions.azureOpenAI_userAssignedIdentity} /></Label>
                                        <Input
                                            disabled={webApiIdentityKind !== 'userAssigned'}
                                            value={webApiIdentityKind === 'userAssigned'
                                                ? getUserAssignedIdentityValue(webApiParams?.authIdentity)
                                                : ''}
                                            onChange={e => {
                                                if (webApiIdentityKind !== 'userAssigned') return;
                                                setTempVectorizer({
                                                    ...(tempVectorizer as WebApiVectorizer),
                                                    customWebApiParameters: {
                                                        ...(webApiParams || {}),
                                                        authIdentity: {
                                                            '@odata.type': DEFAULT_USER_ASSIGNED_IDENTITY_ODATA,
                                                            userAssignedIdentity: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            <div style={{ marginTop: '12px' }}>
                                <Label>HTTP Headers (JSON) <InfoIcon tooltip={vectorizerDescriptions.webApi_httpHeaders} /></Label>
                                <textarea
                                    style={{ width: '100%', height: '110px', backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid #3c3c3c', fontFamily: 'Consolas' }}
                                    value={JSON.stringify(webApiParams?.httpHeaders || {}, null, 2)}
                                    onChange={e => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            setTempVectorizer({
                                                ...(tempVectorizer as WebApiVectorizer),
                                                customWebApiParameters: {
                                                    ...(webApiParams || {}),
                                                    httpHeaders: parsed
                                                }
                                            });
                                        } catch {
                                            // Ignore invalid JSON while typing
                                        }
                                    }}
                                />
                            </div>
                        </fieldset>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveVectorizerFromModal}>Save</Button>
                    <Button onClick={() => {
                        setVectorizerModalOpen(false);
                        setTempVectorizer(null);
                        setEditingVectorizerIndex(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    // --- Compressions ---

    const openNewCompressionEditor = () => {
        const existing = ensureVectorSearchExists().compressions || [];
        const defaultName = `compression-${existing.length + 1}`;
        const draft: EditableCompression = {
            name: defaultName,
            kind: 'scalarQuantization',
            truncationDimension: null,
            rescoringOptions: {
                enableRescoring: true,
                rescoreStorageMethod: 'preserveOriginals'
            },
            scalarQuantizationParameters: {
                quantizedDataType: 'int8'
            }
        };
        setEditingCompressionIndex(null);
        setTempCompression(draft);
        setCompressionModalOpen(true);
    };

    const openEditCompressionEditor = (idx: number) => {
        const existing = ensureVectorSearchExists().compressions || [];
        const comp = existing[idx];
        if (!comp) return;
        setEditingCompressionIndex(idx);
        setTempCompression(structuredClone(comp) as EditableCompression);
        setCompressionModalOpen(true);
    };

    const deleteCompression = (idx: number) => {
        const list = [...(ensureVectorSearchExists().compressions || [])];
        list.splice(idx, 1);
        updateVectorSearch('compressions', list);
    };

    const saveCompressionFromModal = () => {
        if (!tempCompression) return;

        const normalized: EditableCompression = {
            ...tempCompression,
            name: (tempCompression.name || '').trim(),
            kind: (tempCompression.kind || '').trim()
        };

        if (normalized.rescoringOptions) {
            const enableRescoring = normalized.rescoringOptions.enableRescoring !== false;
            normalized.rescoringOptions = {
                ...normalized.rescoringOptions,
                enableRescoring,
                defaultOversampling: enableRescoring ? normalized.rescoringOptions.defaultOversampling : undefined
            };
        }

        if (normalized.kind === 'binaryQuantization') {
            normalized.scalarQuantizationParameters = undefined;
        }

        if (normalized.kind === 'scalarQuantization') {
            normalized.scalarQuantizationParameters = {
                ...(normalized.scalarQuantizationParameters || {}),
                quantizedDataType: normalized.scalarQuantizationParameters?.quantizedDataType || 'int8'
            };
        }

        const list = [...(ensureVectorSearchExists().compressions || [])];
        if (editingCompressionIndex === null) list.push(normalized);
        else list[editingCompressionIndex] = normalized;

        updateVectorSearch('compressions', list);
        setCompressionModalOpen(false);
        setTempCompression(null);
        setEditingCompressionIndex(null);
    };

    const renderCompressionEditorModal = () => {
        if (!compressionModalOpen || !tempCompression) return null;

        const kind = tempCompression.kind;
        const isScalar = kind === 'scalarQuantization';
        const isEditingExisting = editingCompressionIndex !== null;

        const rescoring = tempCompression.rescoringOptions || {};
        const enableRescoring = rescoring.enableRescoring !== false;

        return (
            <Modal
                title={editingCompressionIndex === null ? 'Add Compression' : 'Edit Compression'}
                isOpen={compressionModalOpen}
                onClose={() => {
                    setCompressionModalOpen(false);
                    setTempCompression(null);
                    setEditingCompressionIndex(null);
                }}
                width="760px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={compressionDescriptions.name} /></Label>
                            <Input
                                value={tempCompression.name || ''}
                                onChange={e => setTempCompression({ ...tempCompression, name: e.target.value })}
                                placeholder="e.g. sq-default"
                            />
                        </div>
                        <div>
                            <Label>Kind <InfoIcon tooltip={compressionDescriptions.kind} /></Label>
                            <SelectWithDescription
                                value={kind || ''}
                                onChange={e => {
                                    const newKind = e.target.value;
                                    if (newKind === 'binaryQuantization') {
                                        setTempCompression({
                                            ...tempCompression,
                                            kind: 'binaryQuantization',
                                            scalarQuantizationParameters: undefined
                                        });
                                        return;
                                    }
                                    if (newKind === 'scalarQuantization') {
                                        setTempCompression({
                                            ...tempCompression,
                                            kind: 'scalarQuantization',
                                            scalarQuantizationParameters: {
                                                quantizedDataType: tempCompression.scalarQuantizationParameters?.quantizedDataType || 'int8'
                                            }
                                        });
                                        return;
                                    }
                                    setTempCompression({ ...tempCompression, kind: newKind });
                                }}
                                options={compressionKindOptions}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Truncation Dimension <InfoIcon tooltip={compressionDescriptions.truncationDimension} /></Label>
                            <Input
                                type="number"
                                value={tempCompression.truncationDimension ?? ''}
                                onChange={e => setTempCompression({
                                    ...tempCompression,
                                    truncationDimension: e.target.value === '' ? null : parseInt(e.target.value)
                                })}
                                placeholder="(Not Set)"
                            />
                        </div>

                        {isScalar && (
                            <div>
                                <Label>Quantized Data Type <InfoIcon tooltip={compressionDescriptions.quantizedDataType} /></Label>
                                <SelectWithDescription
                                    value={tempCompression.scalarQuantizationParameters?.quantizedDataType || 'int8'}
                                    onChange={e => setTempCompression({
                                        ...tempCompression,
                                        scalarQuantizationParameters: {
                                            ...(tempCompression.scalarQuantizationParameters || {}),
                                            quantizedDataType: e.target.value as VectorSearchCompressionTargetDataType
                                        }
                                    })}
                                    options={qdtOptions}
                                />
                            </div>
                        )}
                    </div>

                    <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 8px' }}>Rescoring</legend>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '8px', backgroundColor: '#252526', borderRadius: '4px' }}>
                            <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={enableRescoring}
                                    onChange={e => setTempCompression({
                                        ...tempCompression,
                                        rescoringOptions: {
                                            ...(tempCompression.rescoringOptions || {}),
                                            enableRescoring: e.target.checked
                                        }
                                    })}
                                />
                                Enable Rescoring <InfoIcon tooltip={compressionDescriptions.enableRescoring} />
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                            <div>
                                <Label>Default Oversampling <InfoIcon tooltip={compressionDescriptions.defaultOversampling} /></Label>
                                <Input
                                    type="number"
                                    min={1}
                                    step={0.1}
                                    disabled={!enableRescoring}
                                    value={tempCompression.rescoringOptions?.defaultOversampling ?? ''}
                                    onChange={e => setTempCompression({
                                        ...tempCompression,
                                        rescoringOptions: {
                                            ...(tempCompression.rescoringOptions || {}),
                                            defaultOversampling: e.target.value === '' ? undefined : parseFloat(e.target.value)
                                        }
                                    })}
                                    placeholder={enableRescoring ? 'e.g. 2.0' : '(Disabled)'}
                                />
                            </div>
                            <div>
                                <Label>
                                    Rescore Storage Method <InfoIcon tooltip={compressionDescriptions.rescoreStorageMethod} />
                                </Label>
                                <SelectWithDescription
                                    value={tempCompression.rescoringOptions?.rescoreStorageMethod || 'preserveOriginals'}
                                    onChange={e => setTempCompression({
                                        ...tempCompression,
                                        rescoringOptions: {
                                            ...(tempCompression.rescoringOptions || {}),
                                            rescoreStorageMethod: e.target.value as VectorSearchCompressionRescoreStorageMethod
                                        }
                                    })}
                                    options={storageOptions}
                                    disabled={isEditingExisting}
                                />
                                {isEditingExisting && (
                                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                                        Immutable in the service; change requires recreating this compression.
                                    </div>
                                )}
                            </div>
                        </div>
                    </fieldset>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveCompressionFromModal}>Save</Button>
                    <Button onClick={() => {
                        setCompressionModalOpen(false);
                        setTempCompression(null);
                        setEditingCompressionIndex(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const algorithms = ensureVectorSearchExists().algorithms || [];
    const profiles = ensureVectorSearchExists().profiles || [];
    const compressions = ensureVectorSearchExists().compressions || [];
    const vectorizers = ensureVectorSearchExists().vectorizers || [];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444', display: 'flex', gap: '8px' }}>
                <Button onClick={openNewProfileEditor}>
                    <i className="fas fa-plus"></i> Add Profile
                </Button>
                <Button onClick={openNewAlgorithmEditor}>
                    <i className="fas fa-plus"></i> Add Algorithm
                </Button>
                <Button onClick={openNewCompressionEditor}>
                    <i className="fas fa-plus"></i> Add Compression
                </Button>
                <Button onClick={openNewVectorizerEditor}>
                    <i className="fas fa-plus"></i> Add Vectorizer
                </Button>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                {/* Profiles */}
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ccc', borderBottom: '1px solid #444', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Profiles <InfoIcon tooltip={profileDescriptions.profiles} />
                    </h4>
                    <table className="data-grid" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={profileDescriptions.name} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Algorithm <InfoIcon tooltip={profileDescriptions.algorithm} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Compression <InfoIcon tooltip={profileDescriptions.compression} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Vectorizer <InfoIcon tooltip={profileDescriptions.vectorizer} /></th>
                                <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((prof, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '4px' }}>{prof.name}</td>
                                    <td style={{ padding: '4px' }}>{getProfileAlgorithm(prof) || '-'}</td>
                                    <td style={{ padding: '4px' }}>{getProfileCompression(prof) || '-'}</td>
                                    <td style={{ padding: '4px' }}>{prof.vectorizer || '-'}</td>
                                    <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                        <Button variant="secondary" onClick={() => openEditProfileEditor(i)}>Edit</Button>
                                        <Button variant="icon" onClick={() => deleteProfile(i)}><i className="fas fa-trash"></i></Button>
                                    </td>
                                </tr>
                            ))}
                            {profiles.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                        No profiles configured
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Algorithms */}
                <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ccc', borderBottom: '1px solid #444', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Algorithms <InfoIcon tooltip={algorithmDescriptions.algorithms} />
                    </h4>
                    <table className="data-grid" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={algorithmDescriptions.name} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Kind <InfoIcon tooltip={algorithmDescriptions.kind} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Metric <InfoIcon tooltip={algorithmDescriptions.metric} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>m <InfoIcon tooltip={algorithmDescriptions.m} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>efConstruction <InfoIcon tooltip={algorithmDescriptions.efConstruction} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>efSearch <InfoIcon tooltip={algorithmDescriptions.efSearch} /></th>
                                <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {algorithms.map((algo, i) => {
                                const metric = algo.kind === 'hnsw' ? algo.hnswParameters?.metric : algo.exhaustiveKnnParameters?.metric;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '4px' }}>{algo.name}</td>
                                        <td style={{ padding: '4px' }}>{algo.kind}</td>
                                        <td style={{ padding: '4px' }}>{metric || '-'}</td>
                                        <td style={{ padding: '4px' }}>{algo.hnswParameters?.m ?? '-'}</td>
                                        <td style={{ padding: '4px' }}>{algo.hnswParameters?.efConstruction ?? '-'}</td>
                                        <td style={{ padding: '4px' }}>{algo.hnswParameters?.efSearch ?? '-'}</td>
                                        <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button variant="secondary" onClick={() => openEditAlgorithmEditor(i)}>Edit</Button>
                                            <Button variant="icon" onClick={() => deleteAlgorithm(i)}><i className="fas fa-trash"></i></Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {algorithms.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                        No algorithms configured
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Compressions */}
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ccc', borderBottom: '1px solid #444', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Compressions <InfoIcon tooltip={compressionDescriptions.compressions} />
                    </h4>
                    <table className="data-grid" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={compressionDescriptions.name} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Kind <InfoIcon tooltip={compressionDescriptions.kind} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Truncation <InfoIcon tooltip={compressionDescriptions.truncationDimension} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Rescore <InfoIcon tooltip={compressionDescriptions.enableRescoring} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Oversampling <InfoIcon tooltip={compressionDescriptions.defaultOversampling} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Storage <InfoIcon tooltip={compressionDescriptions.rescoreStorageMethod} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>QDT <InfoIcon tooltip={compressionDescriptions.quantizedDataType} /></th>
                                <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compressions.map((c, i) => {
                                const rescoringOptions = getCompressionRescoringOptions(c);
                                const enable = rescoringOptions?.enableRescoring !== false;
                                const kind = c.kind;
                                const scalarParams = getCompressionScalarParams(c);
                                const qdt = kind === 'scalarQuantization' ? scalarParams?.quantizedDataType : undefined;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '4px' }}>{c.name || '-'}</td>
                                        <td style={{ padding: '4px' }}>{kind || '-'}</td>
                                        <td style={{ padding: '4px' }}>{(c as { truncationDimension?: number | null }).truncationDimension ?? '-'}</td>
                                        <td style={{ padding: '4px' }}>{enable ? 'Yes' : 'No'}</td>
                                        <td style={{ padding: '4px' }}>{rescoringOptions?.defaultOversampling ?? '-'}</td>
                                        <td style={{ padding: '4px' }}>{rescoringOptions?.rescoreStorageMethod ?? '-'}</td>
                                        <td style={{ padding: '4px' }}>{qdt || '-'}</td>
                                        <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button variant="secondary" onClick={() => openEditCompressionEditor(i)}>Edit</Button>
                                            <Button variant="icon" onClick={() => deleteCompression(i)}><i className="fas fa-trash"></i></Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {compressions.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                        No compressions configured
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Vectorizers */}
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ccc', borderBottom: '1px solid #444', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Vectorizers <InfoIcon tooltip={vectorizerDescriptions.vectorizers} />
                    </h4>
                    <table className="data-grid" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={vectorizerDescriptions.name} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Kind <InfoIcon tooltip={vectorizerDescriptions.kind} /></th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Details</th>
                                <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vectorizers.map((v, i) => {
                                const details = (() => {
                                    if (v.kind === 'azureOpenAI') {
                                        const p = (v as AzureOpenAIVectorizer).azureOpenAIParameters;
                                        const parts = [
                                            p?.modelName ? `model: ${p.modelName}` : null,
                                            p?.deploymentId ? `deployment: ${p.deploymentId}` : null,
                                            p?.resourceUri ? `resource: ${p.resourceUri}` : null
                                        ].filter(Boolean);
                                        return parts.length ? parts.join(', ') : '-';
                                    }
                                    if (v.kind === 'customWebApi') {
                                        const p = (v as WebApiVectorizer).customWebApiParameters;
                                        const parts = [
                                            p?.httpMethod ? `method: ${p.httpMethod}` : null,
                                            p?.uri ? `uri: ${p.uri}` : null
                                        ].filter(Boolean);
                                        return parts.length ? parts.join(', ') : '-';
                                    }
                                    return '-';
                                })();

                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '4px' }}>{v.name || '-'}</td>
                                        <td style={{ padding: '4px' }}>{v.kind || '-'}</td>
                                        <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>{details}</td>
                                        <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button variant="secondary" onClick={() => openEditVectorizerEditor(i)}>Edit</Button>
                                            <Button variant="icon" onClick={() => deleteVectorizer(i)}><i className="fas fa-trash"></i></Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {vectorizers.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                        No vectorizers configured
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {renderAlgorithmEditorModal()}
            {renderProfileEditorModal()}
            {renderCompressionEditorModal()}
            {renderVectorizerEditorModal()}
        </div>
    );
};
