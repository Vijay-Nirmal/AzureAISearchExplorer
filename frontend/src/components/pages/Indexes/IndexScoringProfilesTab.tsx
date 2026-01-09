import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import scoringProfileDescriptions from '../../../data/constants/scoringProfilePropertyDescriptions.json';
import functionDescriptions from '../../../data/constants/scoringFunctionPropertyDescriptions.json';
import aggregations from '../../../data/constants/scoringFunctionAggregations.json';
import interpolations from '../../../data/constants/scoringFunctionInterpolations.json';

import type {
    DistanceScoringFunction,
    FreshnessScoringFunction,
    MagnitudeScoringFunction,
    ScoringFunction,
    ScoringFunctionAggregation,
    ScoringFunctionInterpolation,
    ScoringProfile,
    SearchField,
    SearchIndex,
    TagScoringFunction,
    TextWeights
} from '../../../types/IndexModels';

interface IndexScoringProfilesTabProps {
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

const getTextWeights = (sp: ScoringProfile): TextWeights | undefined => {
    return sp.text || sp.textWeights;
};

const normalizeTextWeights = (tw?: TextWeights): TextWeights | undefined => {
    if (!tw || typeof tw !== 'object') return undefined;
    const weights = tw.weights || {};

    const cleaned: Record<string, number> = {};
    for (const [k, v] of Object.entries(weights)) {
        const key = (k || '').trim();
        const num = typeof v === 'number' ? v : Number(v);
        if (!key) continue;
        if (!Number.isFinite(num)) continue;
        cleaned[key] = num;
    }

    return Object.keys(cleaned).length ? { weights: cleaned } : undefined;
};

const upsertWeight = (tw: TextWeights | undefined, fieldName: string, weight: number): TextWeights => {
    const weights = { ...(tw?.weights || {}) };
    weights[fieldName] = weight;
    return { weights };
};

const removeWeight = (tw: TextWeights | undefined, fieldName: string): TextWeights | undefined => {
    const weights = { ...(tw?.weights || {}) };
    delete weights[fieldName];
    return Object.keys(weights).length ? { weights } : undefined;
};

type ScoringFunctionKind = 'distance' | 'freshness' | 'magnitude' | 'tag';

const createDefaultFunction = (kind: ScoringFunctionKind): ScoringFunction => {
    if (kind === 'distance') {
        const out: DistanceScoringFunction = {
            type: 'distance',
            boost: 2,
            interpolation: 'linear',
            fieldName: '',
            distance: { boostingDistance: 5, referencePointParameter: 'location' }
        };
        return out;
    }

    if (kind === 'freshness') {
        const out: FreshnessScoringFunction = {
            type: 'freshness',
            boost: 2,
            interpolation: 'linear',
            fieldName: '',
            freshness: { boostingDuration: 'P30D' }
        };
        return out;
    }

    if (kind === 'magnitude') {
        const out: MagnitudeScoringFunction = {
            type: 'magnitude',
            boost: 2,
            interpolation: 'linear',
            fieldName: '',
            magnitude: { boostingRangeStart: 0, boostingRangeEnd: 10, constantBoostBeyondRange: false }
        };
        return out;
    }

    const out: TagScoringFunction = {
        type: 'tag',
        boost: 2,
        interpolation: 'linear',
        fieldName: '',
        tag: { tagsParameter: 'tags' }
    };
    return out;
};

const describeFunction = (fn: ScoringFunction): string => {
    const parts: string[] = [];
    if (fn.fieldName) parts.push(`field: ${fn.fieldName}`);
    if (typeof fn.boost === 'number') parts.push(`boost: ${fn.boost}`);
    if (fn.interpolation) parts.push(`interp: ${fn.interpolation}`);

    if (fn.type === 'distance') {
        const d = (fn as DistanceScoringFunction).distance;
        if (d?.boostingDistance != null) parts.push(`km: ${d.boostingDistance}`);
        if (d?.referencePointParameter) parts.push(`param: ${d.referencePointParameter}`);
    }

    if (fn.type === 'freshness') {
        const f = (fn as FreshnessScoringFunction).freshness;
        if (f?.boostingDuration) parts.push(`duration: ${f.boostingDuration}`);
    }

    if (fn.type === 'magnitude') {
        const m = (fn as MagnitudeScoringFunction).magnitude;
        if (m?.boostingRangeStart != null) parts.push(`start: ${m.boostingRangeStart}`);
        if (m?.boostingRangeEnd != null) parts.push(`end: ${m.boostingRangeEnd}`);
    }

    if (fn.type === 'tag') {
        const t = (fn as TagScoringFunction).tag;
        if (t?.tagsParameter) parts.push(`param: ${t.tagsParameter}`);
    }

    return parts.length ? parts.join(', ') : '-';
};

export const IndexScoringProfilesTab: React.FC<IndexScoringProfilesTabProps> = ({ indexDef, setIndexDef }) => {
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [editingProfileIndex, setEditingProfileIndex] = useState<number | null>(null);
    const [tempProfile, setTempProfile] = useState<ScoringProfile | null>(null);

    const [functionModalOpen, setFunctionModalOpen] = useState(false);
    const [editingFunctionIndex, setEditingFunctionIndex] = useState<number | null>(null);
    const [tempFunction, setTempFunction] = useState<ScoringFunction | null>(null);

    const searchableFieldNames = useMemo(() => getSearchableFieldNames(indexDef.fields || []), [indexDef.fields]);

    const defaultScoringProfileOptions = useMemo(() => {
        const names = (indexDef.scoringProfiles || []).map(p => p.name).filter(Boolean);
        const selected = (indexDef.defaultScoringProfile || '').trim();
        const options = [
            {
                value: '',
                label: '(None)',
                description: 'If not set and no scoring profile is specified in the query, default scoring (tf-idf) will be used.'
            },
            ...names.map(n => ({ value: n, label: n }))
        ];

        // If defaultScoringProfile is set to a missing profile name, keep it visible.
        if (selected && !names.includes(selected)) {
            options.push({ value: selected, label: `${selected} (missing)` });
        }

        return options;
    }, [indexDef.scoringProfiles, indexDef.defaultScoringProfile]);

    const aggregationOptions = useMemo(() => {
        return (aggregations as Array<{ value: string; description?: string }>).map(a => ({
            value: a.value,
            label:
                a.value === 'sum' ? 'Sum' :
                    a.value === 'average' ? 'Average' :
                        a.value === 'minimum' ? 'Minimum' :
                            a.value === 'maximum' ? 'Maximum' :
                                a.value === 'firstMatching' ? 'First Matching' :
                                    a.value,
            description: a.description
        }));
    }, []);

    const interpolationOptionsAll = useMemo(() => {
        return (interpolations as Array<{ value: string; description?: string }>).map(i => ({
            value: i.value,
            label:
                i.value === 'linear' ? 'Linear' :
                    i.value === 'constant' ? 'Constant' :
                        i.value === 'quadratic' ? 'Quadratic' :
                            i.value === 'logarithmic' ? 'Logarithmic' :
                                i.value,
            description: i.description
        }));
    }, []);

    const fieldNameOptions = useMemo(() => {
        return [
            { value: '', label: '(Select Field)' },
            ...searchableFieldNames.map(n => ({ value: n, label: n }))
        ];
    }, [searchableFieldNames]);

    const openNewProfile = () => {
        const existing = indexDef.scoringProfiles || [];
        const draft: ScoringProfile = {
            name: `profile-${existing.length + 1}`,
            functionAggregation: 'sum',
            functions: [],
            text: { weights: {} }
        };
        setEditingProfileIndex(null);
        setTempProfile(draft);
        setProfileModalOpen(true);
    };

    const openEditProfile = (idx: number) => {
        const sp = (indexDef.scoringProfiles || [])[idx];
        if (!sp) return;
        const clone = structuredClone(sp) as ScoringProfile;

        // keep UI stable by mirroring textWeights and text
        const tw = getTextWeights(clone);
        const norm = normalizeTextWeights(tw);
        clone.text = norm;
        clone.textWeights = norm;

        setEditingProfileIndex(idx);
        setTempProfile(clone);
        setProfileModalOpen(true);
    };

    const deleteProfile = (idx: number) => {
        setIndexDef(prev => {
            const list = [...(prev.scoringProfiles || [])];
            const removed = list[idx];
            list.splice(idx, 1);

            const removedName = (removed?.name || '').trim();
            const currentDefault = (prev.defaultScoringProfile || '').trim();
            const nextDefault = removedName && currentDefault === removedName ? undefined : prev.defaultScoringProfile;

            return { ...prev, scoringProfiles: list, defaultScoringProfile: nextDefault };
        });
    };

    const saveProfileFromModal = () => {
        if (!tempProfile) return;

        const normalizedName = (tempProfile.name || '').trim();
        if (!normalizedName) return;

        const normalizedText = normalizeTextWeights(getTextWeights(tempProfile));
        const normalizedFunctions = (tempProfile.functions || []).filter(Boolean);
        const normalizedAgg = (tempProfile.functionAggregation || '').trim() as ScoringFunctionAggregation;

        const normalized: ScoringProfile = {
            name: normalizedName,
            functionAggregation: normalizedFunctions.length ? (normalizedAgg || undefined) : undefined,
            functions: normalizedFunctions.length ? normalizedFunctions : undefined,
            // important: backend (Azure SDK) expects JSON property name "text"
            text: normalizedText,
            // keep for UI/back-compat if some older payloads used textWeights
            textWeights: normalizedText
        };

        setIndexDef(prev => {
            const list = [...(prev.scoringProfiles || [])];
            const oldName = editingProfileIndex === null ? '' : (list[editingProfileIndex]?.name || '');

            if (editingProfileIndex === null) list.push(normalized);
            else list[editingProfileIndex] = normalized;

            const currentDefault = (prev.defaultScoringProfile || '').trim();
            const oldTrim = (oldName || '').trim();
            const newTrim = normalized.name.trim();
            const nextDefault = oldTrim && currentDefault === oldTrim ? newTrim : prev.defaultScoringProfile;

            return { ...prev, scoringProfiles: list, defaultScoringProfile: nextDefault };
        });

        setProfileModalOpen(false);
        setTempProfile(null);
        setEditingProfileIndex(null);
    };

    const openNewFunction = (kind: ScoringFunctionKind) => {
        if (!tempProfile) return;
        setEditingFunctionIndex(null);
        setTempFunction(createDefaultFunction(kind));
        setFunctionModalOpen(true);
    };

    const openEditFunction = (idx: number) => {
        if (!tempProfile) return;
        const fn = (tempProfile.functions || [])[idx];
        if (!fn) return;
        setEditingFunctionIndex(idx);
        setTempFunction(structuredClone(fn) as ScoringFunction);
        setFunctionModalOpen(true);
    };

    const deleteFunction = (idx: number) => {
        if (!tempProfile) return;
        const list = [...(tempProfile.functions || [])];
        list.splice(idx, 1);
        setTempProfile({ ...tempProfile, functions: list });
    };

    const saveFunctionFromModal = () => {
        if (!tempProfile || !tempFunction) return;

        const fn: ScoringFunction = structuredClone(tempFunction) as ScoringFunction;

        // light normalization
        if (typeof fn.boost === 'number' && !Number.isFinite(fn.boost)) fn.boost = undefined;
        if (fn.fieldName != null) fn.fieldName = (fn.fieldName || '').trim();

        if (fn.type === 'distance') {
            const d = (fn as DistanceScoringFunction).distance || {};
            (fn as DistanceScoringFunction).distance = {
                boostingDistance: d.boostingDistance != null ? Number(d.boostingDistance) : undefined,
                referencePointParameter: (d.referencePointParameter || '').trim() || undefined
            };
        }

        if (fn.type === 'freshness') {
            const f = (fn as FreshnessScoringFunction).freshness || {};
            (fn as FreshnessScoringFunction).freshness = {
                boostingDuration: (f.boostingDuration || '').trim() || undefined
            };
        }

        if (fn.type === 'magnitude') {
            const m = (fn as MagnitudeScoringFunction).magnitude || {};
            (fn as MagnitudeScoringFunction).magnitude = {
                boostingRangeStart: m.boostingRangeStart != null ? Number(m.boostingRangeStart) : undefined,
                boostingRangeEnd: m.boostingRangeEnd != null ? Number(m.boostingRangeEnd) : undefined,
                constantBoostBeyondRange: !!m.constantBoostBeyondRange
            };
        }

        if (fn.type === 'tag') {
            const t = (fn as TagScoringFunction).tag || {};
            (fn as TagScoringFunction).tag = {
                tagsParameter: (t.tagsParameter || '').trim() || undefined
            };
        }

        const list = [...(tempProfile.functions || [])];
        if (editingFunctionIndex === null) list.push(fn);
        else list[editingFunctionIndex] = fn;

        setTempProfile({ ...tempProfile, functions: list });
        setFunctionModalOpen(false);
        setEditingFunctionIndex(null);
        setTempFunction(null);
    };

    const renderFunctionEditorModal = () => {
        if (!functionModalOpen || !tempProfile || !tempFunction) return null;

        const isDistance = tempFunction.type === 'distance';
        const isFreshness = tempFunction.type === 'freshness';
        const isMagnitude = tempFunction.type === 'magnitude';
        const isTag = tempFunction.type === 'tag';

        const interpolationOptions = isTag
            ? interpolationOptionsAll.filter(o => o.value === 'linear' || o.value === 'constant')
            : interpolationOptionsAll;

        return (
            <Modal
                title={editingFunctionIndex === null ? 'Add Scoring Function' : 'Edit Scoring Function'}
                isOpen={functionModalOpen}
                onClose={() => {
                    setFunctionModalOpen(false);
                    setEditingFunctionIndex(null);
                    setTempFunction(null);
                }}
                width="860px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Type <InfoIcon tooltip={functionDescriptions.type} /></Label>
                            <Input value={tempFunction.type} disabled />
                        </div>
                        <div>
                            <Label>Field Name <InfoIcon tooltip={functionDescriptions.fieldName} /></Label>
                            <SelectWithDescription
                                value={tempFunction.fieldName || ''}
                                onChange={e => setTempFunction({ ...tempFunction, fieldName: e.target.value })}
                                options={fieldNameOptions}
                            />
                        </div>
                        <div>
                            <Label>Boost <InfoIcon tooltip={functionDescriptions.boost} /></Label>
                            <Input
                                type="number"
                                value={tempFunction.boost ?? ''}
                                onChange={e => setTempFunction({ ...tempFunction, boost: e.target.value === '' ? undefined : Number(e.target.value) })}
                                placeholder="e.g. 2"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Interpolation <InfoIcon tooltip={functionDescriptions.interpolation} /></Label>
                            <SelectWithDescription
                                value={tempFunction.interpolation || 'linear'}
                                onChange={e => setTempFunction({ ...tempFunction, interpolation: e.target.value as ScoringFunctionInterpolation })}
                                options={interpolationOptions}
                            />
                        </div>
                        <div />
                    </div>

                    {isDistance && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Distance</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Boosting Distance (km) <InfoIcon tooltip={functionDescriptions['distance.boostingDistance']} /></Label>
                                    <Input
                                        type="number"
                                        value={(tempFunction as DistanceScoringFunction).distance?.boostingDistance ?? ''}
                                        onChange={e => setTempFunction({
                                            ...(tempFunction as DistanceScoringFunction),
                                            distance: {
                                                ...((tempFunction as DistanceScoringFunction).distance || {}),
                                                boostingDistance: e.target.value === '' ? undefined : Number(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Reference Point Parameter <InfoIcon tooltip={functionDescriptions['distance.referencePointParameter']} /></Label>
                                    <Input
                                        value={(tempFunction as DistanceScoringFunction).distance?.referencePointParameter || ''}
                                        onChange={e => setTempFunction({
                                            ...(tempFunction as DistanceScoringFunction),
                                            distance: {
                                                ...((tempFunction as DistanceScoringFunction).distance || {}),
                                                referencePointParameter: e.target.value
                                            }
                                        })}
                                        placeholder="e.g. location"
                                    />
                                </div>
                            </div>
                        </fieldset>
                    )}

                    {isFreshness && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Freshness</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Boosting Duration <InfoIcon tooltip={functionDescriptions['freshness.boostingDuration']} /></Label>
                                    <Input
                                        value={(tempFunction as FreshnessScoringFunction).freshness?.boostingDuration || ''}
                                        onChange={e => setTempFunction({
                                            ...(tempFunction as FreshnessScoringFunction),
                                            freshness: {
                                                ...((tempFunction as FreshnessScoringFunction).freshness || {}),
                                                boostingDuration: e.target.value
                                            }
                                        })}
                                        placeholder="e.g. P30D"
                                    />
                                </div>
                                <div />
                            </div>
                        </fieldset>
                    )}

                    {isMagnitude && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Magnitude</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Boosting Range Start <InfoIcon tooltip={functionDescriptions['magnitude.boostingRangeStart']} /></Label>
                                    <Input
                                        type="number"
                                        value={(tempFunction as MagnitudeScoringFunction).magnitude?.boostingRangeStart ?? ''}
                                        onChange={e => setTempFunction({
                                            ...(tempFunction as MagnitudeScoringFunction),
                                            magnitude: {
                                                ...((tempFunction as MagnitudeScoringFunction).magnitude || {}),
                                                boostingRangeStart: e.target.value === '' ? undefined : Number(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Boosting Range End <InfoIcon tooltip={functionDescriptions['magnitude.boostingRangeEnd']} /></Label>
                                    <Input
                                        type="number"
                                        value={(tempFunction as MagnitudeScoringFunction).magnitude?.boostingRangeEnd ?? ''}
                                        onChange={e => setTempFunction({
                                            ...(tempFunction as MagnitudeScoringFunction),
                                            magnitude: {
                                                ...((tempFunction as MagnitudeScoringFunction).magnitude || {}),
                                                boostingRangeEnd: e.target.value === '' ? undefined : Number(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'end' }}>
                                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!(tempFunction as MagnitudeScoringFunction).magnitude?.constantBoostBeyondRange}
                                            onChange={e => setTempFunction({
                                                ...(tempFunction as MagnitudeScoringFunction),
                                                magnitude: {
                                                    ...((tempFunction as MagnitudeScoringFunction).magnitude || {}),
                                                    constantBoostBeyondRange: e.target.checked
                                                }
                                            })}
                                        />
                                        Constant Boost Beyond Range <InfoIcon tooltip={functionDescriptions['magnitude.constantBoostBeyondRange']} />
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    )}

                    {isTag && (
                        <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                            <legend style={{ padding: '0 8px' }}>Tag</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Tags Parameter <InfoIcon tooltip={functionDescriptions['tag.tagsParameter']} /></Label>
                                    <Input
                                        value={(tempFunction as TagScoringFunction).tag?.tagsParameter || ''}
                                        onChange={e => setTempFunction({
                                            ...(tempFunction as TagScoringFunction),
                                            tag: {
                                                ...((tempFunction as TagScoringFunction).tag || {}),
                                                tagsParameter: e.target.value
                                            }
                                        })}
                                        placeholder="e.g. tags"
                                    />
                                </div>
                                <div />
                            </div>
                        </fieldset>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFunctionFromModal}>Save Function</Button>
                    <Button onClick={() => {
                        setFunctionModalOpen(false);
                        setEditingFunctionIndex(null);
                        setTempFunction(null);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const renderProfileEditorModal = () => {
        if (!profileModalOpen || !tempProfile) return null;

        const tw = getTextWeights(tempProfile);
        const weights = tw?.weights || {};
        const weightEntries = Object.entries(weights);

        return (
            <Modal
                title={editingProfileIndex === null ? 'Add Scoring Profile' : 'Edit Scoring Profile'}
                isOpen={profileModalOpen}
                onClose={() => {
                    setProfileModalOpen(false);
                    setTempProfile(null);
                    setEditingProfileIndex(null);
                }}
                width="980px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Name <InfoIcon tooltip={scoringProfileDescriptions.name} /></Label>
                            <Input
                                value={tempProfile.name || ''}
                                onChange={e => setTempProfile({ ...tempProfile, name: e.target.value })}
                                placeholder="e.g. my-scoring-profile"
                            />
                        </div>
                        <div>
                            <Label>Function Aggregation <InfoIcon tooltip={scoringProfileDescriptions.functionAggregation} /></Label>
                            <SelectWithDescription
                                value={tempProfile.functionAggregation || 'sum'}
                                onChange={e => setTempProfile({ ...tempProfile, functionAggregation: e.target.value as ScoringFunctionAggregation })}
                                options={aggregationOptions}
                            />
                        </div>
                    </div>

                    <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 8px' }}>Text Weights <InfoIcon tooltip={scoringProfileDescriptions.textWeights} /></legend>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                            <div style={{ flex: 1 }}>
                                <Label>Field</Label>
                                <SelectWithDescription
                                    value=""
                                    onChange={e => {
                                        const fieldName = e.target.value;
                                        if (!fieldName) return;
                                        const next = upsertWeight(tw, fieldName, weights[fieldName] ?? 1);
                                        setTempProfile({ ...tempProfile, text: next, textWeights: next });
                                    }}
                                    options={fieldNameOptions}
                                />
                            </div>
                            <div style={{ width: '260px', fontSize: '12px', color: '#aaa' }}>
                                Adds the field with default weight = 1.
                            </div>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                            <table className="data-grid" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '8px' }}>Field</th>
                                        <th style={{ textAlign: 'left', padding: '8px' }}>Weight</th>
                                        <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {weightEntries.map(([fieldName, weight]) => (
                                        <tr key={fieldName} style={{ borderBottom: '1px solid #333' }}>
                                            <td style={{ padding: '4px' }}>{fieldName}</td>
                                            <td style={{ padding: '4px', width: '240px' }}>
                                                <Input
                                                    type="number"
                                                    value={weight}
                                                    onChange={e => {
                                                        const num = e.target.value === '' ? 0 : Number(e.target.value);
                                                        const next = upsertWeight(tw, fieldName, num);
                                                        setTempProfile({ ...tempProfile, text: next, textWeights: next });
                                                    }}
                                                />
                                            </td>
                                            <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                                <Button variant="icon" onClick={() => {
                                                    const next = removeWeight(tw, fieldName);
                                                    setTempProfile({ ...tempProfile, text: next, textWeights: next });
                                                }}><i className="fas fa-trash"></i></Button>
                                            </td>
                                        </tr>
                                    ))}

                                    {weightEntries.length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                                No text weights configured
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </fieldset>

                    <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 8px' }}>Scoring Functions <InfoIcon tooltip={scoringProfileDescriptions.functions} /></legend>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <Button onClick={() => openNewFunction('distance')}><i className="fas fa-plus"></i> Distance</Button>
                            <Button onClick={() => openNewFunction('freshness')}><i className="fas fa-plus"></i> Freshness</Button>
                            <Button onClick={() => openNewFunction('magnitude')}><i className="fas fa-plus"></i> Magnitude</Button>
                            <Button onClick={() => openNewFunction('tag')}><i className="fas fa-plus"></i> Tag</Button>
                        </div>

                        <table className="data-grid" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>Summary</th>
                                    <th style={{ width: '160px', padding: '8px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(tempProfile.functions || []).map((fn, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '4px', textTransform: 'capitalize' }}>{fn.type}</td>
                                        <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>{describeFunction(fn)}</td>
                                        <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button variant="secondary" onClick={() => openEditFunction(idx)}>Edit</Button>
                                            <Button variant="icon" onClick={() => deleteFunction(idx)}><i className="fas fa-trash"></i></Button>
                                        </td>
                                    </tr>
                                ))}

                                {(tempProfile.functions || []).length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            No scoring functions configured
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </fieldset>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveProfileFromModal}>Save Profile</Button>
                    <Button onClick={() => {
                        setProfileModalOpen(false);
                        setTempProfile(null);
                        setEditingProfileIndex(null);
                    }}>Cancel</Button>
                </div>

                {renderFunctionEditorModal()}
            </Modal>
        );
    };

    const scoringProfiles = indexDef.scoringProfiles || [];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444' }}>
                <Button onClick={openNewProfile}><i className="fas fa-plus"></i> Add Scoring Profile</Button>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <Label>Default Scoring Profile <InfoIcon tooltip={scoringProfileDescriptions.defaultScoringProfile || 'The name of the scoring profile to use if none is specified in the query. If not set and no scoring profile is specified, default scoring (tf-idf) will be used.'} /></Label>
                        <SelectWithDescription
                            value={(indexDef.defaultScoringProfile || '').trim()}
                            onChange={e => {
                                const next = (e.target.value || '').trim();
                                setIndexDef(prev => ({
                                    ...prev,
                                    defaultScoringProfile: next ? next : undefined
                                }));
                            }}
                            options={defaultScoringProfileOptions}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', color: '#aaa', fontSize: '12px' }}>
                        Used when a query doesn't specify a scoring profile.
                    </div>
                </div>

                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ccc', borderBottom: '1px solid #444', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Scoring Profiles <InfoIcon tooltip={scoringProfileDescriptions.scoringProfiles || 'Scoring profiles define custom scoring logic using text weights and/or scoring functions.'} />
                </h4>

                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name <InfoIcon tooltip={scoringProfileDescriptions.name} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Aggregation <InfoIcon tooltip={scoringProfileDescriptions.functionAggregation} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Text Weights</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Functions</th>
                            <th style={{ width: '160px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scoringProfiles.map((sp, i) => {
                            const tw = getTextWeights(sp);
                            const weightCount = Object.keys(tw?.weights || {}).length;
                            const fnCount = (sp.functions || []).length;

                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '4px' }}>{sp.name}</td>
                                    <td style={{ padding: '4px' }}>{fnCount ? (sp.functionAggregation || 'sum') : '-'}</td>
                                    <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>{weightCount ? `${weightCount} field(s)` : '-'}</td>
                                    <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>{fnCount ? `${fnCount} function(s)` : '-'}</td>
                                    <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                        <Button variant="secondary" onClick={() => openEditProfile(i)}>Edit</Button>
                                        <Button variant="icon" onClick={() => deleteProfile(i)}><i className="fas fa-trash"></i></Button>
                                    </td>
                                </tr>
                            );
                        })}

                        {scoringProfiles.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                    No scoring profiles configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {searchableFieldNames.length === 0 && (
                    <div style={{ marginTop: '12px', color: '#aaa', fontSize: '12px' }}>
                        Note: No searchable fields found. Text weights and most scoring functions typically target searchable fields.
                    </div>
                )}
            </div>

            {renderProfileEditorModal()}
        </div>
    );
};
