import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { JsonView } from '../../common/JsonView';
import { IndexFieldsTab } from './IndexFieldsTab';
import { IndexVectorSearchTab } from './IndexVectorSearchTab';
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
                } catch (error) {
                    console.error("Failed to fetch index definition", error);
                    alert("Failed to load index definition");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchIndex();
    }, [isEdit, activeConnectionId, indexName]);

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
            alert("Failed to save index: " + message);
        } finally {
            setLoading(false);
        }
    };
    
    // --- Tab Renderers ---

    const renderHeader = () => (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                    {isEdit ? indexDef.name : 'Create Index'}
                </h2>
                {!isEdit && (
                    <div style={{ width: '300px' }}>
                        <Input
                            value={indexDef.name}
                            onChange={e => setIndexDef({ ...indexDef, name: e.target.value })}
                            placeholder="Index name (e.g. my-index)"
                            style={{ width: '100%' }}
                        />
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="primary" onClick={saveIndex} disabled={loading}><i className="fas fa-save"></i> Save</Button>
                <Button onClick={onBack}>Cancel</Button>
            </div>
        </div>
    );

    const renderTabs = () => (
        <div style={{ padding: '0 16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
                {['fields', 'vector', 'suggesters', 'scoring', 'cors', 'json'].map(tab => (
                    <div
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab ? '3px solid var(--accent-color)' : '3px solid transparent',
                            fontWeight: activeTab === tab ? 600 : 400,
                            color: activeTab === tab ? '#fff' : '#888',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'vector' ? 'Vector Search' : tab === 'scoring' ? 'Scoring Profiles' : tab}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSuggestersTab = () => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444' }}>
                <Button onClick={() => setIndexDef({...indexDef, suggesters: [...(indexDef.suggesters || []), { name: 'sg', sourceFields: [] }]})}>
                    <i className="fas fa-plus"></i> Add Suggester
                </Button>
            </div>
            <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                    {indexDef.suggesters?.map((sg, i) => (
                        <div key={i} style={{ padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: '#aaa' }}>Name</label>
                                    <Input value={sg.name} onChange={e => {
                                        const list = [...(indexDef.suggesters || [])];
                                        list[i].name = e.target.value;
                                        setIndexDef({ ...indexDef, suggesters: list });
                                    }} />
                                </div>
                                <Button variant="icon" onClick={() => {
                                     const list = [...(indexDef.suggesters || [])];
                                     list.splice(i, 1);
                                     setIndexDef({ ...indexDef, suggesters: list });
                                }}><i className="fas fa-trash"></i></Button>
                            </div>
                            <div>
                                 <label style={{ fontSize: '11px', color: '#aaa' }}>Source Fields (Comma separated)</label>
                                 <Input value={sg.sourceFields.join(', ')} onChange={e => {
                                    const list = [...(indexDef.suggesters || [])];
                                    list[i].sourceFields = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                    setIndexDef({ ...indexDef, suggesters: list });
                                 }} placeholder="field1, field2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderScoringTab = () => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444' }}>
                <Button onClick={() => setIndexDef({...indexDef, scoringProfiles: [...(indexDef.scoringProfiles || []), { name: 'profile1', textWeights: { weights: {} } }]})}>
                    <i className="fas fa-plus"></i> Add Scoring Profile
                </Button>
            </div>
            <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
                 <div style={{ display: 'grid', gap: '16px' }}>
                    {indexDef.scoringProfiles?.map((sp, i) => (
                        <div key={i} style={{ padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                             <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                 <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: '#aaa' }}>Name</label>
                                    <Input value={sp.name} onChange={e => {
                                        const list = [...(indexDef.scoringProfiles || [])];
                                        list[i].name = e.target.value;
                                        setIndexDef({ ...indexDef, scoringProfiles: list });
                                    }} />
                                </div>
                                 <Button variant="icon" onClick={() => {
                                     const list = [...(indexDef.scoringProfiles || [])];
                                     list.splice(i, 1);
                                     setIndexDef({ ...indexDef, scoringProfiles: list });
                                }}><i className="fas fa-trash"></i></Button>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: '#aaa' }}>Text Weights (JSON)</label>
                                 <textarea 
                                    style={{ width: '100%', height: '80px', backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid #3c3c3c', fontFamily: 'Consolas' }}
                                    value={JSON.stringify(sp.textWeights?.weights || {}, null, 2)}
                                    onChange={e => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            const list = [...(indexDef.scoringProfiles || [])];
                                            list[i].textWeights = { weights: parsed };
                                            setIndexDef({ ...indexDef, scoringProfiles: list });
                                        } catch {
                                            // Ignore invalid JSON while user is typing
                                        }
                                    }}
                                 />
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );

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
                    {activeTab === 'suggesters' && renderSuggestersTab()}
                    {activeTab === 'scoring' && renderScoringTab()}
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
