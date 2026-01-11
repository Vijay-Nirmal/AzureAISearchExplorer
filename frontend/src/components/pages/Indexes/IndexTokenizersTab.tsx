import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { JsonViewerModal } from '../../common/JsonViewerModal';
import { JsonEditorModal } from '../../common/JsonEditorModal';

import tokenizerEditorConfig from '../../../data/constants/config/tokenizerEditorConfig.json';

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

interface IndexTokenizersTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type TokenizerDraft = Record<string, unknown>;

const schema = tokenizerEditorConfig as unknown as ConfigDrivenSchema;
const entity = getResolvedEntity(schema);

const getTypeLabel = (odataType: string | undefined): string => {
    const def = getTypeDefinition(schema, odataType);
    return def?.label || odataType || 'Unknown';
};

export const IndexTokenizersTab: React.FC<IndexTokenizersTabProps> = ({ indexDef, setIndexDef }) => {
    const [tokenizerModalOpen, setTokenizerModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempTokenizer, setTempTokenizer] = useState<TokenizerDraft | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
    const [jsonViewerTitle, setJsonViewerTitle] = useState('');
    const [jsonViewerData, setJsonViewerData] = useState<unknown>(null);

    const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
    const [jsonEditorTitle, setJsonEditorTitle] = useState('');
    const [jsonEditorValue, setJsonEditorValue] = useState<unknown>(null);
    const [jsonEditorOnSave, setJsonEditorOnSave] = useState<((next: unknown) => void) | null>(null);

    const tokenizers = useMemo(() => {
        return (indexDef.tokenizers || []) as unknown[];
    }, [indexDef.tokenizers]);

    const openNewTokenizer = () => {
        const existing = (indexDef.tokenizers || []) as unknown[];
        const defaultType = getResolvedTypeDefinitions(schema)[0]?.discriminatorValue || '';
        const baseName = `tokenizer-${existing.length + 1}`;

        const draft = defaultType
            ? applyDefaultsForType(schema, defaultType, { [entity.nameKey]: baseName })
            : ({ [entity.nameKey]: baseName } as Record<string, unknown>);

        setEditingIndex(null);
        setTempTokenizer(draft);
        setValidationErrors({});
        setTokenizerModalOpen(true);
    };

    const openEditTokenizer = (idx: number) => {
        const t = ((indexDef.tokenizers || []) as unknown[])[idx];
        if (!t || typeof t !== 'object') return;
        setEditingIndex(idx);
        setTempTokenizer(structuredClone(t as Record<string, unknown>));
        setValidationErrors({});
        setTokenizerModalOpen(true);
    };

    const deleteTokenizer = (idx: number) => {
        setIndexDef(prev => {
            const list = [...((prev.tokenizers || []) as unknown[])];
            list.splice(idx, 1);
            return { ...prev, tokenizers: list };
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
        if (!tempTokenizer) return;

        const result = normalizeBySchema(schema, tempTokenizer, { preserveUnknown: true });
        if (!result.value) {
            setValidationErrors(result.errors);
            return;
        }

        setIndexDef(prev => {
            const list = [...((prev.tokenizers || []) as unknown[])];
            if (editingIndex === null) list.push(result.value);
            else list[editingIndex] = result.value;
            return { ...prev, tokenizers: list };
        });

        setTokenizerModalOpen(false);
        setTempTokenizer(null);
        setEditingIndex(null);
        setValidationErrors({});
    };

    const renderEditorModal = () => {
        if (!tokenizerModalOpen || !tempTokenizer) return null;

        const discriminatorKey = entity.discriminatorKey;
        const nameKey = entity.nameKey;
        const odataType = String(tempTokenizer[discriminatorKey] || '');
        const typeDef = getTypeDefinition(schema, odataType);

        return (
            <Modal
                title={editingIndex === null ? 'Add Tokenizer' : 'Edit Tokenizer'}
                isOpen={tokenizerModalOpen}
                onClose={() => {
                    setTokenizerModalOpen(false);
                    setTempTokenizer(null);
                    setEditingIndex(null);
                    setValidationErrors({});
                }}
                width="920px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <ConfigDrivenObjectForm schema={schema} value={tempTokenizer} onChange={setTempTokenizer} errors={validationErrors} />

                    {!typeDef && odataType && (
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}>
                            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '8px' }}>
                                This tokenizer type is not supported by the form editor yet. You can still edit it as raw JSON.
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    editJson(
                                        `Edit JSON: ${String(tempTokenizer[nameKey] || '') || '(unnamed tokenizer)'}`,
                                        tempTokenizer,
                                        next => {
                                            if (next && typeof next === 'object') setTempTokenizer(next as Record<string, unknown>);
                                        }
                                    )
                                }
                            >
                                <i className="fas fa-code"></i> Edit JSON
                            </Button>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFromModal}>
                        Save
                    </Button>
                    <Button
                        onClick={() => {
                            setTokenizerModalOpen(false);
                            setTempTokenizer(null);
                            setEditingIndex(null);
                            setValidationErrors({});
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal>
        );
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)' }}>
                <Button onClick={openNewTokenizer}>
                    <i className="fas fa-plus"></i> Add Tokenizer
                </Button>
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
                        {tokenizers.map((t, i) => {
                            const obj = t && typeof t === 'object' ? (t as Record<string, unknown>) : null;
                            const name = obj ? String(obj[entity.nameKey] || '-') : '-';
                            const odataType = obj ? String(obj[entity.discriminatorKey] || '') : '';
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '4px' }}>{name}</td>
                                    <td style={{ padding: '4px' }}>{getTypeLabel(odataType)}</td>
                                    <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.8, fontSize: '12px' }}>{obj ? summarizeBySchema(schema, obj) : '-'}</td>
                                    <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                        <Button variant="secondary" onClick={() => openEditTokenizer(i)} disabled={!obj}>
                                            Edit
                                        </Button>
                                        <Button variant="icon" onClick={() => viewJson(`Tokenizer: ${name || '(unnamed)'}`, t)} title="View JSON">
                                            <i className="fas fa-code"></i>
                                        </Button>
                                        <Button
                                            variant="icon"
                                            onClick={() =>
                                                editJson(`Edit JSON: Tokenizer: ${name || '(unnamed)'}`, t, next => {
                                                    setIndexDef(prev => {
                                                        const list = [...((prev.tokenizers || []) as unknown[])];
                                                        list[i] = next;
                                                        return { ...prev, tokenizers: list };
                                                    });
                                                })
                                            }
                                            title="Edit JSON"
                                        >
                                            <i className="fas fa-pen"></i>
                                        </Button>
                                        <Button variant="icon" onClick={() => deleteTokenizer(i)} title="Delete">
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}

                        {tokenizers.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-color)', opacity: 0.7 }}>
                                    No tokenizers configured
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
                onSave={next => jsonEditorOnSave?.(next)}
            />
        </div>
    );
};
