import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription, type SelectOption } from '../../common/SelectWithDescription';

import semanticDescriptions from '../../../data/constants/semanticPropertyDescriptions.json';
import rankingOrders from '../../../data/constants/semanticRankingOrders.json';

import styles from './IndexSemanticTab.module.css';

import type {
    PrioritizedFields,
    SearchField,
    SearchIndex,
    SemanticConfiguration,
    SemanticSettings
} from '../../../types/IndexModels';

interface IndexSemanticTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type SemanticConfigDraft = SemanticConfiguration & {
    prioritizedFields?: PrioritizedFields;
};

const EMPTY_CONFIGS: SemanticConfiguration[] = [];

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

const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
    if (from === to) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

const normalizeFieldList = (items: Array<{ fieldName: string }> | undefined): Array<{ fieldName: string }> => {
    const seen = new Set<string>();
    const next: Array<{ fieldName: string }> = [];
    for (const it of items || []) {
        const fieldName = String(it?.fieldName || '').trim();
        if (!fieldName) continue;
        if (seen.has(fieldName)) continue;
        seen.add(fieldName);
        next.push({ fieldName });
    }
    return next;
};

const hasAnyPrioritizedField = (pf: PrioritizedFields | undefined): boolean => {
    const title = String(pf?.titleField?.fieldName || '').trim();
    const contentCount = (pf?.prioritizedContentFields || []).filter(f => String(f?.fieldName || '').trim()).length;
    const keywordCount = (pf?.prioritizedKeywordsFields || []).filter(f => String(f?.fieldName || '').trim()).length;
    return !!title || contentCount > 0 || keywordCount > 0;
};

export const IndexSemanticTab: React.FC<IndexSemanticTabProps> = ({ indexDef, setIndexDef }) => {
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempConfig, setTempConfig] = useState<SemanticConfigDraft | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);

    const [contentAddValue, setContentAddValue] = useState<string>('');
    const [keywordAddValue, setKeywordAddValue] = useState<string>('');

    const searchableFieldNames = useMemo(() => getSearchableFieldNames(indexDef.fields || []), [indexDef.fields]);

    const rankingOrderOptions = useMemo(() => {
        return (rankingOrders as Array<{ value: string; description?: string }>).map(r => ({
            value: r.value,
            label: r.value,
            description: r.description
        }));
    }, []);

    const semantic = indexDef.semantic;
    const configurations = semantic?.configurations ?? EMPTY_CONFIGS;

    const ensureSemanticExists = (): SemanticSettings => {
        const existing = indexDef.semantic;
        if (existing) return existing;
        const created: SemanticSettings = { configurations: [], defaultConfiguration: undefined };
        setIndexDef(prev => ({ ...prev, semantic: prev.semantic || created }));
        return created;
    };

    const openNewConfig = () => {
        const current = ensureSemanticExists();
        const existing = current.configurations || [];
        const draft: SemanticConfigDraft = {
            name: `semantic-${existing.length + 1}`,
            rankingOrder: 'BoostedRerankerScore',
            prioritizedFields: {
                prioritizedContentFields: [],
                prioritizedKeywordsFields: []
            }
        };
        setEditingIndex(null);
        setTempConfig(draft);
        setErrorText(null);
        setContentAddValue('');
        setKeywordAddValue('');
        setConfigModalOpen(true);
    };

    const openEditConfig = (idx: number) => {
        const cfg = configurations[idx];
        if (!cfg) return;
        setEditingIndex(idx);
        setTempConfig(structuredClone(cfg) as SemanticConfigDraft);
        setErrorText(null);
        setContentAddValue('');
        setKeywordAddValue('');
        setConfigModalOpen(true);
    };

    const deleteConfig = (idx: number) => {
        setIndexDef(prev => {
            const prevSemantic = prev.semantic;
            if (!prevSemantic) return prev;

            const list = [...(prevSemantic.configurations || [])];
            const removed = list[idx];
            list.splice(idx, 1);

            const defaultConfiguration = prevSemantic.defaultConfiguration;
            const nextDefault = removed?.name && defaultConfiguration === removed.name ? undefined : defaultConfiguration;

            const nextSemantic: SemanticSettings | undefined =
                list.length === 0 && !nextDefault
                    ? undefined
                    : { ...prevSemantic, configurations: list, defaultConfiguration: nextDefault };

            return { ...prev, semantic: nextSemantic };
        });
    };

    const setDefaultConfiguration = (name: string | undefined) => {
        setIndexDef(prev => {
            const prevSemantic = prev.semantic;
            if (!prevSemantic) {
                if (!name) return prev;
                return {
                    ...prev,
                    semantic: { configurations: [], defaultConfiguration: name }
                };
            }
            const nextDefault = name || undefined;
            const nextSemantic: SemanticSettings | undefined =
                (prevSemantic.configurations || []).length === 0 && !nextDefault
                    ? undefined
                    : { ...prevSemantic, defaultConfiguration: nextDefault };
            return { ...prev, semantic: nextSemantic };
        });
    };

    const disableSemantic = () => {
        setIndexDef(prev => ({ ...prev, semantic: undefined }));
    };

    const saveFromModal = () => {
        if (!tempConfig) return;

        const name = String(tempConfig.name || '').trim();
        if (!name) {
            setErrorText('Name is required.');
            return;
        }

        const pf = tempConfig.prioritizedFields || {};
        const normalizedPrioritizedFields: PrioritizedFields = {
            titleField: String(pf.titleField?.fieldName || '').trim()
                ? { fieldName: String(pf.titleField?.fieldName || '').trim() }
                : undefined,
            prioritizedContentFields: normalizeFieldList(pf.prioritizedContentFields),
            prioritizedKeywordsFields: normalizeFieldList(pf.prioritizedKeywordsFields)
        };

        if (!hasAnyPrioritizedField(normalizedPrioritizedFields)) {
            setErrorText('At least one of Title, Content, or Keywords must be set in Prioritized Fields.');
            return;
        }

        const normalized: SemanticConfiguration = {
            name,
            rankingOrder: String(tempConfig.rankingOrder || '').trim() || undefined,
            prioritizedFields: normalizedPrioritizedFields
        };

        setIndexDef(prev => {
            const prevSemantic = prev.semantic || { configurations: [], defaultConfiguration: undefined };
            const list = [...(prevSemantic.configurations || [])];

            const nameConflict = list.some((c, i) => c?.name === name && i !== (editingIndex ?? -1));
            if (nameConflict) {
                // Keep state as-is; modal will show error via setErrorText below
                return prev;
            }

            if (editingIndex === null) list.push(normalized);
            else list[editingIndex] = normalized;

            const defaultConfiguration = prevSemantic.defaultConfiguration;
            const nextSemantic: SemanticSettings = {
                ...prevSemantic,
                configurations: list,
                defaultConfiguration
            };
            return { ...prev, semantic: nextSemantic };
        });

        // If a conflict exists, surface it (we intentionally didn't mutate the indexDef)
        const list = (indexDef.semantic?.configurations || []);
        const nameConflict = list.some((c, i) => c?.name === name && i !== (editingIndex ?? -1));
        if (nameConflict) {
            setErrorText(`A configuration named "${name}" already exists.`);
            return;
        }

        setConfigModalOpen(false);
        setTempConfig(null);
        setEditingIndex(null);
        setErrorText(null);
    };

    const fieldOptions: SelectOption[] = useMemo(() => {
        return searchableFieldNames.map(n => ({ value: n, label: n }));
    }, [searchableFieldNames]);

    const renderConfigEditorModal = () => {
        if (!configModalOpen || !tempConfig) return null;

        const pf = tempConfig.prioritizedFields || {};
        const content = pf.prioritizedContentFields || [];
        const keywords = pf.prioritizedKeywordsFields || [];

        const addFieldTo = (kind: 'content' | 'keywords', fieldName: string) => {
            const trimmed = String(fieldName || '').trim();
            if (!trimmed) return;

            if (kind === 'content') {
                const existing = new Set((content || []).map(c => c.fieldName));
                if (existing.has(trimmed)) return;
                setTempConfig({
                    ...tempConfig,
                    prioritizedFields: {
                        ...pf,
                        prioritizedContentFields: [...(content || []), { fieldName: trimmed }]
                    }
                });
                setContentAddValue('');
            } else {
                const existing = new Set((keywords || []).map(k => k.fieldName));
                if (existing.has(trimmed)) return;
                setTempConfig({
                    ...tempConfig,
                    prioritizedFields: {
                        ...pf,
                        prioritizedKeywordsFields: [...(keywords || []), { fieldName: trimmed }]
                    }
                });
                setKeywordAddValue('');
            }
        };

        const removeFieldFrom = (kind: 'content' | 'keywords', idx: number) => {
            if (kind === 'content') {
                const next = [...(content || [])];
                next.splice(idx, 1);
                setTempConfig({
                    ...tempConfig,
                    prioritizedFields: { ...pf, prioritizedContentFields: next }
                });
            } else {
                const next = [...(keywords || [])];
                next.splice(idx, 1);
                setTempConfig({
                    ...tempConfig,
                    prioritizedFields: { ...pf, prioritizedKeywordsFields: next }
                });
            }
        };

        const moveField = (kind: 'content' | 'keywords', from: number, direction: -1 | 1) => {
            if (kind === 'content') {
                const to = from + direction;
                if (to < 0 || to >= content.length) return;
                setTempConfig({
                    ...tempConfig,
                    prioritizedFields: { ...pf, prioritizedContentFields: moveItem(content, from, to) }
                });
            } else {
                const to = from + direction;
                if (to < 0 || to >= keywords.length) return;
                setTempConfig({
                    ...tempConfig,
                    prioritizedFields: { ...pf, prioritizedKeywordsFields: moveItem(keywords, from, to) }
                });
            }
        };

        return (
            <Modal
                title={editingIndex === null ? 'Add Semantic Configuration' : 'Edit Semantic Configuration'}
                isOpen={configModalOpen}
                onClose={() => {
                    setConfigModalOpen(false);
                    setTempConfig(null);
                    setEditingIndex(null);
                    setErrorText(null);
                }}
                width="860px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {errorText && <div className={styles.errorText}>{errorText}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={semanticDescriptions.name} /></Label>
                            <Input
                                value={String(tempConfig.name || '')}
                                onChange={e => {
                                    setErrorText(null);
                                    setTempConfig({ ...tempConfig, name: e.target.value });
                                }}
                                placeholder="e.g. semantic-default"
                            />
                        </div>
                        <div>
                            <Label>Ranking Order <InfoIcon tooltip={semanticDescriptions.rankingOrder} /></Label>
                            <SelectWithDescription
                                value={String(tempConfig.rankingOrder || '')}
                                onChange={e => {
                                    setErrorText(null);
                                    setTempConfig({ ...tempConfig, rankingOrder: e.target.value });
                                }}
                                options={rankingOrderOptions}
                            />
                        </div>
                    </div>

                    <fieldset style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px' }}>
                        <legend style={{ padding: '0 8px' }}>
                            Prioritized Fields <InfoIcon tooltip={semanticDescriptions.prioritizedFields} />
                        </legend>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                            <div>
                                <Label>Title Field <InfoIcon tooltip={semanticDescriptions.titleField} /></Label>
                                <SelectWithDescription
                                    value={String(pf.titleField?.fieldName || '')}
                                    onChange={e => {
                                        const v = String(e.target.value || '').trim();
                                        setErrorText(null);
                                        setTempConfig({
                                            ...tempConfig,
                                            prioritizedFields: {
                                                ...pf,
                                                titleField: v ? { fieldName: v } : undefined
                                            }
                                        });
                                    }}
                                    options={[{ value: '', label: '(None)', description: 'No title field.' }, ...fieldOptions]}
                                />
                            </div>

                            <div>
                                <Label>Content Fields (priority order) <InfoIcon tooltip={semanticDescriptions.prioritizedContentFields} /></Label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <SelectWithDescription
                                            value={contentAddValue}
                                            onChange={e => setContentAddValue(e.target.value)}
                                            options={[{ value: '', label: 'Select a field…' }, ...fieldOptions]}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => addFieldTo('content', contentAddValue)}
                                        disabled={!contentAddValue}
                                    >
                                        <i className="fas fa-plus"></i> Add
                                    </Button>
                                </div>

                                <div className={styles.pillList} style={{ marginTop: '10px' }}>
                                    {content.length === 0 && (
                                        <div style={{ opacity: 0.75, fontSize: '12px' }}>
                                            No content fields selected.
                                        </div>
                                    )}
                                    {content.map((f, idx) => (
                                        <div key={`${f.fieldName}-${idx}`} className={styles.pill}>
                                            <span title={f.fieldName}>{f.fieldName}</span>
                                            <span className={styles.pillActions}>
                                                <Button
                                                    variant="icon"
                                                    className={styles.smallButton}
                                                    onClick={() => moveField('content', idx, -1)}
                                                    disabled={idx === 0}
                                                    title="Move up"
                                                >
                                                    <i className="fas fa-arrow-up"></i>
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    className={styles.smallButton}
                                                    onClick={() => moveField('content', idx, 1)}
                                                    disabled={idx === content.length - 1}
                                                    title="Move down"
                                                >
                                                    <i className="fas fa-arrow-down"></i>
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    className={styles.smallButton}
                                                    onClick={() => removeFieldFrom('content', idx)}
                                                    title="Remove"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </Button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Keyword Fields (priority order) <InfoIcon tooltip={semanticDescriptions.prioritizedKeywordsFields} /></Label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <SelectWithDescription
                                            value={keywordAddValue}
                                            onChange={e => setKeywordAddValue(e.target.value)}
                                            options={[{ value: '', label: 'Select a field…' }, ...fieldOptions]}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => addFieldTo('keywords', keywordAddValue)}
                                        disabled={!keywordAddValue}
                                    >
                                        <i className="fas fa-plus"></i> Add
                                    </Button>
                                </div>

                                <div className={styles.pillList} style={{ marginTop: '10px' }}>
                                    {keywords.length === 0 && (
                                        <div style={{ opacity: 0.75, fontSize: '12px' }}>
                                            No keyword fields selected.
                                        </div>
                                    )}
                                    {keywords.map((f, idx) => (
                                        <div key={`${f.fieldName}-${idx}`} className={styles.pill}>
                                            <span title={f.fieldName}>{f.fieldName}</span>
                                            <span className={styles.pillActions}>
                                                <Button
                                                    variant="icon"
                                                    className={styles.smallButton}
                                                    onClick={() => moveField('keywords', idx, -1)}
                                                    disabled={idx === 0}
                                                    title="Move up"
                                                >
                                                    <i className="fas fa-arrow-up"></i>
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    className={styles.smallButton}
                                                    onClick={() => moveField('keywords', idx, 1)}
                                                    disabled={idx === keywords.length - 1}
                                                    title="Move down"
                                                >
                                                    <i className="fas fa-arrow-down"></i>
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    className={styles.smallButton}
                                                    onClick={() => removeFieldFrom('keywords', idx)}
                                                    title="Remove"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </Button>
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.helperText}>
                                    <InfoIcon tooltip={semanticDescriptions.fieldName} />
                                    <span style={{ marginLeft: '6px' }}>
                                        Tip: order matters — earlier fields have higher priority.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFromModal}>Save</Button>
                    <Button onClick={() => {
                        setConfigModalOpen(false);
                        setTempConfig(null);
                        setEditingIndex(null);
                        setErrorText(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const summarizeFields = (cfg: SemanticConfiguration | undefined) => {
        const pf = cfg?.prioritizedFields;
        const title = String(pf?.titleField?.fieldName || '').trim();
        const content = (pf?.prioritizedContentFields || []).map(f => f.fieldName).filter(Boolean);
        const keywords = (pf?.prioritizedKeywordsFields || []).map(f => f.fieldName).filter(Boolean);
        return {
            title: title || '-',
            content: content.length ? content.join(', ') : '-',
            keywords: keywords.length ? keywords.join(', ') : '-'
        };
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button onClick={openNewConfig}><i className="fas fa-plus"></i> Add Configuration</Button>
                    {semantic && (
                        <Button variant="secondary" onClick={disableSemantic} title="Remove semantic settings from the index definition">
                            <i className="fas fa-ban"></i> Disable Semantic
                        </Button>
                    )}
                    {!semantic && (
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            <InfoIcon tooltip={semanticDescriptions.semantic} />
                            <span style={{ marginLeft: '6px' }}>Semantic is not configured yet.</span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '80px', textAlign: 'left', padding: '8px' }}>Default</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={semanticDescriptions.name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Ranking Order <InfoIcon tooltip={semanticDescriptions.rankingOrder} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Title <InfoIcon tooltip={semanticDescriptions.titleField} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Content Fields <InfoIcon tooltip={semanticDescriptions.prioritizedContentFields} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Keyword Fields <InfoIcon tooltip={semanticDescriptions.prioritizedKeywordsFields} /></th>
                            <th style={{ width: '170px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configurations.map((cfg, i) => {
                            const isDefault = !!semantic?.defaultConfiguration && semantic.defaultConfiguration === cfg.name;
                            const s = summarizeFields(cfg);
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '4px' }}>
                                        {isDefault ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span title="Default configuration" style={{ color: 'var(--accent-color)' }}>
                                                    <i className="fas fa-star"></i>
                                                </span>
                                                <Button
                                                    variant="icon"
                                                    onClick={() => setDefaultConfiguration(undefined)}
                                                    title="Clear default"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                onClick={() => setDefaultConfiguration(cfg.name)}
                                                disabled={!cfg?.name}
                                                title="Set as default"
                                            >
                                                Set
                                            </Button>
                                        )}
                                    </td>
                                    <td style={{ padding: '4px' }}>{cfg.name}</td>
                                    <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.85, fontSize: '12px' }}>{cfg.rankingOrder || '-'}</td>
                                    <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.85, fontSize: '12px' }}>{s.title}</td>
                                    <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.85, fontSize: '12px' }} title={s.content}>{s.content}</td>
                                    <td style={{ padding: '4px', color: 'var(--text-color)', opacity: 0.85, fontSize: '12px' }} title={s.keywords}>{s.keywords}</td>
                                    <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                        <Button variant="secondary" onClick={() => openEditConfig(i)}>Edit</Button>
                                        <Button variant="icon" onClick={() => deleteConfig(i)} title="Delete">
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}

                        {configurations.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-color)', opacity: 0.7 }}>
                                    No semantic configurations configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {renderConfigEditorModal()}
        </div>
    );
};
