import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import type { SearchIndex, SearchField, VectorSearchAlgorithm, VectorSearchProfile } from '../../../types/IndexModels';

interface IndexBuilderProps {
    indexName?: string; // If editing
    onBack: () => void;
}

const IndexBuilder: React.FC<IndexBuilderProps> = ({ indexName, onBack }) => {
    const { activeConnectionId } = useLayout();
    const isEdit = !!indexName;
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('fields');
    
    // Index Definition State
    const [indexDef, setIndexDef] = useState<SearchIndex>({
        name: indexName || 'new-index',
        fields: [
            { name: 'id', type: 'Edm.String', key: true, searchable: false, retrievable: true, filterable: false, sortable: false, facetable: false },
            { name: 'content', type: 'Edm.String', searchable: true, retrievable: true }
        ],
        vectorSearch: {
            algorithms: [],
            profiles: []
        },
        corsOptions: { allowedOrigins: ['*'], maxAgeInSeconds: 300 },
        suggesters: [],
        scoringProfiles: []
    });

    useEffect(() => {
        const fetchIndex = async () => {
            if (isEdit && activeConnectionId && indexName) {
                setLoading(true);
                try {
                    const data = await indexesService.getIndex(activeConnectionId, indexName);
                    // Ensure defaults
                    if (!data.vectorSearch) data.vectorSearch = { algorithms: [], profiles: [] };
                    if (!data.fields) data.fields = [];
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

    // Vector Search Helpers
    const addAlgorithm = () => {
        const newAlgo: VectorSearchAlgorithm = { name: 'hnsw-1', kind: 'hnsw', hnswParameters: { m: 4, efConstruction: 400, efSearch: 500, metric: 'cosine' } };
        setIndexDef({ ...indexDef, vectorSearch: { ...indexDef.vectorSearch, algorithms: [...(indexDef.vectorSearch?.algorithms || []), newAlgo] } });
    };

    const addProfile = () => {
         const newProf: VectorSearchProfile = { name: 'vector-profile-1', algorithmConfigurationName: 'hnsw-1' };
         setIndexDef({ ...indexDef, vectorSearch: { ...indexDef.vectorSearch, profiles: [...(indexDef.vectorSearch?.profiles || []), newProf] } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#252526' }}>
                <div className="breadcrumbs" style={{ fontSize: '13px', color: '#888' }}>
                    <span style={{ cursor:'pointer' }} onClick={onBack}>Indexes</span> 
                    <i className="fas fa-chevron-right" style={{ fontSize:'10px', margin:'0 6px' }}></i> 
                    <span className="current" style={{ fontWeight: 600, color: 'var(--text-color)' }}>{isEdit ? indexDef.name : 'Create Index'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="primary" onClick={saveIndex} disabled={loading}><i className="fas fa-save"></i> Save</Button>
                    <Button onClick={onBack}>Cancel</Button>
                </div>
            </div>

            {/* Tabs */}
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
                            {tab === 'vector' ? 'Vector Search' : tab}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, backgroundColor: '#1e1e1e', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'fields' && (
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
                             <table className="data-grid" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2d2d2d', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ width: '200px', padding: '8px' }}>Name</th>
                                        <th style={{ width: '150px', padding: '8px' }}>Type</th>
                                        <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Key">K</th>
                                        <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Retrievable">R</th>
                                        <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Filterable">F</th>
                                        <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Sortable">S</th>
                                        <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Facetable">Fa</th>
                                        <th style={{ width: '40px', padding: '8px', textAlign: 'center' }} title="Searchable">Se</th>
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
                                                    <option>Edm.Boolean</option>
                                                    <option>Edm.DateTimeOffset</option>
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
                )}

                {activeTab === 'vector' && (
                    <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                        <h4 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '8px' }}>Algorithms</h4>
                        <table className="data-grid" style={{ marginBottom: '24px' }}>
                            <thead><tr><th>Name</th><th>Kind</th><th>Parameters</th></tr></thead>
                            <tbody>
                                {indexDef.vectorSearch?.algorithms?.map((algo, i) => (
                                    <tr key={i}>
                                        <td>{algo.name}</td>
                                        <td>{algo.kind}</td>
                                        <td>{JSON.stringify(algo.hnswParameters || algo.exhaustiveKnnParameters)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Button onClick={addAlgorithm}><i className="fas fa-plus"></i> Add Algorithm (Demo)</Button>

                        <h4 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginTop: '24px' }}>Profiles</h4>
                         <table className="data-grid" style={{ marginBottom: '24px' }}>
                            <thead><tr><th>Name</th><th>Algorithm</th><th>Vectorizer</th></tr></thead>
                            <tbody>
                                {indexDef.vectorSearch?.profiles?.map((prof, i) => (
                                    <tr key={i}>
                                        <td>{prof.name}</td>
                                        <td>{prof.algorithmConfigurationName}</td>
                                        <td>{prof.vectorizer || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Button onClick={addProfile}><i className="fas fa-plus"></i> Add Profile (Demo)</Button>
                    </div>
                )}

                {activeTab === 'json' && (
                    <div style={{ flex: 1, padding: '0', overflow: 'auto' }}>
                       <pre style={{ margin: 0, padding: '16px', fontFamily: 'Consolas', fontSize: '13px', color: '#9cdcfe' }}>
                           {JSON.stringify(indexDef, null, 2)}
                       </pre>
                    </div>
                )}

                {/* Stubs for other tabs */}
                {(activeTab === 'suggesters' || activeTab === 'scoring' || activeTab === 'cors') && (
                     <div style={{ padding: '16px', color: '#888' }}>
                         Placeholder for {activeTab} configuration. Uses standard grid layouts similar strictly to Vector Search.
                     </div>
                )}
            </div>
        </div>
    );
};

export default IndexBuilder;
