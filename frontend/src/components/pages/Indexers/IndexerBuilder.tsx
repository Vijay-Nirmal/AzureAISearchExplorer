import React, { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexersService } from '../../../services/indexersService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { InfoIcon } from '../../common/InfoIcon';
import { JsonEditorModal } from '../../common/JsonEditorModal';
import { JsonView } from '../../common/JsonView';
import { ConfigDrivenObjectForm } from '../../common/configDriven/ConfigDrivenObjectForm';
import {
  normalizeBySchema,
  getFieldTooltipFromSchema,
  getTypeDescriptionFromSchema,
  applyDefaultsForType,
  getResolvedTypeDefinitions
} from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import type { SearchIndexer } from '../../../types/IndexerModels';
import { indexerSchema, INDEXER_DISCRIMINATOR } from './indexerTooltips';

interface IndexerBuilderProps {
  indexerName?: string;
  onBack: () => void;
  onRuns: (indexerName: string) => void;
}

type TabId =
  | 'general'
  | 'schedule'
  | 'parameters'
  | 'fieldMappings'
  | 'outputFieldMappings'
  | 'cache'
  | 'encryptionKey'
  | 'json';

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const IndexerBuilder: React.FC<IndexerBuilderProps> = ({ indexerName, onBack, onRuns }) => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();
  const isEdit = !!indexerName;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const base: Record<string, unknown> = {
      name: indexerName || 'new-indexer',
      description: undefined,
      disabled: false
    };

    // Ensure discriminator if schema expects it (even when the config only has one type).
    return applyDefaultsForType(indexerSchema, INDEXER_DISCRIMINATOR, base);
  });

  const indexerDef = draft as unknown as SearchIndexer;

  const indexerTypeDef = useMemo(() => {
    const defs = getResolvedTypeDefinitions(indexerSchema);
    return defs.length > 0 ? defs[0] : null;
  }, []);

  const buildTabSchema = useMemo(() => {
    return (title: string, fieldKeys: string[]) => {
      return {
        entity: {
          ...indexerSchema.entity,
          title
        },
        commonFields: [],
        types: [
          {
            ...(indexerTypeDef || { discriminatorValue: INDEXER_DISCRIMINATOR, label: INDEXER_DISCRIMINATOR, fields: [] }),
            fields: (indexerTypeDef?.fields || []).filter((f) => fieldKeys.includes(f.key))
          }
        ]
      } as unknown as ConfigDrivenSchema;
    };
  }, [indexerTypeDef]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Indexers', onClick: onBack },
      { label: isEdit ? indexerName : 'Create Indexer' }
    ]);
    return () => setBreadcrumbs([]);
  }, [isEdit, indexerName, onBack, setBreadcrumbs]);

  useEffect(() => {
    const fetchIndexer = async () => {
      if (!isEdit || !activeConnectionId || !indexerName) return;
      setLoading(true);
      try {
        const data = await indexersService.getIndexer(activeConnectionId, indexerName);
        if (isPlainObject(data)) setDraft(data as unknown as Record<string, unknown>);
      } catch (error) {
        console.error('Failed to fetch indexer', error);
        alert('Failed to load indexer definition');
      } finally {
        setLoading(false);
      }
    };

    void fetchIndexer();
  }, [isEdit, activeConnectionId, indexerName]);

  const saveIndexer = async () => {
    if (!activeConnectionId) return;

    const normalized = normalizeBySchema(indexerSchema, draft, { preserveUnknown: true });
    if (!normalized.value) {
      setErrors(normalized.errors);
      alert('Fix validation errors before saving.');
      return;
    }

    const normalizedObj = normalized.value as Record<string, unknown>;
    const name = String(normalizedObj.name ?? '').trim();
    if (!name) {
      alert('Indexer name is required.');
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const saved = await indexersService.createOrUpdateIndexer(activeConnectionId, normalized.value as unknown as SearchIndexer);
      setDraft(saved as unknown as Record<string, unknown>);
      onBack();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      alert('Failed to save indexer: ' + message);
    } finally {
      setLoading(false);
    }
  };

  type TabDef = { id: TabId; label: string; tooltip?: string };

  const tabs = useMemo((): TabDef[] => {
    const generalTooltipParts = [
      getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'name'),
      getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'description'),
      getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'dataSourceName'),
      getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'targetIndexName'),
      getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'disabled')
    ]
      .filter(Boolean)
      .join(' ');

    const typeDesc = getTypeDescriptionFromSchema(indexerSchema, INDEXER_DISCRIMINATOR);

    return [
      { id: 'general' as const, label: 'General', tooltip: generalTooltipParts || typeDesc },
      {
        id: 'schedule' as const,
        label: 'Schedule',
        tooltip: getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'schedule')
      },
      {
        id: 'parameters' as const,
        label: 'Parameters',
        tooltip: getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'parameters')
      },
      {
        id: 'fieldMappings' as const,
        label: 'Field Mappings',
        tooltip: getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'fieldMappings')
      },
      {
        id: 'outputFieldMappings' as const,
        label: 'Output Mappings',
        tooltip: getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'outputFieldMappings')
      },
      {
        id: 'cache' as const,
        label: 'Cache',
        tooltip: getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'cache')
      },
      {
        id: 'encryptionKey' as const,
        label: 'Encryption Key',
        tooltip: getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'encryptionKey')
      },
      { id: 'json' as const, label: 'JSON', tooltip: 'View and edit raw JSON.' }
    ];
  }, []);

  const renderHeader = () => {
    const descriptionText = String(indexerDef.description || '').trim();
    const nameText = String(indexerDef.name || '').trim();

    return (
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.15, flexShrink: 0 }}>
            {isEdit ? nameText : 'Create Indexer'}
          </h2>

          {!isEdit && (
            <div style={{ width: '320px', flexShrink: 0 }}>
              <Input
                value={nameText}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Indexer name (e.g. idxr-docs)"
                style={{ width: '100%' }}
              />
              {errors.name ? <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{errors.name}</div> : null}
            </div>
          )}

          {descriptionText ? (
            <span
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55vw', opacity: 0.75, fontSize: '12px' }}
              title={descriptionText}
            >
              — {descriptionText}
            </span>
          ) : null}

          {isEdit && (
            <Button variant="secondary" onClick={() => onRuns(nameText)} title="View runs / status" disabled={!nameText}>
              <i className="fas fa-chart-line"></i> Runs
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <Button variant="primary" onClick={saveIndexer} disabled={loading}>
            <i className="fas fa-save"></i> Save
          </Button>
          <Button onClick={onBack}>Cancel</Button>
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    return (
      <div style={{ padding: '0 12px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '1px', minWidth: 'max-content' }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: 'var(--text-color)',
                opacity: activeTab === tab.id ? 1 : 0.75,
                flexShrink: 0,
                lineHeight: 1.1,
                fontSize: '12px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {tab.label}
                {tab.tooltip && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <InfoIcon tooltip={tab.tooltip} />
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      {renderHeader()}

      <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderTabs()}

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'general' && (
            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
              <Card>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      Name
                      {getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'name') ? (
                        <InfoIcon tooltip={getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'name')!} />
                      ) : null}
                    </div>
                    <Input
                      value={String(indexerDef.name || '')}
                      onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={isEdit}
                      placeholder="Indexer name"
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      Disabled
                      {getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'disabled') ? (
                        <InfoIcon tooltip={getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'disabled')!} />
                      ) : null}
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="checkbox"
                        checked={!!indexerDef.disabled}
                        onChange={(e) => setDraft((prev) => ({ ...prev, disabled: e.target.checked }))}
                      />
                      <span style={{ fontSize: '12px' }}>{indexerDef.disabled ? 'True' : 'False'}</span>
                    </label>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      Description
                      {getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'description') ? (
                        <InfoIcon tooltip={getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'description')!} />
                      ) : null}
                    </div>
                    <Input
                      value={String(indexerDef.description || '')}
                      onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="What does this indexer do?"
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      Data Source Name
                      {getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'dataSourceName') ? (
                        <InfoIcon tooltip={getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'dataSourceName')!} />
                      ) : null}
                    </div>
                    <Input
                      value={String(indexerDef.dataSourceName || '')}
                      onChange={(e) => setDraft((prev) => ({ ...prev, dataSourceName: e.target.value }))}
                      placeholder="e.g. ds-blob"
                    />
                    {errors.dataSourceName ? (
                      <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{errors.dataSourceName}</div>
                    ) : null}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      Target Index Name
                      {getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'targetIndexName') ? (
                        <InfoIcon tooltip={getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'targetIndexName')!} />
                      ) : null}
                    </div>
                    <Input
                      value={String(indexerDef.targetIndexName || '')}
                      onChange={(e) => setDraft((prev) => ({ ...prev, targetIndexName: e.target.value }))}
                      placeholder="e.g. my-index"
                    />
                    {errors.targetIndexName ? (
                      <div style={{ color: 'var(--status-error-text)', fontSize: '12px', marginTop: '6px' }}>{errors.targetIndexName}</div>
                    ) : null}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      Skillset Name
                      {getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'skillsetName') ? (
                        <InfoIcon tooltip={getFieldTooltipFromSchema(indexerSchema, INDEXER_DISCRIMINATOR, 'skillsetName')!} />
                      ) : null}
                    </div>
                    <Input
                      value={String(indexerDef.skillsetName || '')}
                      onChange={(e) => setDraft((prev) => ({ ...prev, skillsetName: e.target.value }))}
                      placeholder="Optional (e.g. my-skillset)"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
              <Card>
                <ConfigDrivenObjectForm
                  schema={buildTabSchema('Schedule', ['schedule'])}
                  value={draft}
                  onChange={(next) => {
                    setDraft(next);
                    setErrors({});
                  }}
                  errors={errors}
                  layoutMode="split-complex"
                  nestedPresentation="accordion"
                  accordionDefaultExpanded={true}
                  accordionSingleOpen={false}
                />
              </Card>
            </div>
          )}

          {activeTab === 'parameters' && (
            <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
              <Card>
                <ConfigDrivenObjectForm
                  schema={buildTabSchema('Parameters', ['parameters'])}
                  value={draft}
                  onChange={(next) => {
                    setDraft(next);
                    setErrors({});
                  }}
                  errors={errors}
                  layoutMode="split-complex"
                  nestedPresentation="accordion"
                  accordionDefaultExpanded={true}
                  accordionSingleOpen={false}
                />
              </Card>
            </div>
          )}

          {activeTab === 'fieldMappings' && (
            <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
              <Card>
                <ConfigDrivenObjectForm
                  schema={buildTabSchema('Field Mappings', ['fieldMappings'])}
                  value={draft}
                  onChange={(next) => {
                    setDraft(next);
                    setErrors({});
                  }}
                  errors={errors}
                  layoutMode="split-complex"
                  nestedPresentation="accordion"
                  accordionDefaultExpanded={true}
                  accordionSingleOpen={false}
                />
              </Card>
            </div>
          )}

          {activeTab === 'outputFieldMappings' && (
            <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
              <Card>
                <ConfigDrivenObjectForm
                  schema={buildTabSchema('Output Field Mappings', ['outputFieldMappings'])}
                  value={draft}
                  onChange={(next) => {
                    setDraft(next);
                    setErrors({});
                  }}
                  errors={errors}
                  layoutMode="split-complex"
                  nestedPresentation="accordion"
                  accordionDefaultExpanded={true}
                  accordionSingleOpen={false}
                />
              </Card>
            </div>
          )}

          {activeTab === 'cache' && (
            <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
              <Card>
                <ConfigDrivenObjectForm
                  schema={buildTabSchema('Cache', ['cache'])}
                  value={draft}
                  onChange={(next) => {
                    setDraft(next);
                    setErrors({});
                  }}
                  errors={errors}
                  layoutMode="split-complex"
                  nestedPresentation="accordion"
                  accordionDefaultExpanded={true}
                  accordionSingleOpen={false}
                />
              </Card>
            </div>
          )}

          {activeTab === 'encryptionKey' && (
            <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
              <Card>
                <ConfigDrivenObjectForm
                  schema={buildTabSchema('Encryption Key', ['encryptionKey'])}
                  value={draft}
                  onChange={(next) => {
                    setDraft(next);
                    setErrors({});
                  }}
                  errors={errors}
                  layoutMode="split-complex"
                  nestedPresentation="accordion"
                  accordionDefaultExpanded={true}
                  accordionSingleOpen={false}
                />
              </Card>
            </div>
          )}

          {activeTab === 'json' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}
              >
                <Button variant="icon" onClick={() => setIsJsonEditorOpen(true)} title="Edit JSON">
                  <i className="fas fa-code"></i>
                </Button>
                <div style={{ marginLeft: 'auto', color: 'var(--text-color)', opacity: 0.75, fontSize: '12px' }}>
                  {loading ? 'Saving/Loading…' : 'Use the modal to avoid invalid JSON state'}
                </div>
              </div>

              <div style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                <JsonView data={draft} />
              </div>

              <JsonEditorModal
                isOpen={isJsonEditorOpen}
                onClose={() => setIsJsonEditorOpen(false)}
                title="Edit Indexer JSON"
                value={draft}
                onSave={(nextValue) => {
                  if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
                    alert('Indexer JSON must be an object.');
                    return;
                  }

                  const obj = nextValue as Record<string, unknown>;
                  const nextName = String(obj.name ?? '').trim();
                  if (!nextName) {
                    alert('Indexer JSON must include a non-empty name.');
                    return;
                  }

                  setDraft(obj);
                  setErrors({});
                }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default IndexerBuilder;
