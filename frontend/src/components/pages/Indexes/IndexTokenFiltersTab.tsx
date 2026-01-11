import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { JsonViewerModal } from '../../common/JsonViewerModal';
import { JsonEditorModal } from '../../common/JsonEditorModal';

import tokenFilterEditorConfig from '../../../data/constants/config/tokenFilterEditorConfig.json';

import type { SearchIndex } from '../../../types/IndexModels';
import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';
import { ConfigDrivenObjectForm } from '../../common/configDriven/ConfigDrivenObjectForm';
import {
    applyDefaultsForType,
    getResolvedEntity,
    getResolvedTypeDefinitions,
    getTypeDefinition,
    normalizeBySchema,
    summarizeBySchema
} from '../../common/configDriven/configDrivenUtils';

interface IndexTokenFiltersTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type TokenFilterDraft = Record<string, unknown>;

const schema = tokenFilterEditorConfig as unknown as ConfigDrivenSchema;
const entity = getResolvedEntity(schema);

const getTypeLabel = (odataType: string | undefined): string => {
    const def = getTypeDefinition(schema, odataType);
    return def?.label || odataType || 'Unknown';
};

export const IndexTokenFiltersTab: React.FC<IndexTokenFiltersTabProps> = ({ indexDef, setIndexDef }) => {
    const [tokenFilterModalOpen, setTokenFilterModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempTokenFilter, setTempTokenFilter] = useState<TokenFilterDraft | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
    const [jsonViewerTitle, setJsonViewerTitle] = useState('');
    const [jsonViewerData, setJsonViewerData] = useState<unknown>(null);

    const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
    const [jsonEditorTitle, setJsonEditorTitle] = useState('');
    const [jsonEditorValue, setJsonEditorValue] = useState<unknown>(null);
    const [jsonEditorOnSave, setJsonEditorOnSave] = useState<((next: unknown) => void) | null>(null);

    const tokenFilters = useMemo(() => {
        return (indexDef.tokenFilters || []) as unknown[];
    }, [indexDef.tokenFilters]);

    const openNewTokenFilter = () => {
        const existing = (indexDef.tokenFilters || []) as unknown[];
        const defaultType = getResolvedTypeDefinitions(schema)[0]?.discriminatorValue || '';
        const baseName = `tokenfilter-${existing.length + 1}`;

        const draft = defaultType
            ? applyDefaultsForType(schema, defaultType, { [entity.nameKey]: baseName })
            : ({ [entity.nameKey]: baseName } as Record<string, unknown>);

        setEditingIndex(null);
        setTempTokenFilter(draft);
        setValidationErrors({});
        setTokenFilterModalOpen(true);
    };

    const openEditTokenFilter = (idx: number) => {
        const tf = ((indexDef.tokenFilters || []) as unknown[])[idx];
        if (!tf || typeof tf !== 'object') return;
        setEditingIndex(idx);
        setTempTokenFilter(structuredClone(tf as Record<string, unknown>));
        setValidationErrors({});
        setTokenFilterModalOpen(true);
    };

    const deleteTokenFilter = (idx: number) => {
        setIndexDef(prev => {
            const list = [...((prev.tokenFilters || []) as unknown[])];
            list.splice(idx, 1);
            return { ...prev, tokenFilters: list };
        });
    };

    const viewJson = (title: string, data: unknown) => {
        setJsonViewerTitle(title);
        setJsonViewerData(data);
        setJsonViewerOpen(true);
    };

    const editJson = (title: string, data: unknown, onSave: (next: unknown) => void) => {
        setJsonEditorTitle(title);
        setJsonEditorValue(data);
        setJsonEditorOnSave(() => onSave);
        setJsonEditorOpen(true);
    };

    const saveFromModal = () => {
        if (!tempTokenFilter) return;

        const result = normalizeBySchema(schema, tempTokenFilter, { preserveUnknown: true });
        if (!result.value) {
            setValidationErrors(result.errors);
            return;
        }

        setIndexDef(prev => {
            const list = [...((prev.tokenFilters || []) as unknown[])];
            if (editingIndex === null) list.push(result.value);
            else list[editingIndex] = result.value;
            return { ...prev, tokenFilters: list };
        });

        setTokenFilterModalOpen(false);
        setTempTokenFilter(null);
        setEditingIndex(null);
        setValidationErrors({});
    };

    const renderEditorModal = () => {
        if (!tokenFilterModalOpen || !tempTokenFilter) return null;

        const discriminatorKey = entity.discriminatorKey;
        const nameKey = entity.nameKey;
        const odataType = String(tempTokenFilter[discriminatorKey] || '');
        const typeDef = getTypeDefinition(schema, odataType);

        return (
            <Modal
                title={editingIndex === null ? 'Add Token Filter' : 'Edit Token Filter'}
                isOpen={tokenFilterModalOpen}
                onClose={() => {
                    setTokenFilterModalOpen(false);
                    setTempTokenFilter(null);
                    setEditingIndex(null);
                    setValidationErrors({});
                }}
                width="920px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <ConfigDrivenObjectForm
                        schema={schema}
                        value={tempTokenFilter}
                        onChange={setTempTokenFilter}
                        errors={validationErrors}
                    />

                    {!typeDef && odataType && (
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}>
                            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '8px' }}>
                                This token filter type is not supported by the form editor yet. You can still edit it as raw JSON.
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => editJson(
                                    `Edit JSON: ${String(tempTokenFilter[nameKey] || '') || '(unnamed token filter)'}`,
                                    tempTokenFilter,
                                    (next) => {
                                        if (next && typeof next === 'object') setTempTokenFilter(next as Record<string, unknown>);
                                    }
                                )}
                            >
                                <i className="fas fa-code"></i> Edit JSON
                            </Button>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFromModal}>Save</Button>
                    <Button onClick={() => {
                        setTokenFilterModalOpen(false);
                        setTempTokenFilter(null);
                        setEditingIndex(null);
                        setValidationErrors({});
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)' }}>
                <Button onClick={openNewTokenFilter}><i className="fas fa-plus"></i> Add Token Filter</Button>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Details</th>
                            <th style={{ width: '220px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tokenFilters.map((tf, i) => {
                            const obj = (tf && typeof tf === 'object') ? (tf as Record<string, unknown>) : null;
                            const name = obj ? String(obj[entity.nameKey] || '-') : '-';
                            const odataType = obj ? String(obj[entity.discriminatorKey] || '') : '';
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '4px' }}>{name}</td>
                                    <td style={{ padding: '4px' }}>{getTypeLabel(odataType)}</td>
                                    <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.8, fontSize: '12px' }}>
                                        {obj ? summarizeBySchema(schema, obj) : '-'}
                                    </td>
                                    <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                        <Button variant="secondary" onClick={() => openEditTokenFilter(i)} disabled={!obj}>Edit</Button>
                                        <Button
                                            variant="icon"
                                            onClick={() => viewJson(`Token Filter: ${name || '(unnamed)'}`, tf)}
                                            title="View JSON"
                                        >
                                            <i className="fas fa-code"></i>
                                        </Button>
                                        <Button
                                            variant="icon"
                                            onClick={() => editJson(
                                                `Edit JSON: Token Filter: ${name || '(unnamed)'}`,
                                                tf,
                                                (next) => {
                                                    setIndexDef(prev => {
                                                        const list = [...((prev.tokenFilters || []) as unknown[])];
                                                        list[i] = next;
                                                        return { ...prev, tokenFilters: list };
                                                    });
                                                }
                                            )}
                                            title="Edit JSON"
                                        >
                                            <i className="fas fa-pen"></i>
                                        </Button>
                                        <Button variant="icon" onClick={() => deleteTokenFilter(i)} title="Delete">
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}

                        {tokenFilters.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-color)', opacity: 0.7 }}>
                                    No token filters configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {renderEditorModal()}

            <JsonViewerModal
                isOpen={jsonViewerOpen}
                onClose={() => {
                    setJsonViewerOpen(false);
                    setJsonViewerTitle('');
                    setJsonViewerData(null);
                }}
                title={jsonViewerTitle}
                data={jsonViewerData}
            />

            <JsonEditorModal
                isOpen={jsonEditorOpen}
                onClose={() => {
                    setJsonEditorOpen(false);
                    setJsonEditorTitle('');
                    setJsonEditorValue(null);
                    setJsonEditorOnSave(null);
                }}
                title={jsonEditorTitle}
                value={jsonEditorValue}
                onSave={(next) => jsonEditorOnSave?.(next)}
            />
        </div>
    );
};
