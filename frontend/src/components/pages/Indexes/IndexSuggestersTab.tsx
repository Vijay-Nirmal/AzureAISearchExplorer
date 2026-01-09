import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import suggesterDescriptions from '../../../data/constants/suggesterPropertyDescriptions.json';
import searchModes from '../../../data/constants/suggesterSearchModes.json';

import type { SearchField, SearchIndex, Suggester, SuggesterSearchMode } from '../../../types/IndexModels';

interface IndexSuggestersTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

const getSearchableFieldNames = (fields: SearchField[] | undefined): string[] => {
    const result: string[] = [];

    const walk = (list: SearchField[], prefix: string) => {
        for (const f of list) {
            const fullName = prefix ? `${prefix}.${f.name}` : f.name;
            if (f.searchable) result.push(fullName);
            if (Array.isArray(f.fields) && f.fields.length > 0) {
                walk(f.fields, fullName);
            }
        }
    };

    if (fields) walk(fields, '');
    return result;
};

export const IndexSuggestersTab: React.FC<IndexSuggestersTabProps> = ({ indexDef, setIndexDef }) => {
    const [suggesterModalOpen, setSuggesterModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempSuggester, setTempSuggester] = useState<Suggester | null>(null);

    const searchableFieldNames = useMemo(() => getSearchableFieldNames(indexDef.fields || []), [indexDef.fields]);

    const searchModeOptions = useMemo(() => {
        const list = searchModes as Array<{ value: string; description?: string }>;
        return list.map(m => ({ value: m.value, label: m.value, description: m.description }));
    }, []);

    const openNewSuggester = () => {
        const existing = indexDef.suggesters || [];
        const draft: Suggester = {
            name: `suggester-${existing.length + 1}`,
            searchMode: 'analyzingInfixMatching',
            sourceFields: []
        };
        setEditingIndex(null);
        setTempSuggester(draft);
        setSuggesterModalOpen(true);
    };

    const openEditSuggester = (idx: number) => {
        const sg = (indexDef.suggesters || [])[idx];
        if (!sg) return;
        setEditingIndex(idx);
        setTempSuggester(structuredClone(sg));
        setSuggesterModalOpen(true);
    };

    const deleteSuggester = (idx: number) => {
        setIndexDef(prev => {
            const list = [...(prev.suggesters || [])];
            list.splice(idx, 1);
            return { ...prev, suggesters: list };
        });
    };

    const saveFromModal = () => {
        if (!tempSuggester) return;

        const normalized: Suggester = {
            name: (tempSuggester.name || '').trim(),
            searchMode: (tempSuggester.searchMode || '').trim() as SuggesterSearchMode,
            sourceFields: (tempSuggester.sourceFields || []).map(s => s.trim()).filter(Boolean)
        };

        if (!normalized.name) return;

        setIndexDef(prev => {
            const list = [...(prev.suggesters || [])];
            if (editingIndex === null) list.push(normalized);
            else list[editingIndex] = normalized;
            return { ...prev, suggesters: list };
        });

        setSuggesterModalOpen(false);
        setTempSuggester(null);
        setEditingIndex(null);
    };

    const renderEditorModal = () => {
        if (!suggesterModalOpen || !tempSuggester) return null;

        const selectedSet = new Set(tempSuggester.sourceFields || []);

        return (
            <Modal
                title={editingIndex === null ? 'Add Suggester' : 'Edit Suggester'}
                isOpen={suggesterModalOpen}
                onClose={() => {
                    setSuggesterModalOpen(false);
                    setTempSuggester(null);
                    setEditingIndex(null);
                }}
                width="760px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={suggesterDescriptions.name} /></Label>
                            <Input
                                value={tempSuggester.name || ''}
                                onChange={e => setTempSuggester({ ...tempSuggester, name: e.target.value })}
                                placeholder="e.g. sg-default"
                            />
                        </div>
                        <div>
                            <Label>Search Mode <InfoIcon tooltip={suggesterDescriptions.searchMode} /></Label>
                            <SelectWithDescription
                                value={tempSuggester.searchMode || ''}
                                onChange={e => setTempSuggester({ ...tempSuggester, searchMode: e.target.value as SuggesterSearchMode })}
                                options={searchModeOptions}
                            />
                        </div>
                    </div>

                    <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 8px' }}>Source Fields</legend>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px', backgroundColor: '#252526', borderRadius: '4px' }}>
                            {searchableFieldNames.length === 0 && (
                                <div style={{ color: '#888', fontSize: '12px' }}>
                                    No searchable fields found. Only fields marked Searchable=true can be used.
                                </div>
                            )}

                            {searchableFieldNames.map(name => (
                                <label key={name} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedSet.has(name)}
                                        onChange={e => {
                                            const set = new Set(tempSuggester.sourceFields || []);
                                            if (e.target.checked) set.add(name);
                                            else set.delete(name);
                                            setTempSuggester({ ...tempSuggester, sourceFields: Array.from(set) });
                                        }}
                                    />
                                    {name}
                                </label>
                            ))}
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
                            <InfoIcon tooltip={suggesterDescriptions.sourceFields} />
                            <span style={{ marginLeft: '6px' }}>Selected: {(tempSuggester.sourceFields || []).length}</span>
                        </div>
                    </fieldset>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFromModal}>Save</Button>
                    <Button onClick={() => {
                        setSuggesterModalOpen(false);
                        setTempSuggester(null);
                        setEditingIndex(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const suggesters = indexDef.suggesters || [];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444' }}>
                <Button onClick={openNewSuggester}><i className="fas fa-plus"></i> Add Suggester</Button>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ccc', borderBottom: '1px solid #444', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Suggesters <InfoIcon tooltip={suggesterDescriptions.suggesters} />
                </h4>

                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={suggesterDescriptions.name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Search Mode <InfoIcon tooltip={suggesterDescriptions.searchMode} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Source Fields <InfoIcon tooltip={suggesterDescriptions.sourceFields} /></th>
                            <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suggesters.map((sg, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '4px' }}>{sg.name}</td>
                                <td style={{ padding: '4px' }}>{sg.searchMode || 'analyzingInfixMatching'}</td>
                                <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>
                                    {(sg.sourceFields || []).length ? (sg.sourceFields || []).join(', ') : '-'}
                                </td>
                                <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                    <Button variant="secondary" onClick={() => openEditSuggester(i)}>Edit</Button>
                                    <Button variant="icon" onClick={() => deleteSuggester(i)}><i className="fas fa-trash"></i></Button>
                                </td>
                            </tr>
                        ))}

                        {suggesters.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                    No suggesters configured
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
