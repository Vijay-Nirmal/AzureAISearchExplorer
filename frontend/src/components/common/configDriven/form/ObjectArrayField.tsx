import React, { useMemo, useState } from 'react';
import { Button } from '../../Button';
import { InfoIcon } from '../../InfoIcon';
import { JsonEditorModal } from '../../JsonEditorModal';
import { Modal } from '../../Modal';
import { Select } from '../../Select';

import type { ConfigDrivenField, ConfigDrivenSchema } from '../configDrivenTypes';
import {
    applyDefaultsForType,
    getResolvedEntity,
    getResolvedTypeDefinitions,
    getTypeDefinition,
    normalizeBySchema,
    summarizeBySchema
} from '../configDrivenUtils';

type DraftObject = Record<string, unknown>;

const isPlainObject = (v: unknown): v is DraftObject => !!v && typeof v === 'object' && !Array.isArray(v);

const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

const makeBaseName = (entityTitle: string, idx: number) => {
    const base = String(entityTitle || 'item')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return `${base || 'item'}-${idx}`;
};

interface ObjectArrayFieldProps {
    field: ConfigDrivenField;
    nestedSchema: ConfigDrivenSchema;
    arr: unknown[];
    fieldError?: string;

    nestedPresentation: 'inline' | 'accordion';

    isSectionOpen: (key: string) => boolean;
    toggleSection: (key: string) => void;

    openRawJson: (fieldKey: string, title: string) => void;
    setField: (key: string, nextValue: unknown) => void;

    objectArraySelectedIndex: Record<string, number>;
    setObjectArraySelectedIndex: React.Dispatch<React.SetStateAction<Record<string, number>>>;

    renderNestedForm: (props: {
        schema: ConfigDrivenSchema;
        value: DraftObject;
        onChange: (next: DraftObject) => void;
        errors?: Record<string, string>;
    }) => React.ReactNode;
}

export const ObjectArrayField: React.FC<ObjectArrayFieldProps> = ({
    field,
    nestedSchema,
    arr,
    fieldError,
    nestedPresentation,
    isSectionOpen,
    toggleSection,
    openRawJson,
    setField,
    objectArraySelectedIndex,
    setObjectArraySelectedIndex,
    renderNestedForm
}) => {
    const isAccordionMode = nestedPresentation === 'accordion';

    const entity = useMemo(() => getResolvedEntity(nestedSchema), [nestedSchema]);
    const nestedTypes = useMemo(() => getResolvedTypeDefinitions(nestedSchema), [nestedSchema]);

    const rawArr = useMemo(() => (Array.isArray(arr) ? arr : []), [arr]);

    const getItemObject = (idx: number): DraftObject => {
        const rawItem = rawArr[idx];
        return rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem) ? (rawItem as DraftObject) : {};
    };

    const defaultType = nestedTypes[0]?.discriminatorValue || '';

    const createNewItem = (): DraftObject => {
        if (!defaultType) return { [entity.nameKey]: makeBaseName(entity.title, rawArr.length + 1) };
        const baseName = makeBaseName(entity.title, rawArr.length + 1);
        return applyDefaultsForType(nestedSchema, defaultType, { [entity.nameKey]: baseName });
    };

    const addItem = () => {
        const initial = createNewItem();
        const nextArr = [...rawArr, initial];
        setField(field.key, nextArr);
        setObjectArraySelectedIndex(prev => ({ ...prev, [field.key]: nextArr.length - 1 }));
    };

    const clearAll = () => {
        setField(field.key, []);
        setObjectArraySelectedIndex(prev => {
            const next = { ...prev };
            delete next[field.key];
            return next;
        });
    };

    // Table + Modal editor presentation (IndexTokenFiltersTab-like)
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempItem, setTempItem] = useState<DraftObject | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
    const [jsonEditorTitle, setJsonEditorTitle] = useState('');
    const [jsonEditorValue, setJsonEditorValue] = useState<unknown>(null);
    const [jsonEditorOnSave, setJsonEditorOnSave] = useState<((next: unknown) => void) | null>(null);

    const openNew = () => {
        const draft = createNewItem();
        setEditingIndex(null);
        setTempItem(draft);
        setValidationErrors({});
        setEditorOpen(true);
    };

    const openEdit = (idx: number) => {
        const item = rawArr[idx];
        setEditingIndex(idx);
        setTempItem(isPlainObject(item) ? structuredClone(item) : {});
        setValidationErrors({});
        setEditorOpen(true);
    };

    const deleteItem = (idx: number) => {
        const next = [...rawArr];
        next.splice(idx, 1);
        setField(field.key, next);
    };

    const editJson = (title: string, data: unknown, onSave: (next: unknown) => void) => {
        setJsonEditorTitle(title);
        setJsonEditorValue(data);
        setJsonEditorOnSave(() => onSave);
        setJsonEditorOpen(true);
    };

    const saveFromModal = () => {
        if (!tempItem) return;

        const result = normalizeBySchema(nestedSchema, tempItem, { preserveUnknown: true });
        if (!result.value) {
            setValidationErrors(result.errors);
            return;
        }

        const next = [...rawArr];
        if (editingIndex === null) next.push(result.value);
        else next[editingIndex] = result.value;

        setField(field.key, next);
        setEditorOpen(false);
        setEditingIndex(null);
        setTempItem(null);
        setValidationErrors({});
    };

    const renderTablePresentation = () => {
        const label = (
            <>
                {field.label} {field.tooltip ? <InfoIcon tooltip={field.tooltip} /> : null}
            </>
        );

        const editorModal = (() => {
            if (!editorOpen || !tempItem) return null;
            const name = String(tempItem[entity.nameKey] || '') || '(unnamed)';
            const title = editingIndex === null ? `Add ${entity.title}` : `Edit ${entity.title}: ${name}`;

            return (
                <Modal
                    title={title}
                    isOpen={editorOpen}
                    onClose={() => {
                        setEditorOpen(false);
                        setEditingIndex(null);
                        setTempItem(null);
                        setValidationErrors({});
                    }}
                    width="980px"
                    footer={(
                        <>
                            <Button variant="primary" onClick={saveFromModal}>Save</Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setEditorOpen(false);
                                    setEditingIndex(null);
                                    setTempItem(null);
                                    setValidationErrors({});
                                }}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                >
                    {renderNestedForm({ schema: nestedSchema, value: tempItem, onChange: setTempItem, errors: validationErrors })}

                    {Object.keys(validationErrors).length > 0 && (
                        <div style={{ marginTop: '12px', color: 'var(--status-error-text)', fontSize: '12px' }}>
                            Please fix the highlighted fields.
                        </div>
                    )}
                </Modal>
            );
        })();

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.85 }}>{label}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Button variant="icon" onClick={() => openRawJson(field.key, `${field.label} (JSON)`)} title="Edit JSON">
                            <i className="fas fa-code"></i>
                        </Button>
                        <Button onClick={openNew}>
                            <i className="fas fa-plus"></i> Add
                        </Button>
                        {rawArr.length > 0 && (
                            <Button variant="secondary" onClick={clearAll}>
                                <i className="fas fa-trash"></i> Clear
                            </Button>
                        )}
                    </div>
                </div>

                <div style={{ color: 'var(--text-color)', opacity: 0.75, fontSize: '12px' }}>
                    Count: <span style={{ color: 'var(--text-color)' }}>{rawArr.length}</span>
                </div>

                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Details</th>
                            <th style={{ width: '160px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rawArr.map((rawItem, idx) => {
                            const item = isPlainObject(rawItem) ? rawItem : null;

                            const name = item ? (String(item[entity.nameKey] || '-') || '-') : '(invalid item)';
                            const typeVal = item ? String(item[entity.discriminatorKey] || '') : '';
                            const typeLabel = item ? (getTypeDefinition(nestedSchema, typeVal)?.label || typeVal || 'Unknown') : '-';
                            const summary = item ? summarizeBySchema(nestedSchema, item) : '';

                            return (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '4px' }}>{name}</td>
                                    <td style={{ padding: '4px' }}>{typeLabel}</td>
                                    <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.8, fontSize: '12px' }}>{summary}</td>
                                    <td style={{ display: 'flex', gap: '8px', padding: '4px', flexWrap: 'wrap' }}>
                                        <Button
                                            variant="icon"
                                            onClick={() => openEdit(idx)}
                                            title="Edit"
                                        >
                                            <i className="fas fa-pen"></i>
                                        </Button>
                                        <Button
                                            variant="icon"
                                            onClick={() =>
                                                editJson(`Edit JSON: ${entity.title}: ${name}`, rawItem, (next) => {
                                                    if (!isPlainObject(next)) return;
                                                    const nextList = [...rawArr];
                                                    nextList[idx] = next;
                                                    setField(field.key, nextList);
                                                })
                                            }
                                            title="Edit JSON"
                                        >
                                            <i className="fas fa-code"></i>
                                        </Button>
                                        <Button variant="icon" onClick={() => deleteItem(idx)} title="Delete">
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}

                        {rawArr.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-color)', opacity: 0.7 }}>
                                    No items configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {editorModal}

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

                {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px' }}>{fieldError}</div>}
            </div>
        );
    };

    if (field.presentation === 'table') {
        if (!isAccordionMode) return renderTablePresentation();

        const open = isSectionOpen(field.key);
        return (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggleSection(field.key)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSection(field.key);
                        }
                    }}
                    style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'var(--sidebar-bg)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        color: 'var(--text-color)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <i className={`fas ${open ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{field.label}</span>
                        {field.tooltip ? <InfoIcon tooltip={field.tooltip} /> : null}
                        <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.75 }}>Items: {rawArr.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Button
                            variant="icon"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openRawJson(field.key, `${field.label} (JSON)`);
                            }}
                            title="Edit raw JSON"
                        >
                            <i className="fas fa-code"></i>
                        </Button>
                        {!open && (
                            <Button
                                variant="secondary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openNew();
                                }}
                            >
                                <i className="fas fa-plus"></i> Add
                            </Button>
                        )}
                    </div>
                </div>

                {open && <div style={{ padding: '12px' }}>{renderTablePresentation()}</div>}
            </div>
        );
    }

    // Default editor presentation (existing accordion/inline in-place editor)
    const selectedRaw = objectArraySelectedIndex[field.key] ?? 0;
    const selectedIndex = rawArr.length === 0 ? 0 : Math.min(Math.max(0, selectedRaw), rawArr.length - 1);
    const selectedItem = getItemObject(selectedIndex);

    const removeSelectedItem = () => {
        if (rawArr.length === 0) return;
        const nextArr = rawArr.filter((_, idx) => idx !== selectedIndex);
        setField(field.key, nextArr);
        setObjectArraySelectedIndex(prev => {
            const next = { ...prev };
            if (nextArr.length === 0) {
                delete next[field.key];
                return next;
            }
            next[field.key] = Math.min(selectedIndex, nextArr.length - 1);
            return next;
        });
    };

    const moveSelectedItem = (direction: -1 | 1) => {
        if (rawArr.length <= 1) return;
        const from = selectedIndex;
        const to = from + direction;
        if (to < 0 || to >= rawArr.length) return;

        const nextArr = moveItem(rawArr, from, to);
        setField(field.key, nextArr);
        setObjectArraySelectedIndex(prev => ({ ...prev, [field.key]: to }));
    };

    if (isAccordionMode) {
        const open = isSectionOpen(field.key);
        const summary = rawArr.length > 0 ? summarizeBySchema(nestedSchema, selectedItem) : '';

        return (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggleSection(field.key)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSection(field.key);
                        }
                    }}
                    style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'var(--sidebar-bg)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        color: 'var(--text-color)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <i className={`fas ${open ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{field.label}</span>
                        {field.tooltip ? <InfoIcon tooltip={field.tooltip} /> : null}
                        <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.75 }}>Items: {rawArr.length}</span>
                        {summary && (
                            <span
                                style={{
                                    marginLeft: '8px',
                                    fontSize: '12px',
                                    opacity: 0.75,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {summary}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Button
                            variant="icon"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openRawJson(field.key, `${field.label} (JSON)`);
                            }}
                            title="Edit JSON"
                        >
                            <i className="fas fa-code"></i>
                        </Button>
                        {!open && (
                            <Button
                                variant="secondary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addItem();
                                    setTimeout(() => toggleSection(field.key), 0);
                                }}
                            >
                                <i className="fas fa-plus"></i> Add item
                            </Button>
                        )}
                        {rawArr.length > 0 && (
                            <Button
                                variant="secondary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    clearAll();
                                }}
                            >
                                <i className="fas fa-trash"></i> Clear
                            </Button>
                        )}
                    </div>
                </div>

                {open && (
                    <div style={{ padding: '12px' }}>
                        {rawArr.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.7 }}>No items yet.</div>
                                <Button variant="secondary" onClick={addItem} title="Add item">
                                    <i className="fas fa-plus"></i> Add item
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                        flexWrap: 'wrap',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.75 }}>Editing item</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {rawArr.length > 1 && (
                                            <Select
                                                value={String(selectedIndex)}
                                                onChange={(e) => {
                                                    const nextIdx = Number(e.target.value);
                                                    setObjectArraySelectedIndex(prev => ({
                                                        ...prev,
                                                        [field.key]: Number.isFinite(nextIdx) ? nextIdx : 0
                                                    }));
                                                }}
                                            >
                                                {rawArr.map((_, idx) => {
                                                    const itemObj = getItemObject(idx);
                                                    const itemSummary = summarizeBySchema(nestedSchema, itemObj);
                                                    return (
                                                        <option key={idx} value={idx}>
                                                            {idx + 1}: {itemSummary}
                                                        </option>
                                                    );
                                                })}
                                            </Select>
                                        )}

                                        {rawArr.length > 1 && (
                                            <>
                                                <Button
                                                    variant="icon"
                                                    onClick={() => moveSelectedItem(-1)}
                                                    title="Move up"
                                                    disabled={selectedIndex <= 0}
                                                >
                                                    <i className="fas fa-arrow-up"></i>
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    onClick={() => moveSelectedItem(1)}
                                                    title="Move down"
                                                    disabled={selectedIndex >= rawArr.length - 1}
                                                >
                                                    <i className="fas fa-arrow-down"></i>
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="secondary"
                                            onClick={removeSelectedItem}
                                            title="Remove selected item"
                                            disabled={rawArr.length === 0}
                                        >
                                            <i className="fas fa-trash"></i> Remove item
                                        </Button>
                                        <Button variant="secondary" onClick={addItem} title="Add item">
                                            <i className="fas fa-plus"></i> Add item
                                        </Button>
                                    </div>
                                </div>

                                {renderNestedForm({
                                    schema: nestedSchema,
                                    value: selectedItem,
                                    onChange: (next) => {
                                        const nextArr = [...rawArr];
                                        if (nextArr.length === 0) nextArr.push(next);
                                        else nextArr[selectedIndex] = next;
                                        setField(field.key, nextArr);
                                    }
                                })}
                            </>
                        )}

                        {fieldError && (
                            <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '8px' }}>{fieldError}</div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Inline (non-accordion) objectArray editor
    const label = (
        <>
            {field.label} {field.tooltip ? <InfoIcon tooltip={field.tooltip} /> : null}
        </>
    );

    return (
        <fieldset style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
            <legend style={{ padding: '0 6px', fontSize: '12px', color: 'var(--text-color)' }}>{label}</legend>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '10px'
                }}
            >
                <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.7 }}>Items: {rawArr.length}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button variant="icon" onClick={() => openRawJson(field.key, `${field.label} (JSON)`)} title="Edit JSON">
                        <i className="fas fa-code"></i>
                    </Button>
                    <Button variant="secondary" onClick={addItem}>
                        <i className="fas fa-plus"></i> Add item
                    </Button>
                    {rawArr.length > 0 && (
                        <Button variant="secondary" onClick={clearAll}>
                            <i className="fas fa-trash"></i> Clear
                        </Button>
                    )}
                </div>
            </div>

            {rawArr.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.7 }}>No items yet.</div>
            ) : (
                <>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flexWrap: 'wrap',
                            marginBottom: '12px'
                        }}
                    >
                        <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.75 }}>Editing item</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {rawArr.length > 1 && (
                                <Select
                                    value={String(selectedIndex)}
                                    onChange={(e) => {
                                        const nextIdx = Number(e.target.value);
                                        setObjectArraySelectedIndex(prev => ({
                                            ...prev,
                                            [field.key]: Number.isFinite(nextIdx) ? nextIdx : 0
                                        }));
                                    }}
                                >
                                    {rawArr.map((_, idx) => {
                                        const itemObj = getItemObject(idx);
                                        const itemSummary = summarizeBySchema(nestedSchema, itemObj);
                                        return (
                                            <option key={idx} value={idx}>
                                                {idx + 1}: {itemSummary}
                                            </option>
                                        );
                                    })}
                                </Select>
                            )}

                            {rawArr.length > 1 && (
                                <>
                                    <Button
                                        variant="icon"
                                        onClick={() => moveSelectedItem(-1)}
                                        title="Move up"
                                        disabled={selectedIndex <= 0}
                                    >
                                        <i className="fas fa-arrow-up"></i>
                                    </Button>
                                    <Button
                                        variant="icon"
                                        onClick={() => moveSelectedItem(1)}
                                        title="Move down"
                                        disabled={selectedIndex >= rawArr.length - 1}
                                    >
                                        <i className="fas fa-arrow-down"></i>
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="secondary"
                                onClick={removeSelectedItem}
                                title="Remove selected item"
                                disabled={rawArr.length === 0}
                            >
                                <i className="fas fa-trash"></i> Remove item
                            </Button>
                        </div>
                    </div>

                    {renderNestedForm({
                        schema: nestedSchema,
                        value: selectedItem,
                        onChange: (next) => {
                            const nextArr = [...rawArr];
                            if (nextArr.length === 0) nextArr.push(next);
                            else nextArr[selectedIndex] = next;
                            setField(field.key, nextArr);
                        }
                    })}
                </>
            )}

            {fieldError && <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{fieldError}</div>}
        </fieldset>
    );
};
