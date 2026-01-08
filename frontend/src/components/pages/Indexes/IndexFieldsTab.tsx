import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import dataTypes from '../../../data/constants/dataTypes.json';
import analyzers from '../../../data/constants/lexicalAnalyzer.json';
import normalizers from '../../../data/constants/lexicalNormalizer.json';
import fieldDescriptions from '../../../data/constants/fieldPropertyDescriptions.json';
import vectorEncodings from '../../../data/constants/vectorEncodingFormat.json';

import type { SearchField, SearchIndex } from '../../../types/IndexModels';

// Helpers for nested field editing
const getFieldByPath = (root: SearchField, path: (string | number)[]): SearchField | undefined => {
    let current: SearchField | SearchField[] | undefined = root;

    for (let i = 0; i < path.length; i++) {
        const segment = path[i];
        if (segment === 'fields') {
            if (Array.isArray(current)) return undefined;
            current = current?.fields;
            continue;
        }

        if (typeof segment === 'number') {
            if (!Array.isArray(current)) return undefined;
            current = current[segment];
            continue;
        }

        // Unexpected segment type/value for our editor path
        return undefined;
    }

    return Array.isArray(current) ? undefined : current;
};

const setFieldByPath = (root: SearchField, path: (string | number)[], value: SearchField): SearchField => {
    if (path.length === 0) return value;

    const newRoot: SearchField = structuredClone(root);
    let container: SearchField = newRoot;

    // Path structure is always: ['fields', number, 'fields', number, ...]
    for (let i = 0; i < path.length - 2; i += 2) {
        const key = path[i];
        const index = path[i + 1];
        if (key !== 'fields' || typeof index !== 'number') return newRoot;

        if (!container.fields) container.fields = [];
        const next = container.fields[index];
        if (!next) return newRoot;
        container = next;
    }

    const lastKey = path[path.length - 2];
    const lastIndex = path[path.length - 1];
    if (lastKey !== 'fields' || typeof lastIndex !== 'number') return newRoot;

    if (!container.fields) container.fields = [];
    container.fields[lastIndex] = value;

    return newRoot;
};

interface IndexFieldsTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

export const IndexFieldsTab: React.FC<IndexFieldsTabProps> = ({ indexDef, setIndexDef }) => {
    // Field Editor State
    const [fieldModalOpen, setFieldModalOpen] = useState(false);
    const [currentRootIdx, setCurrentRootIdx] = useState<number | null>(null);
    const [tempRootField, setTempRootField] = useState<SearchField | null>(null);
    const [editorPath, setEditorPath] = useState<(string | number)[]>([]);

    const addField = () => {
        setIndexDef(prev => ({
            ...prev,
            fields: [...(prev.fields || []), { name: 'newField', type: 'Edm.String' }]
        }));
    };

    const updateField = (idx: number, updates: Partial<SearchField>) => {
        setIndexDef(prev => {
            const newFields = [...(prev.fields || [])];
            newFields[idx] = { ...newFields[idx], ...updates };
            return { ...prev, fields: newFields };
        });
    };

    const removeField = (idx: number) => {
        setIndexDef(prev => {
            const newFields = [...(prev.fields || [])];
            newFields.splice(idx, 1);
            return { ...prev, fields: newFields };
        });
    };

    const openFieldEditor = (idx: number) => {
        setCurrentRootIdx(idx);
        setTempRootField(JSON.parse(JSON.stringify(indexDef.fields[idx])));
        setEditorPath([]);
        setFieldModalOpen(true);
    };

    const saveCurrentField = () => {
        if (currentRootIdx !== null && tempRootField) {
            updateField(currentRootIdx, tempRootField);
            setFieldModalOpen(false);
        }
    };

    const dataTypeOptions = useMemo(() => {
        return dataTypes.map(t => ({
            value: t.value,
            label: t.value,
            description: t.description
        }));
    }, []);

    const analyzerOptions = useMemo(() => {
        const list = analyzers as Array<{ value: string; description?: string }>;
        return list.map(a => ({ value: a.value, label: a.value, description: a.description }));
    }, []);

    const normalizerOptions = useMemo(() => {
        const list = normalizers as Array<{ value: string; description?: string }>;
        return list.map(n => ({ value: n.value, label: n.value, description: n.description }));
    }, []);

    const vectorEncodingOptions = useMemo(() => {
        const list = vectorEncodings as Array<{ value: string; description?: string }>;
        return list.map(v => ({ value: v.value, label: v.value, description: v.description }));
    }, []);

    const renderFieldEditorModal = () => {
        if (!tempRootField) return null;

        const currentField = getFieldByPath(tempRootField, editorPath);
        if (!currentField) return null;

        const isVector = currentField.type.includes('Single') || currentField.type.includes('Half');
        const isComplex = currentField.type.includes('ComplexType') || currentField.type.includes('Collection(Edm.ComplexType)');

        const updateCurrent = (newVal: SearchField) => {
            setTempRootField(setFieldByPath(tempRootField, editorPath, newVal));
        };

        const navigateToSubField = (idx: number) => {
            setEditorPath([...editorPath, 'fields', idx]);
        };

        const navigateUp = () => {
            if (editorPath.length === 0) return;
            const newPath = [...editorPath];
            newPath.pop();
            newPath.pop();
            setEditorPath(newPath);
        };

        return (
            <Modal title="Edit Field" isOpen={fieldModalOpen} onClose={() => setFieldModalOpen(false)} width="900px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {/* Breadcrumbs */}
                    {editorPath.length > 0 && (
                        <div style={{ padding: '8px', backgroundColor: '#333', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                            <Button variant="secondary" onClick={() => setEditorPath([])} style={{ padding: '2px 8px', fontSize: '12px' }}>Root</Button>
                            {editorPath.map((p, i) => {
                                if (typeof p === 'number' && i > 0 && editorPath[i - 1] === 'fields') {
                                    const pathSoFar = editorPath.slice(0, i + 1);
                                    const f = getFieldByPath(tempRootField, pathSoFar);
                                    return (
                                        <React.Fragment key={i}>
                                            <span> &gt; </span>
                                            <span style={{ fontWeight: i === editorPath.length - 1 ? 'bold' : 'normal', color: i === editorPath.length - 1 ? 'white' : '#aaa' }}>
                                                {f?.name || `[${p}]`}
                                            </span>
                                        </React.Fragment>
                                    );
                                }
                                return null;
                            })}
                            <div style={{ flex: 1 }} />
                            <Button variant="secondary" onClick={navigateUp}>Back</Button>
                        </div>
                    )}

                    {/* General Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={fieldDescriptions.name} /></Label>
                            <Input value={currentField.name} onChange={e => updateCurrent({ ...currentField, name: e.target.value })} />
                        </div>
                        <div>
                            <Label>Type <InfoIcon tooltip={fieldDescriptions.type} /></Label>
                            <SelectWithDescription
                                value={currentField.type}
                                onChange={e => updateCurrent({ ...currentField, type: e.target.value })}
                                options={dataTypeOptions}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px', backgroundColor: '#252526', borderRadius: '4px' }}>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Uniquely identifies documents">
                            <input type="checkbox" checked={currentField.key || false} onChange={e => updateCurrent({ ...currentField, key: e.target.checked })} />
                            Key <InfoIcon tooltip={fieldDescriptions.key} />
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Full-text searchable">
                            <input type="checkbox" checked={currentField.searchable || false} onChange={e => updateCurrent({ ...currentField, searchable: e.target.checked })} />
                            Searchable <InfoIcon tooltip={fieldDescriptions.searchable} />
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Enable $filter">
                            <input type="checkbox" checked={currentField.filterable || false} onChange={e => updateCurrent({ ...currentField, filterable: e.target.checked })} />
                            Filterable <InfoIcon tooltip={fieldDescriptions.filterable} />
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Enable $orderby">
                            <input type="checkbox" checked={currentField.sortable || false} onChange={e => updateCurrent({ ...currentField, sortable: e.target.checked })} />
                            Sortable <InfoIcon tooltip={fieldDescriptions.sortable} />
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Enable faceting">
                            <input type="checkbox" checked={currentField.facetable || false} onChange={e => updateCurrent({ ...currentField, facetable: e.target.checked })} />
                            Facetable <InfoIcon tooltip={fieldDescriptions.facetable} />
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Retrieve in results">
                            <input type="checkbox" checked={currentField.retrievable !== false} onChange={e => updateCurrent({ ...currentField, retrievable: e.target.checked })} />
                            Retrievable <InfoIcon tooltip={fieldDescriptions.retrievable} />
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Store separately (Vectors)">
                            <input type="checkbox" checked={currentField.stored !== false} onChange={e => updateCurrent({ ...currentField, stored: e.target.checked })} />
                            Stored <InfoIcon tooltip={fieldDescriptions.stored} />
                        </label>
                    </div>

                    {/* Analysis Section (for Searchable fields) */}
                    {(currentField.searchable || currentField.filterable) && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Analysis</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Analyzer (Override) <InfoIcon tooltip={fieldDescriptions.analyzer} /></Label>
                                    <SelectWithDescription
                                        value={currentField.analyzer || ''}
                                        onChange={e => updateCurrent({ ...currentField, analyzer: e.target.value || undefined })}
                                        options={[{ value: '', label: '(Default)' }, ...analyzerOptions]}
                                    />
                                </div>
                                <div>
                                    <Label>Normalizer <InfoIcon tooltip={fieldDescriptions.normalizer} /></Label>
                                    <SelectWithDescription
                                        value={currentField.normalizer || ''}
                                        onChange={e => updateCurrent({ ...currentField, normalizer: e.target.value || undefined })}
                                        options={[{ value: '', label: '(None)' }, ...normalizerOptions]}
                                    />
                                </div>
                                <div>
                                    <Label>Index Analyzer <InfoIcon tooltip={fieldDescriptions.indexAnalyzer} /></Label>
                                    <SelectWithDescription
                                        value={currentField.indexAnalyzer || ''}
                                        onChange={e => updateCurrent({ ...currentField, indexAnalyzer: e.target.value || undefined })}
                                        options={[{ value: '', label: '(Default)' }, ...analyzerOptions]}
                                    />
                                </div>
                                <div>
                                    <Label>Search Analyzer <InfoIcon tooltip={fieldDescriptions.searchAnalyzer} /></Label>
                                    <SelectWithDescription
                                        value={currentField.searchAnalyzer || ''}
                                        onChange={e => updateCurrent({ ...currentField, searchAnalyzer: e.target.value || undefined })}
                                        options={[{ value: '', label: '(Default)' }, ...analyzerOptions]}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <Label>Synonym Maps <InfoIcon tooltip={fieldDescriptions.synonymMaps} /></Label>
                                <Input
                                    value={currentField.synonymMaps?.join(', ') || ''}
                                    onChange={e => updateCurrent({ ...currentField, synonymMaps: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined })}
                                    placeholder="map1, map2"
                                />
                            </div>
                        </fieldset>
                    )}

                    {/* Vector Section */}
                    {isVector && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Vector Search</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Dimensions <InfoIcon tooltip={fieldDescriptions.dimensions} /></Label>
                                    <Input type="number" value={currentField.dimensions || currentField.vectorSearchDimensions} onChange={e => updateCurrent({ ...currentField, dimensions: parseInt(e.target.value), vectorSearchDimensions: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <Label>Profile <InfoIcon tooltip={fieldDescriptions.vectorSearchProfile} /></Label>
                                    <SelectWithDescription
                                        value={currentField.vectorSearchProfile || currentField.vectorSearchProfileName || ''}
                                        onChange={e => updateCurrent({ ...currentField, vectorSearchProfile: e.target.value, vectorSearchProfileName: e.target.value })}
                                        options={[
                                            { value: '', label: '(Select Profile)' },
                                            ...((indexDef.vectorSearch?.profiles || []).map(p => ({ value: p.name, label: p.name })))
                                        ]}
                                    />
                                </div>
                                <div>
                                    <Label>Encoding <InfoIcon tooltip={fieldDescriptions.vectorEncoding} /></Label>
                                    <SelectWithDescription
                                        value={currentField.vectorEncoding || ''}
                                        onChange={e => updateCurrent({
                                            ...currentField,
                                            vectorEncoding: e.target.value || undefined
                                        })}
                                        options={[
                                            { value: '', label: '(Not Set)' },
                                            ...vectorEncodingOptions
                                        ]}
                                    />
                                </div>
                            </div>
                        </fieldset>
                    )}

                    {/* Sub-Fields Section for Complex Types */}
                    {isComplex && (
                        <div style={{ marginTop: '24px', borderTop: '1px solid #444', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0 }}>Sub-Fields <InfoIcon tooltip={fieldDescriptions.fields} /></h4>
                                <Button onClick={() => {
                                    const newFields = [...(currentField.fields || []), { name: 'newSubField', type: 'Edm.String' }];
                                    updateCurrent({ ...currentField, fields: newFields });
                                }}><i className="fas fa-plus"></i> Add Sub-Field</Button>
                            </div>

                            <table className="data-grid" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Properties</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(currentField.fields || []).map((sf, idx) => (
                                        <tr key={idx}>
                                            <td>{sf.name}</td>
                                            <td>{sf.type}</td>
                                            <td style={{ fontSize: '12px', color: '#aaa' }}>
                                                {[
                                                    sf.key ? 'Key' : null,
                                                    sf.searchable ? 'Searchable' : null,
                                                    sf.filterable ? 'Filterable' : null,
                                                    sf.facetable ? 'Facetable' : null,
                                                    sf.sortable ? 'Sortable' : null
                                                ].filter(x => x).join(', ')}
                                            </td>
                                            <td style={{ display: 'flex', gap: '8px' }}>
                                                <Button variant="secondary" onClick={() => navigateToSubField(idx)}>Edit</Button>
                                                <Button variant="icon" onClick={() => {
                                                    const newFields = [...(currentField.fields || [])];
                                                    newFields.splice(idx, 1);
                                                    updateCurrent({ ...currentField, fields: newFields });
                                                }}><i className="fas fa-trash"></i></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(currentField.fields || []).length === 0 && (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No sub-fields defined</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveCurrentField}>Update Root Field</Button>
                    <Button onClick={() => setFieldModalOpen(false)}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444' }}>
                <Button onClick={addField}><i className="fas fa-plus"></i> Add Field</Button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                <table className="data-grid" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2d2d2d', zIndex: 1 }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={fieldDescriptions.name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Type <InfoIcon tooltip={fieldDescriptions.type} /></th>
                            <th style={{ width: '40px', textAlign: 'center' }} title="Key">Key <InfoIcon tooltip={fieldDescriptions.key} /></th>
                            <th style={{ width: '40px', textAlign: 'center' }} title="Searchable">Search <InfoIcon tooltip={fieldDescriptions.searchable} /></th>
                            <th style={{ width: '40px', textAlign: 'center' }} title="Filterable">Filter <InfoIcon tooltip={fieldDescriptions.filterable} /></th>
                            <th style={{ width: '40px', textAlign: 'center' }} title="Sortable">Sort <InfoIcon tooltip={fieldDescriptions.sortable} /></th>
                            <th style={{ width: '40px', textAlign: 'center' }} title="Facetable">Facet <InfoIcon tooltip={fieldDescriptions.facetable} /></th>
                            <th style={{ width: '40px', textAlign: 'center' }} title="Retrievable">Retrv <InfoIcon tooltip={fieldDescriptions.retrievable} /></th>
                            <th style={{ width: '100px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(indexDef.fields || []).map((f, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '4px' }}>{f.name}</td>
                                <td style={{ padding: '4px' }}>{f.type}</td>
                                <td style={{ textAlign: 'center' }}>{f.key && <i className="fas fa-check" style={{ color: 'var(--accent-color)' }} />}</td>
                                <td style={{ textAlign: 'center' }}>{f.searchable && <i className="fas fa-check" />}</td>
                                <td style={{ textAlign: 'center' }}>{f.filterable && <i className="fas fa-check" />}</td>
                                <td style={{ textAlign: 'center' }}>{f.sortable && <i className="fas fa-check" />}</td>
                                <td style={{ textAlign: 'center' }}>{f.facetable && <i className="fas fa-check" />}</td>
                                <td style={{ textAlign: 'center' }}>{f.retrievable !== false && <i className="fas fa-check" />}</td>
                                <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                    <Button variant="secondary" onClick={() => openFieldEditor(i)}>Edit</Button>
                                    <Button variant="icon" onClick={() => removeField(i)}><i className="fas fa-trash"></i></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {fieldModalOpen && renderFieldEditorModal()}
        </div>
    );
};
