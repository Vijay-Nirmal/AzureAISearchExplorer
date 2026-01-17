import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { alertService } from '../../../services/alertService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { JsonView } from '../../common/JsonView';
import { IndexFieldsTab } from './IndexFieldsTab';
import { IndexSuggestersTab } from './IndexSuggestersTab';
import { IndexVectorSearchTab } from './IndexVectorSearchTab';
import { IndexScoringProfilesTab } from './IndexScoringProfilesTab';
import { IndexAnalyzersTab } from './IndexAnalyzersTab';
import { IndexCharFiltersTab } from './IndexCharFiltersTab';
import { IndexNormalizersTab } from './IndexNormalizersTab';
import { IndexTokenizersTab } from './IndexTokenizersTab';
import { IndexTokenFiltersTab } from './IndexTokenFiltersTab';
import { IndexSemanticTab } from './IndexSemanticTab';
import { IndexSimilarityTab } from './IndexSimilarityTab';
import { IndexEncryptionKeyTab } from './IndexEncryptionKeyTab';
import { InfoIcon } from '../../common/InfoIcon';

import searchIndexPropertyDescriptions from '../../../data/constants/searchIndexPropertyDescriptions.json';
import type { 
    SearchIndex
} from '../../../types/IndexModels';

interface IndexBuilderProps {
    indexName?: string; // If editing
    onBack: () => void;
}

const IndexBuilder: React.FC<IndexBuilderProps> = ({ indexName, onBack }) => {
    const { activeConnectionId, setBreadcrumbs } = useLayout();
    const isEdit = !!indexName;
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('fields');

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionDraft, setDescriptionDraft] = useState('');

    // Index Definition State
    const [indexDef, setIndexDef] = useState<SearchIndex>({
        name: indexName || 'new-index',
        fields: [
            { name: 'id', type: 'Edm.String', key: true, searchable: false, retrievable: true, filterable: false, sortable: false, facetable: false },
        ],
        vectorSearch: {
            algorithms: [],
            profiles: [],
            compressions: [],
            vectorizers: []
        },
        corsOptions: { allowedOrigins: ['*'], maxAgeInSeconds: 300 },
        suggesters: [],
        scoringProfiles: []
    });

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Indexes', onClick: onBack },
            { label: isEdit ? indexName : 'Create Index' }
        ]);
        return () => setBreadcrumbs([]);
    }, [isEdit, indexName, onBack, setBreadcrumbs]);

    useEffect(() => {
        const fetchIndex = async () => {
             // ... existing code ...
             if (isEdit && activeConnectionId && indexName) {
                setLoading(true);
                try {
                    const data = await indexesService.getIndex(activeConnectionId, indexName);
                    // Ensure defaults
                    if (!data.vectorSearch) data.vectorSearch = { algorithms: [], profiles: [], compressions: [], vectorizers: [] };
                    if (!data.vectorSearch.algorithms) data.vectorSearch.algorithms = [];
                    if (!data.vectorSearch.profiles) data.vectorSearch.profiles = [];
                    if (!data.vectorSearch.compressions) data.vectorSearch.compressions = [];
                    if (!data.vectorSearch.vectorizers) data.vectorSearch.vectorizers = [];
                    if (!data.fields) data.fields = [];
                    if (!data.suggesters) data.suggesters = [];
                    if (!data.scoringProfiles) data.scoringProfiles = [];
                    // if (!data.corsOptions) data.corsOptions = { allowedOrigins: [] };
                    setIndexDef(data);

                    // if user isn't currently editing, keep the draft in sync with loaded value
                    if (!isEditingDescription) {
                        setDescriptionDraft(data.description || '');
                    }
                } catch (error) {
                    console.error("Failed to fetch index definition", error);
                    alertService.show({ title: 'Error', message: 'Failed to load index definition.' });
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchIndex();
    }, [isEdit, activeConnectionId, indexName, isEditingDescription]);

    const saveIndex = async () => {
         // ... existing code ...
         if (!activeConnectionId) return;
        setLoading(true);
        try {
            await indexesService.createOrUpdateIndex(activeConnectionId, indexDef);
            onBack();
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : String(error);
            alertService.show({ title: 'Error', message: `Failed to save index: ${message}` });
        } finally {
            setLoading(false);
        }
    };
    
    // --- Tab Renderers ---

    const renderHeader = () => {
        const descriptionText = (indexDef.description || '').trim();

        return (
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.15, flexShrink: 0 }}>
                        {isEdit ? indexDef.name : 'Create Index'}
                    </h2>

                    {!isEdit && (
                        <div style={{ width: '300px', flexShrink: 0 }}>
                            <Input
                                value={indexDef.name}
                                onChange={e => setIndexDef({ ...indexDef, name: e.target.value })}
                                placeholder="Index name (e.g. my-index)"
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, color: '#aaa', fontSize: '12px', lineHeight: 1.2 }}>
                        {!isEditingDescription && descriptionText.length > 0 && (
                            <span
                                style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '55vw'
                                }}
                                title={descriptionText}
                            >
                                — {descriptionText}
                            </span>
                        )}

                        {isEditingDescription && (
                            <>
                                <div style={{ width: '520px', maxWidth: '55vw' }}>
                                    <Input
                                        value={descriptionDraft}
                                        onChange={e => setDescriptionDraft(e.target.value)}
                                        placeholder="Index description"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <Button
                                    variant="icon"
                                    onClick={() => {
                                        const next = descriptionDraft.trim();
                                        setIndexDef(prev => ({ ...prev, description: next ? next : undefined }));
                                        setIsEditingDescription(false);
                                    }}
                                    title="Save description"
                                >
                                    <i className="fas fa-check"></i>
                                </Button>
                                <Button
                                    variant="icon"
                                    onClick={() => {
                                        setDescriptionDraft(indexDef.description || '');
                                        setIsEditingDescription(false);
                                    }}
                                    title="Cancel"
                                >
                                    <i className="fas fa-times"></i>
                                </Button>
                            </>
                        )}

                        {!isEditingDescription && (
                            <Button
                                variant="icon"
                                onClick={() => {
                                    setDescriptionDraft(indexDef.description || '');
                                    setIsEditingDescription(true);
                                }}
                                title={descriptionText ? 'Edit description' : 'Add description'}
                                style={{ opacity: 0.9, flexShrink: 0 }}
                            >
                                <i className="fas fa-pen"></i>
                            </Button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Button variant="primary" onClick={saveIndex} disabled={loading}><i className="fas fa-save"></i> Save</Button>
                    <Button onClick={onBack}>Cancel</Button>
                </div>
            </div>
        );
    };

    const renderTabs = () => {
        const tabs: Array<{ id: string; label: string; tooltipKey?: keyof typeof searchIndexPropertyDescriptions }> = [
            { id: 'fields', label: 'Fields', tooltipKey: 'fields' },
            { id: 'vector', label: 'Vector Search', tooltipKey: 'vectorSearch' },
            { id: 'suggesters', label: 'Suggesters', tooltipKey: 'suggesters' },
            { id: 'scoring', label: 'Scoring Profiles', tooltipKey: 'scoringProfiles' },
            { id: 'analyzers', label: 'Analyzers', tooltipKey: 'analyzers' },
            { id: 'charFilters', label: 'Char Filters', tooltipKey: 'charFilters' },
            { id: 'normalizers', label: 'Normalizers', tooltipKey: 'normalizers' },
            { id: 'tokenizers', label: 'Tokenizers', tooltipKey: 'tokenizers' },
            { id: 'tokenFilters', label: 'Token Filters', tooltipKey: 'tokenFilters' },
            { id: 'semantic', label: 'Semantic', tooltipKey: 'semantic' },
            { id: 'similarity', label: 'Similarity', tooltipKey: 'similarity' },
            { id: 'encryptionKey', label: 'Encryption Key', tooltipKey: 'encryptionKey' },
            { id: 'cors', label: 'CORS', tooltipKey: 'corsOptions' },
            { id: 'json', label: 'JSON' }
        ];

        return (
            <div style={{ padding: '0 12px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '1px', minWidth: 'max-content' }}>
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '6px 10px',
                                cursor: 'pointer',
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                                color: activeTab === tab.id ? '#fff' : '#888',
                                flexShrink: 0,
                                lineHeight: 1.1,
                                fontSize: '12px'
                            }}
                        >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {tab.label}
                                {tab.tooltipKey && !!searchIndexPropertyDescriptions[tab.tooltipKey] && (
                                    <span onClick={(e) => e.stopPropagation()}>
                                        <InfoIcon tooltip={searchIndexPropertyDescriptions[tab.tooltipKey]} />
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCorsTab = () => {
        const corsMode = !indexDef.corsOptions 
            ? 'none' 
            : indexDef.corsOptions.allowedOrigins.includes('*') 
                ? 'all' 
                : 'custom';

        const setCorsMode = (mode: string) => {
            if (mode === 'none') {
                setIndexDef({ ...indexDef, corsOptions: undefined });
            } else if (mode === 'all') {
                setIndexDef({ 
                    ...indexDef, 
                    corsOptions: { 
                        allowedOrigins: ['*'], 
                        maxAgeInSeconds: indexDef.corsOptions?.maxAgeInSeconds || 300 
                    } 
                });
            } else if (mode === 'custom') {
                 setIndexDef({ 
                    ...indexDef, 
                    corsOptions: { 
                        allowedOrigins: [], 
                        maxAgeInSeconds: indexDef.corsOptions?.maxAgeInSeconds || 300 
                    } 
                });
            }
        };

        return (
         <div style={{ padding: '16px', flex: 1 }}>
            <div style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '24px', display: 'flex', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                            type="radio" 
                            name="corsMode" 
                            checked={corsMode === 'none'} 
                            onChange={() => setCorsMode('none')} 
                        />
                        <span>None (Disabled)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                            type="radio" 
                            name="corsMode" 
                            checked={corsMode === 'all'} 
                            onChange={() => setCorsMode('all')} 
                        />
                        <span>All (*)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                            type="radio" 
                            name="corsMode" 
                            checked={corsMode === 'custom'} 
                            onChange={() => setCorsMode('custom')} 
                        />
                        <span>Custom</span>
                    </label>
                </div>

                {corsMode !== 'none' && (
                    <>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display:'block', marginBottom:'8px', fontSize:'13px' }}>Allowed Origins</label>
                            <Input 
                                value={indexDef.corsOptions?.allowedOrigins.join(', ')} 
                                onChange={e => setIndexDef({
                                    ...indexDef,
                                    corsOptions: { 
                                        ...indexDef.corsOptions!, 
                                        allowedOrigins: e.target.value.split(',').map(s=>s.trim()) 
                                    }
                                })}
                                placeholder={corsMode === 'all' ? "*" : "http://localhost:3000, https://..."}
                                disabled={corsMode === 'all'}
                            />
                            {corsMode === 'custom' && <small style={{ color:'#888' }}>Comma separated list of origins</small>}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display:'block', marginBottom:'8px', fontSize:'13px' }}>Max Age (Seconds)</label>
                            <Input 
                                type="number"
                                value={indexDef.corsOptions?.maxAgeInSeconds} 
                                onChange={e => setIndexDef({
                                    ...indexDef,
                                    corsOptions: { ...indexDef.corsOptions!, maxAgeInSeconds: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
        );
    };

    // --- Main Render ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
            {renderHeader()}
            <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {renderTabs()}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'fields' && (
                        <IndexFieldsTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'vector' && (
                        <IndexVectorSearchTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'suggesters' && (
                        <IndexSuggestersTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'scoring' && (
                        <IndexScoringProfilesTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'analyzers' && (
                        <IndexAnalyzersTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'charFilters' && (
                        <IndexCharFiltersTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'normalizers' && (
                        <IndexNormalizersTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'tokenizers' && (
                        <IndexTokenizersTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'tokenFilters' && (
                        <IndexTokenFiltersTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'semantic' && (
                        <IndexSemanticTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'similarity' && (
                        <IndexSimilarityTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'encryptionKey' && (
                        <IndexEncryptionKeyTab indexDef={indexDef} setIndexDef={setIndexDef} />
                    )}
                    {activeTab === 'cors' && renderCorsTab()}
                    {activeTab === 'json' && (
                        <div style={{ flex: 1, padding: '0', overflow: 'hidden' }}>
                        <JsonView data={indexDef} />
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default IndexBuilder;
