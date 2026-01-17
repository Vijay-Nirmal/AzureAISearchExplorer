import React, { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { datasourcesService } from '../../../services/datasourcesService';
import { alertService } from '../../../services/alertService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { TextArea } from '../../common/TextArea';
import { InfoIcon } from '../../common/InfoIcon';
import { JsonEditorModal } from '../../common/JsonEditorModal';
import { JsonView } from '../../common/JsonView';
import {
  applyDefaultsForType,
  getFieldTooltipFromSchema,
  getResolvedFieldDefinition,
  getResolvedFieldOptions,
  getResolvedFieldNestedDefinition,
  getTypeDescriptionFromSchema,
  getResolvedTypeDefinitions,
  normalizeBySchema
} from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';
import { SelectWithDescription, type SelectOption } from '../../common/SelectWithDescription';
import type { SearchIndexerDataSourceConnection } from '../../../types/DataSourceModels';

import DataSourceEncryptionKeyTab from './DataSourceEncryptionKeyTab';

import dataSourceSchemaJson from '../../../data/constants/config/DataSource/dataSourceConfig.json';
import encryptionKeySchemaJson from '../../../data/constants/config/DataSource/encryptionKeyConfig.json';

interface DataSourceBuilderProps {
  dataSourceName?: string;
  onBack: () => void;
}

type TabId = 'general' | 'credentials' | 'container' | 'encryptionKey' | 'json';

const DataSourceBuilder: React.FC<DataSourceBuilderProps> = ({ dataSourceName, onBack }) => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();
  const isEdit = !!dataSourceName;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  const schema = dataSourceSchemaJson as unknown as ConfigDrivenSchema;
  const encryptionSchema = encryptionKeySchemaJson as unknown as ConfigDrivenSchema;

  const [draft, setDraft] = useState<SearchIndexerDataSourceConnection>(() => ({
    name: dataSourceName || 'new-datasource',
    description: '',
    type: undefined,
    subType: undefined,
    credentials: { connectionString: '' },
    container: { name: '', query: '' },
    indexerPermissionOptions: []
  }));

  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Data Sources', onClick: onBack },
      { label: isEdit ? (dataSourceName || '') : 'Create Data Source' }
    ]);
    return () => setBreadcrumbs([]);
  }, [dataSourceName, isEdit, onBack, setBreadcrumbs]);

  useEffect(() => {
    setActiveTab('general');
    setErrors({});
    setIsEditingDescription(false);
  }, [dataSourceName, isEdit]);

  useEffect(() => {
    const fetchOne = async () => {
      if (!isEdit || !activeConnectionId || !dataSourceName) return;
      setLoading(true);
      try {
        const ds = await datasourcesService.getDataSource(activeConnectionId, dataSourceName);
        setDraft(ds);
        if (!isEditingDescription) setDescriptionDraft(String(ds.description || ''));
      } catch (error) {
        console.error(error);
        alertService.show({ title: 'Error', message: 'Failed to load data source.' });
      } finally {
        setLoading(false);
      }
    };
    void fetchOne();
  }, [activeConnectionId, dataSourceName, isEdit, isEditingDescription]);

  const nameTooltip = useMemo(() => {
    return (schema.commonFields || []).find(f => f.key === 'name')?.tooltip;
  }, [schema]);

  const typeField = useMemo(() => getResolvedFieldDefinition(schema, 'SearchIndexerDataSource', 'type'), [schema]);
  const typeOptions = useMemo<SelectOption[]>(() => {
    if (!typeField) return [];
    const opts = getResolvedFieldOptions(typeField);
    return [
      { value: '', label: 'Select a type', description: 'Choose the datasource type.' },
      ...opts.map(o => ({ value: o.value, label: o.value, description: o.description }))
    ];
  }, [typeField]);

  const permissionField = useMemo(
    () => getResolvedFieldDefinition(schema, 'SearchIndexerDataSource', 'indexerPermissionOptions'),
    [schema]
  );
  const permissionOptions = useMemo(() => {
    if (!permissionField) return [];
    return getResolvedFieldOptions(permissionField);
  }, [permissionField]);

  const normalizeAndSet = (next: SearchIndexerDataSourceConnection) => {
    const raw: Record<string, unknown> = next as unknown as Record<string, unknown>;
    const type = getResolvedTypeDefinitions(schema)[0]?.discriminatorValue || 'SearchIndexerDataSource';
    const withType = applyDefaultsForType(schema, type, raw);
    const result = normalizeBySchema(schema, withType, { preserveUnknown: true });
    if (!result.value) {
      setDraft(next);
      setErrors(result.errors);
      return;
    }
    setDraft(result.value as unknown as SearchIndexerDataSourceConnection);
    setErrors({});
  };

  const save = async () => {
    if (!activeConnectionId) return;

    // Extra validation: new datasources should have a connectionString
    if (!isEdit) {
      const cs = String(draft.credentials?.connectionString || '').trim();
      if (!cs) {
        alertService.show({ title: 'Validation', message: 'Connection string is required for a new data source.' });
        setActiveTab('credentials');
        return;
      }
    }

    const type = String(draft.type || '').trim();
    if (!type) {
      alertService.show({ title: 'Validation', message: 'Type is required.' });
      setActiveTab('general');
      return;
    }

    const containerName = String(draft.container?.name || '').trim();
    if (!containerName) {
      alertService.show({ title: 'Validation', message: 'Container name is required.' });
      setActiveTab('container');
      return;
    }

    setLoading(true);
    try {
      const result = normalizeBySchema(schema, draft as unknown as Record<string, unknown>, { preserveUnknown: true });
      if (!result.value) {
        setErrors(result.errors);
        alertService.show({ title: 'Validation', message: 'Fix validation errors before saving.' });
        return;
      }

      const payload = result.value as unknown as SearchIndexerDataSourceConnection;
      await datasourcesService.createOrUpdateDataSource(activeConnectionId, payload);
      onBack();
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      alertService.show({ title: 'Error', message: `Failed to save data source: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(() => {
    const discriminator = 'SearchIndexerDataSource';
    const typeDesc = getTypeDescriptionFromSchema(schema, discriminator);
    const generalTooltip = [
      getFieldTooltipFromSchema(schema, discriminator, 'name'),
      getFieldTooltipFromSchema(schema, discriminator, 'description'),
      getFieldTooltipFromSchema(schema, discriminator, 'type'),
      getFieldTooltipFromSchema(schema, discriminator, 'subType')
    ]
      .filter(Boolean)
      .join(' ');

    return [
      { id: 'general' as const, label: 'General', tooltip: generalTooltip || typeDesc },
      { id: 'credentials' as const, label: 'Credentials', tooltip: getFieldTooltipFromSchema(schema, discriminator, 'credentials') },
      { id: 'container' as const, label: 'Container', tooltip: getFieldTooltipFromSchema(schema, discriminator, 'container') },
      { id: 'encryptionKey' as const, label: 'Encryption Key', tooltip: getFieldTooltipFromSchema(schema, discriminator, 'encryptionKey') },
      { id: 'json' as const, label: 'JSON', tooltip: 'View and edit raw JSON properties' }
    ];
  }, [schema]);

  const renderTabs = () => {
    return (
      <div style={{ padding: '0 12px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '1px', minWidth: 'max-content' }}>
          {tabs.map(t => (
            <div
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                borderBottom: activeTab === t.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                fontWeight: activeTab === t.id ? 600 : 400,
                color: 'var(--text-color)',
                opacity: activeTab === t.id ? 1 : 0.75,
                flexShrink: 0,
                lineHeight: 1.1,
                fontSize: '12px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>{t.label}</span>
                {t.tooltip ? <InfoIcon tooltip={t.tooltip} /> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    const descriptionText = String(draft.description || '').trim();

    return (
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.15, flexShrink: 0 }}>
            {isEdit ? String(draft.name || dataSourceName || '') : 'Create Data Source'}
          </h2>

          {!isEdit ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Label>
                  Name {nameTooltip ? <InfoIcon tooltip={nameTooltip} /> : null}
                </Label>
                {errors.name ? <span style={{ color: 'var(--status-error-text)', fontSize: '12px' }}>{errors.name}</span> : null}
              </div>
              <Input
                value={String(draft.name || '')}
                onChange={(e) => normalizeAndSet({ ...draft, name: e.target.value })}
                style={{ width: '420px', maxWidth: '100%' }}
                disabled={loading}
              />
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, color: 'var(--text-color)', fontSize: '12px', lineHeight: 1.2 }}>
            {!isEditingDescription && descriptionText.length > 0 ? (
              <span
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55vw', opacity: 0.75 }}
                title={descriptionText}
              >
                — {descriptionText}
              </span>
            ) : null}

            {isEditingDescription ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '420px', maxWidth: '55vw' }}>
                  <Input
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    placeholder="Description (optional)"
                    disabled={loading}
                  />
                </div>
                <Button
                  variant="icon"
                  title="Save description"
                  onClick={() => {
                    normalizeAndSet({ ...draft, description: descriptionDraft });
                    setIsEditingDescription(false);
                  }}
                  disabled={loading}
                >
                  <i className="fas fa-check"></i>
                </Button>
                <Button
                  variant="icon"
                  title="Cancel"
                  onClick={() => {
                    setDescriptionDraft(String(draft.description || ''));
                    setIsEditingDescription(false);
                  }}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            ) : (
              <Button
                variant="icon"
                onClick={() => {
                  setDescriptionDraft(String(draft.description || ''));
                  setIsEditingDescription(true);
                }}
                title={descriptionText ? 'Edit description' : 'Add description'}
                disabled={false}
                style={{ opacity: 0.9, flexShrink: 0 }}
              >
                <i className="fas fa-pen"></i>
              </Button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <Button variant="primary" onClick={save} disabled={loading}>
            <i className="fas fa-save"></i> {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={onBack}>Cancel</Button>
        </div>
      </div>
    );
  };

  const renderGeneralTab = () => {
    const descTooltip = getResolvedFieldDefinition(schema, 'SearchIndexerDataSource', 'description')?.tooltip;
    const typeTooltip = typeField?.tooltip;
    const subTypeTooltip = getResolvedFieldDefinition(schema, 'SearchIndexerDataSource', 'subType')?.tooltip;

    return (
      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Label>
              Type {typeTooltip ? <InfoIcon tooltip={typeTooltip} /> : null}
            </Label>
            <SelectWithDescription
              value={String(draft.type || '')}
              onChange={(e) => normalizeAndSet({ ...draft, type: e.target.value || undefined })}
              options={typeOptions}
              disabled={loading}
            />
          </div>

          <div>
            <Label>
              Sub Type {subTypeTooltip ? <InfoIcon tooltip={subTypeTooltip} /> : null}
            </Label>
            <Input
              value={String(draft.subType || '')}
              onChange={(e) => normalizeAndSet({ ...draft, subType: e.target.value || undefined })}
              placeholder="(optional)"
              disabled={loading}
            />
          </div>

          <div>
            <Label>
              Description {descTooltip ? <InfoIcon tooltip={descTooltip} /> : null}
            </Label>
            <TextArea
              value={String(draft.description || '')}
              onChange={(e) => normalizeAndSet({ ...draft, description: e.target.value })}
              placeholder="(optional)"
              rows={4}
              disabled={loading}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <Label>
              Indexer Permission Options {permissionField?.tooltip ? <InfoIcon tooltip={permissionField.tooltip} /> : null}
            </Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {permissionOptions.length === 0 ? (
                <div style={{ opacity: 0.7, fontSize: '12px' }}>No options available.</div>
              ) : (
                permissionOptions.map(o => {
                  const checked = (draft.indexerPermissionOptions || []).includes(o.value);
                  return (
                    <label key={o.value} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(draft.indexerPermissionOptions || []);
                          if (e.target.checked) next.add(o.value);
                          else next.delete(o.value);
                          normalizeAndSet({ ...draft, indexerPermissionOptions: Array.from(next) });
                        }}
                        disabled={loading}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{o.value}</div>
                        {o.description ? (
                          <div style={{ opacity: 0.75, fontSize: '12px' }}>{o.description}</div>
                        ) : null}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCredentialsTab = () => {
    const credsField = getResolvedFieldDefinition(schema, 'SearchIndexerDataSource', 'credentials');
    const nested = credsField ? getResolvedFieldNestedDefinition(credsField) : null;
    const connTooltip = (() => {
      if (nested?.kind === 'type') {
        const f = (nested.typeDef.fields || []).find(ff => ff.key === 'connectionString');
        return (f?.tooltip || '').trim() || undefined;
      }
      return undefined;
    })();

    return (
      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Tip: use <span style={{ fontFamily: 'var(--font-mono)' }}>&lt;unchanged&gt;</span> to keep existing connection string on update.
          </div>
          <div>
            <Label>
              Connection String {connTooltip ? <InfoIcon tooltip={connTooltip} /> : null}
            </Label>
            <TextArea
              value={String(draft.credentials?.connectionString || '')}
              onChange={(e) => normalizeAndSet({
                ...draft,
                credentials: { ...(draft.credentials || {}), connectionString: e.target.value }
              })}
              rows={5}
              placeholder="(required for new data sources)"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderContainerTab = () => {
    const containerField = getResolvedFieldDefinition(schema, 'SearchIndexerDataSource', 'container');
    const containerTooltip = containerField?.tooltip;

    const containerNested = containerField ? getResolvedFieldNestedDefinition(containerField) : null;
    const containerNameTooltip = (() => {
      if (containerNested?.kind === 'type') {
        const f = (containerNested.typeDef.fields || []).find(ff => ff.key === 'name');
        return (f?.tooltip || '').trim() || undefined;
      }
      return undefined;
    })();
    const containerQueryTooltip = (() => {
      if (containerNested?.kind === 'type') {
        const f = (containerNested.typeDef.fields || []).find(ff => ff.key === 'query');
        return (f?.tooltip || '').trim() || undefined;
      }
      return undefined;
    })();

    return (
      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Label>
              Container {containerTooltip ? <InfoIcon tooltip={containerTooltip} /> : null}
            </Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <Label>
                  Name {containerNameTooltip ? <InfoIcon tooltip={containerNameTooltip} /> : null}
                </Label>
                <Input
                  value={String(draft.container?.name || '')}
                  onChange={(e) => normalizeAndSet({ ...draft, container: { ...(draft.container || {}), name: e.target.value } })}
                  placeholder="e.g. documents"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>
                  Query {containerQueryTooltip ? <InfoIcon tooltip={containerQueryTooltip} /> : null}
                </Label>
                <TextArea
                  value={String(draft.container?.query || '')}
                  onChange={(e) => normalizeAndSet({ ...draft, container: { ...(draft.container || {}), query: e.target.value } })}
                  placeholder="(optional)"
                  rows={4}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderJsonTab = () => {
    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            onClick={() => setJsonEditorOpen(true)}
            disabled={loading}
            title={'Edit raw JSON'}
          >
            <i className="fas fa-code"></i> Edit JSON
          </Button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <JsonView data={draft} readOnly={true} />
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
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'credentials' && renderCredentialsTab()}
          {activeTab === 'container' && renderContainerTab()}
          {activeTab === 'encryptionKey' && (
            <DataSourceEncryptionKeyTab
              schema={encryptionSchema}
              dataSourceDef={draft}
              setDataSourceDef={setDraft}
            />
          )}
          {activeTab === 'json' && renderJsonTab()}
        </div>
      </Card>

      <JsonEditorModal
        isOpen={jsonEditorOpen}
        onClose={() => setJsonEditorOpen(false)}
        title={isEdit ? 'Edit Data Source JSON' : 'Create Data Source JSON'}
        value={draft as any}
        onSave={(nextValue) => {
          if (nextValue !== null && (typeof nextValue !== 'object' || Array.isArray(nextValue))) {
            alertService.show({ title: 'Validation', message: 'Data source must be a JSON object.' });
            return;
          }
          if (!nextValue) return;
          normalizeAndSet(nextValue as SearchIndexerDataSourceConnection);
          setJsonEditorOpen(false);
        }}
      />
    </div>
  );
};

export default DataSourceBuilder;
