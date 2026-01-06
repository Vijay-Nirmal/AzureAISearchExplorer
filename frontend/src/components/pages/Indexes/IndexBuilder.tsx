import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import type { 
    SearchIndex, 
    SearchField, 
    VectorSearch
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
                    if (!data.vectorSearch) data.vectorSearch = { algorithms: [], profiles: [], vectorizers: [] };
                    if (!data.fields) data.fields = [];
                    if (!data.suggesters) data.suggesters = [];
                    if (!data.scoringProfiles) data.scoringProfiles = [];
                    if (!data.corsOptions) data.corsOptions = { allowedOrigins: [] };
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
            alert("Failed to save index: " + (error as any).message);
        } finally {
            setLoading(false);
        }
    };
    
    // Field Helpers
    const addField = () => {
        setIndexDef({
            ...indexDef,
            fields: [...indexDef.fields, { name: 'newField', type: 'Edm.String' }]
        });
    };

    const updateField = (idx: number, updates: Partial<SearchField>) => {
        const newFields = [...indexDef.fields];
        newFields[idx] = { ...newFields[idx], ...updates };
        setIndexDef({ ...indexDef, fields: newFields });
    };

    const removeField = (idx: number) => {
        const newFields = [...indexDef.fields];
        newFields.splice(idx, 1);
        setIndexDef({ ...indexDef, fields: newFields });
    };

    // --- Tab Renderers ---

    const renderHeader = () => (
         <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#252526' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                {isEdit ? indexDef.name : 'Create Index'}
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="primary" onClick={saveIndex} disabled={loading}><i className="fas fa-save"></i> Save</Button>
                <Button onClick={onBack}>Cancel</Button>
            </div>
        </div>
    );

    const renderTabs = () => (
        <div style={{ backgroundColor: '#252526', padding: '0 16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
                {['fields', 'vector', 'suggesters', 'scoring', 'cors', 'json'].map(tab => (
                    <div 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                            padding: '8px 16px', cursor: 'pointer',
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

    const renderFieldsTab = () => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <div style={{ padding: '16px', borderBottom: '1px solid #333', backgroundColor: '#252526', display: 'flex', gap: '16px' }}>
                 <div style={{ flex: 1, maxWidth: '400px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '11px' }}>Index Name</label>
                    <Input value={indexDef.name} onChange={e => setIndexDef({...indexDef, name: e.target.value})} disabled={isEdit} />
                </div>
            </div>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444' }}>
                <Button onClick={addField}><i className="fas fa-plus"></i> Add Field</Button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                 <table className="data-grid" style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2d2d2d', zIndex: 1 }}>
                        <tr>
                            <th style={{ width: '200px', padding: '8px' }}>Name</th>
                            <th style={{ width: '150px', padding: '8px' }}>Type</th>
                            <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Key">Key</th>
                            <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Retrievable">Retrievable</th>
                            <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Filterable">Filterable</th>
                            <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Sortable">Sortable</th>
                            <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Facetable">Facetable</th>
                            <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Searchable">Searchable</th>
                            <th style={{ width: '150px', padding: '8px' }}>Analyzer</th>
                            <th style={{ width: '80px', padding: '8px' }}>Dims</th>
                            <th style={{ width: '150px', padding: '8px' }}>Vector Profile</th>
                            <th style={{ width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {indexDef.fields.map((f, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '4px' }}><Input value={f.name} onChange={e => updateField(i, { name: e.target.value })} style={{ border: 'none', background: 'transparent' }} /></td>
                                <td style={{ padding: '4px' }}>
                                    <Select value={f.type} onChange={e => updateField(i, { type: e.target.value })} style={{ border: 'none', background: 'transparent' }}>
                                        <option>Edm.String</option>
                                        <option>Edm.Int32</option>
                                        <option>Edm.Int64</option>
                                        <option>Edm.Double</option>
                                        <option>Edm.Boolean</option>
                                        <option>Edm.DateTimeOffset</option>
                                        <option>Edm.GeographyPoint</option>
                                        <option>Edm.ComplexType</option>
                                        <option>Collection(Edm.String)</option>
                                        <option>Collection(Edm.Single)</option>
                                    </Select>
                                </td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={f.key} onChange={e => updateField(i, { key: e.target.checked })} /></td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={f.retrievable !== false} onChange={e => updateField(i, { retrievable: e.target.checked })} /></td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={f.filterable} onChange={e => updateField(i, { filterable: e.target.checked })} /></td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={f.sortable} onChange={e => updateField(i, { sortable: e.target.checked })} /></td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={f.facetable} onChange={e => updateField(i, { facetable: e.target.checked })} /></td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={f.searchable} onChange={e => updateField(i, { searchable: e.target.checked })} /></td>
                                <td style={{ padding: '4px' }}>
                                    <Select value={f.analyzer || ''} onChange={e => updateField(i, { analyzer: e.target.value })} style={{ border: 'none', background: 'transparent' }}>
                                        <option value="">(Default)</option>
                                        <option value="standard.lucene">standard.lucene</option>
                                        <option value="en.microsoft">en.microsoft</option>
                                        <option value="image_analyzer">image_analyzer (Preiew)</option>
                                    </Select>
                                </td>
                                 <td style={{ padding: '4px' }}>
                                    {f.type.includes('Single') && (
                                        <Input type="number" value={f.vectorSearchDimensions} onChange={e => updateField(i, { vectorSearchDimensions: parseInt(e.target.value) })} style={{ width: '60px', border: 'none', background: 'transparent' }} />
                                    )}
                                </td>
                                <td style={{ padding: '4px' }}>
                                    {f.type.includes('Single') && (
                                        <Select value={f.vectorSearchProfileName} onChange={e => updateField(i, { vectorSearchProfileName: e.target.value })} style={{ border: 'none', background: 'transparent' }}>
                                            <option value=""></option>
                                            {indexDef.vectorSearch?.profiles?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                        </Select>
                                    )}
                                </td>
                                <td>
                                     <button className="icon-btn" onClick={() => removeField(i)}><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
    );

    // Vector Search Logic
    const updateVectorSearch = (key: keyof VectorSearch, newList: any[]) => {
        setIndexDef(prev => ({
            ...prev,
            vectorSearch: {
                ...(prev.vectorSearch || {}),
                [key]: newList
            }
        }));
    };

    const renderVectorTab = () => (
        <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
            {/* Algorithms */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{ borderBottom: '1px solid #444', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    Algorithms
                    <Button variant="secondary" onClick={() => updateVectorSearch('algorithms', [...(indexDef.vectorSearch?.algorithms || []), { name: 'new-algo', kind: 'hnsw', hnswParameters: { m: 4, efConstruction: 400, efSearch: 500, metric: 'cosine' } }])}>
                        <i className="fas fa-plus"></i> Add
                    </Button>
                </h4>
                <table className="data-grid">
                    <thead><tr><th>Name</th><th>Kind</th><th>Metric</th><th>M</th><th>efConstruction</th><th></th></tr></thead>
                    <tbody>
                        {indexDef.vectorSearch?.algorithms?.map((algo, i) => (
                            <tr key={i}>
                                <td><Input value={algo.name} onChange={e => {
                                    const list = [...(indexDef.vectorSearch?.algorithms || [])];
                                    list[i].name = e.target.value;
                                    updateVectorSearch('algorithms', list);
                                }} style={{background:'transparent', border:'none'}}/></td>
                                <td>
                                    <Select value={algo.kind} onChange={e => {
                                         const list = [...(indexDef.vectorSearch?.algorithms || [])];
                                         list[i].kind = e.target.value;
                                         updateVectorSearch('algorithms', list);
                                    }} style={{background:'transparent', border:'none'}}>
                                        <option value="hnsw">HNSW</option>
                                        <option value="exhaustiveKnn">Exhaustive KNN</option>
                                    </Select>
                                </td>
                                <td>
                                    <Select value={(algo.hnswParameters || algo.exhaustiveKnnParameters)?.metric || 'cosine'} onChange={e => {
                                         const list = [...(indexDef.vectorSearch?.algorithms || [])];
                                         const params = algo.kind === 'hnsw' ? (list[i].hnswParameters || {}) : (list[i].exhaustiveKnnParameters || {});
                                         params.metric = e.target.value as any;
                                         if(algo.kind === 'hnsw') list[i].hnswParameters = params;
                                         else list[i].exhaustiveKnnParameters = params;
                                         updateVectorSearch('algorithms', list);
                                    }} style={{background:'transparent', border:'none'}}>
                                        <option value="cosine">Cosine</option>
                                        <option value="euclidean">Euclidean</option>
                                        <option value="dotProduct">Dot Product</option>
                                    </Select>
                                </td>
                                <td>{algo.kind === 'hnsw' && 
                                    <Input type="number" value={algo.hnswParameters?.m} onChange={e => {
                                        const list = [...(indexDef.vectorSearch?.algorithms || [])];
                                        list[i].hnswParameters = { ...list[i].hnswParameters, m: parseInt(e.target.value) };
                                        updateVectorSearch('algorithms', list);
                                    }} style={{width:'60px', background:'transparent', border:'none'}}/>
                                }</td>
                                <td>{algo.kind === 'hnsw' && 
                                    <Input type="number" value={algo.hnswParameters?.efConstruction} onChange={e => {
                                        const list = [...(indexDef.vectorSearch?.algorithms || [])];
                                        list[i].hnswParameters = { ...list[i].hnswParameters, efConstruction: parseInt(e.target.value) };
                                        updateVectorSearch('algorithms', list);
                                    }} style={{width:'60px', background:'transparent', border:'none'}}/>
                                }</td>
                                <td><button className="icon-btn" onClick={() => {
                                    const list = [...(indexDef.vectorSearch?.algorithms || [])];
                                    list.splice(i, 1);
                                    updateVectorSearch('algorithms', list);
                                }}><i className="fas fa-trash"></i></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Profiles */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{ borderBottom: '1px solid #444', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    Profiles
                    <Button variant="secondary" onClick={() => updateVectorSearch('profiles', [...(indexDef.vectorSearch?.profiles || []), { name: 'new-profile', algorithmConfigurationName: '' }])}>
                        <i className="fas fa-plus"></i> Add
                    </Button>
                </h4>
                 <table className="data-grid">
                    <thead><tr><th>Name</th><th>Algorithm</th><th>Vectorizer</th><th></th></tr></thead>
                    <tbody>
                        {indexDef.vectorSearch?.profiles?.map((prof, i) => (
                            <tr key={i}>
                                <td><Input value={prof.name} onChange={e => {
                                    const list = [...(indexDef.vectorSearch?.profiles || [])];
                                    list[i].name = e.target.value;
                                    updateVectorSearch('profiles', list);
                                }} style={{background:'transparent', border:'none'}}/></td>
                                <td>
                                    <Select value={prof.algorithmConfigurationName} onChange={e => {
                                         const list = [...(indexDef.vectorSearch?.profiles || [])];
                                         list[i].algorithmConfigurationName = e.target.value;
                                         updateVectorSearch('profiles', list);
                                    }} style={{background:'transparent', border:'none'}}>
                                        <option value="">Select Algo...</option>
                                        {indexDef.vectorSearch?.algorithms?.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                    </Select>
                                </td>
                                <td>
                                     <Select value={prof.vectorizer} onChange={e => {
                                         const list = [...(indexDef.vectorSearch?.profiles || [])];
                                         list[i].vectorizer = e.target.value;
                                         updateVectorSearch('profiles', list);
                                    }} style={{background:'transparent', border:'none'}}>
                                        <option value="">(None)</option>
                                        {/* TODO: Add Vectorizers list */}
                                    </Select>
                                </td>
                                <td><button className="icon-btn" onClick={() => {
                                    const list = [...(indexDef.vectorSearch?.profiles || [])];
                                    list.splice(i, 1);
                                    updateVectorSearch('profiles', list);
                                }}><i className="fas fa-trash"></i></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSuggestersTab = () => (
        <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
            <h4 style={{ borderBottom: '1px solid #444', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                Suggesters
                <Button variant="secondary" onClick={() => setIndexDef({...indexDef, suggesters: [...(indexDef.suggesters || []), { name: 'sg', sourceFields: [] }]})}>
                    <i className="fas fa-plus"></i> Add
                </Button>
            </h4>
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
    );

    const renderScoringTab = () => (
         <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
            <h4 style={{ borderBottom: '1px solid #444', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                Scoring Profiles
                <Button variant="secondary" onClick={() => setIndexDef({...indexDef, scoringProfiles: [...(indexDef.scoringProfiles || []), { name: 'profile1', textWeights: { weights: {} } }]})}>
                    <i className="fas fa-plus"></i> Add
                </Button>
            </h4>
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
                                    } catch {}
                                }}
                             />
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );

    const renderCorsTab = () => (
         <div style={{ padding: '16px', flex: 1 }}>
            <h4 style={{ borderBottom: '1px solid #444', paddingBottom: '8px' }}>CORS Options</h4>
            <div style={{ maxWidth: '500px' }}>
                <div style={{ marginBottom: '16px' }}>
                     <label style={{ display:'block', marginBottom:'8px', fontSize:'13px' }}>Allowed Origins</label>
                     <div style={{ display:'flex', gap:'8px' }}>
                         <Input 
                            value={indexDef.corsOptions?.allowedOrigins.join(', ')} 
                            onChange={e => setIndexDef({
                                ...indexDef,
                                corsOptions: { ...indexDef.corsOptions, allowedOrigins: e.target.value.split(',').map(s=>s.trim()) }
                            })}
                            placeholder="*, http://localhost:3000"
                        />
                     </div>
                     <small style={{ color:'#888' }}>Comma separated list of origins or *</small>
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
            </div>
        </div>
    );

    // --- Main Render ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderHeader()}
            {renderTabs()}
            <div style={{ flex: 1, backgroundColor: '#1e1e1e', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'fields' && renderFieldsTab()}
                {activeTab === 'vector' && renderVectorTab()}
                {activeTab === 'suggesters' && renderSuggestersTab()}
                {activeTab === 'scoring' && renderScoringTab()}
                {activeTab === 'cors' && renderCorsTab()}
                {activeTab === 'json' && (
                    <div style={{ flex: 1, padding: '0', overflow: 'auto' }}>
                       <pre style={{ margin: 0, padding: '16px', fontFamily: 'Consolas', fontSize: '13px', color: '#9cdcfe' }}>
                           {JSON.stringify(indexDef, null, 2)}
                       </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IndexBuilder;
