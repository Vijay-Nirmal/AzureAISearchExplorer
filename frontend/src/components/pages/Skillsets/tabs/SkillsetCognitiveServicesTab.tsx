import React, { useMemo, useState } from 'react';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { JsonEditorModal } from '../../../common/JsonEditorModal';
import { ConfigDrivenObjectForm } from '../../../common/configDriven/ConfigDrivenObjectForm';
import {
  applyDefaultsForType,
  getResolvedEntity,
  getResolvedTypeDefinitions,
  getTypeDefinition,
  normalizeBySchema
} from '../../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema } from '../../../common/configDriven/configDrivenTypes';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';

import schemaJson from '../../../../data/constants/config/Skillset/cognitiveServicesAccountConfig.json';

interface SkillsetCognitiveServicesTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}

const schema = schemaJson as unknown as ConfigDrivenSchema;

const SkillsetCognitiveServicesTab: React.FC<SkillsetCognitiveServicesTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [jsonEditorTitle, setJsonEditorTitle] = useState('');
  const [jsonEditorValue, setJsonEditorValue] = useState<unknown>(null);
  const [jsonEditorOnSave, setJsonEditorOnSave] = useState<((next: unknown) => void) | null>(null);

  const entity = useMemo(() => getResolvedEntity(schema), []);

  const value = useMemo(() => {
    const v = skillsetDef.cognitiveServices;
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    return {} as Record<string, unknown>;
  }, [skillsetDef.cognitiveServices]);

  const hasValue = useMemo(() => {
    const t = String(value['@odata.type'] ?? '').trim();
    return !!t;
  }, [value]);

  const discriminatorValue = useMemo(() => {
    return String(value[entity.discriminatorKey] ?? '').trim();
  }, [value, entity.discriminatorKey]);

  const isKnownType = useMemo(() => {
    if (!discriminatorValue) return false;
    return !!getTypeDefinition(schema, discriminatorValue);
  }, [discriminatorValue]);

  const defaultDiscriminatorValue = useMemo(() => {
    const defs = getResolvedTypeDefinitions(schema);
    const preferred = defs.find(d => {
      const dv = String(d.discriminatorValue || '');
      const label = String(d.label || '');
      return dv.includes('DefaultCognitiveServices') || label.includes('DefaultCognitiveServices');
    });
    return preferred?.discriminatorValue || defs[0]?.discriminatorValue || '';
  }, []);

  const editJson = (title: string, data: unknown, onSave: (next: unknown) => void) => {
    setJsonEditorTitle(title);
    setJsonEditorValue(data);
    setJsonEditorOnSave(() => onSave);
    setJsonEditorOpen(true);
  };

  const addDefault = () => {
    if (!defaultDiscriminatorValue) return;
    const next = applyDefaultsForType(schema, defaultDiscriminatorValue, { description: '' });
    setSkillsetDef(prev => ({ ...prev, cognitiveServices: next }));
    setErrors({});
  };

  const remove = () => {
    if (!window.confirm('Remove cognitive services configuration from this skillset?')) return;
    setSkillsetDef(prev => ({ ...prev, cognitiveServices: undefined }));
    setErrors({});
  };

  const setCognitiveServicesAutoNormalized = (nextDraft: Record<string, unknown>) => {
    const dv = String(nextDraft[entity.discriminatorKey] ?? '').trim();
    const known = dv ? !!getTypeDefinition(schema, dv) : false;

    // For unknown types, preserve the payload as-is (schema normalization can't be trusted).
    if (dv && !known) {
      setSkillsetDef(prev => ({ ...prev, cognitiveServices: nextDraft }));
      setErrors({});
      return;
    }

    const result = normalizeBySchema(schema, nextDraft, { preserveUnknown: true });
    if (!result.value) {
      setSkillsetDef(prev => ({ ...prev, cognitiveServices: nextDraft }));
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSkillsetDef(prev => ({ ...prev, cognitiveServices: result.value }));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!hasValue ? (
            <Button onClick={addDefault}>
              <i className="fas fa-plus"></i> Add
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => editJson('Edit Cognitive Services JSON', value, (next) => {
                  if (next !== null && (typeof next !== 'object' || Array.isArray(next))) {
                    alert('cognitiveServices must be a JSON object.');
                    return;
                  }
                  if (!next) {
                    setSkillsetDef(prev => ({ ...prev, cognitiveServices: undefined }));
                    setErrors({});
                    return;
                  }
                  setCognitiveServicesAutoNormalized(next as Record<string, unknown>);
                })}
                title="Edit raw JSON"
              >
                <i className="fas fa-pen"></i> Edit JSON
              </Button>
              <Button variant="secondary" onClick={remove}>
                <i className="fas fa-trash"></i> Remove
              </Button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <Card style={{ maxWidth: '1100px' }}>
          {!hasValue ? (
            <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.75, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                Add a cognitive services configuration to enable skill execution.
              </div>
              <div>
                <Button onClick={addDefault}>
                  <i className="fas fa-plus"></i> Add
                </Button>
              </div>
            </div>
          ) : (
            <>
              {!isKnownType && discriminatorValue && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '8px' }}>
                    This cognitive services type is not recognized by the form editor yet. You can still view/edit the raw JSON.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      variant="secondary"
                      onClick={() => editJson('Edit Cognitive Services JSON', value, (next) => {
                        if (next !== null && (typeof next !== 'object' || Array.isArray(next))) {
                          alert('cognitiveServices must be a JSON object.');
                          return;
                        }
                        if (!next) {
                          setSkillsetDef(prev => ({ ...prev, cognitiveServices: undefined }));
                          setErrors({});
                          return;
                        }
                        setCognitiveServicesAutoNormalized(next as Record<string, unknown>);
                      })}
                    >
                      <i className="fas fa-pen"></i> Edit JSON
                    </Button>
                  </div>
                </div>
              )}

              <ConfigDrivenObjectForm
                schema={schema}
                value={value}
                onChange={(next) => {
                  setCognitiveServicesAutoNormalized(next);
                }}
                errors={errors}
              />
            </>
          )}
        </Card>
      </div>

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

export default SkillsetCognitiveServicesTab;
