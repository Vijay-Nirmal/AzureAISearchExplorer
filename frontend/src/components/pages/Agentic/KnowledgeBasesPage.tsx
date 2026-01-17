import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { TextArea } from '../../common/TextArea';
import { Modal } from '../../common/Modal';
import { Select } from '../../common/Select';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';
import { JsonEditorModal } from '../../common/JsonEditorModal';
import {
  getFieldTooltipFromSchema,
  getResolvedEntity,
  getResolvedFieldDefinition,
  getResolvedFieldOptions,
  getTypeDescriptionFromSchema,
  resolveConfigRef
} from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../common/configDriven/configDrivenTypes';
import type { KnowledgeBase, KnowledgeBaseModel, KnowledgeSourceReference } from '../../../types/KnowledgeBaseModels';
import type { KnowledgeSource } from '../../../types/KnowledgeSourceModels';
import { knowledgeBasesService } from '../../../services/knowledgeBasesService';
import { knowledgeSourcesService } from '../../../services/knowledgeSourcesService';
import { confirmService } from '../../../services/confirmService';
import { KNOWLEDGE_BASE_DISCRIMINATOR, knowledgeBaseSchema } from './knowledgeBaseSchema';

import styles from './KnowledgeBasesPage.module.css';

type EncryptionKeyDraft = {
  enabled: boolean;
  keyVaultUri: string;
  keyVaultKeyName: string;
  keyVaultKeyVersion: string;
  applicationId: string;
  applicationSecret: string;
  identityType: string;
  userAssignedIdentity: string;
};

type ModelDraft = {
  enabled: boolean;
  kind: 'azureOpenAI';
  resourceUri: string;
  deploymentId: string;
  modelName: string;
  apiKey: string;
  authIdentityType: string;
  authUserAssignedIdentity: string;
};

type Draft = {
  name: string;
  description: string;
  answerInstructions: string;
  retrievalInstructions: string;
  outputMode: string;
  retrievalReasoningEffortKind: string;
  knowledgeSourceNames: string[];
  model: ModelDraft;
  encryption: EncryptionKeyDraft;
};

const namePattern = new RegExp('^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9])?$');

const buildTypeOnlySchema = (typeDef: ConfigDrivenTypeDefinition): ConfigDrivenSchema => {
  return {
    entity: { title: typeDef.label || 'Type', discriminatorKey: '@odata.type', nameKey: 'name' },
    commonFields: [],
    types: [typeDef]
  };
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const getString = (obj: Record<string, unknown>, key: string): string => {
  const v = obj[key];
  return typeof v === 'string' ? v : String(v ?? '');
};

const KnowledgeBasesPage: React.FC = () => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();

  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [ksItems, setKsItems] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<KnowledgeBase | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState<Record<string, unknown> | null>(null);

  const [draft, setDraft] = useState<Draft>(() => ({
    name: 'kb-new',
    description: '',
    answerInstructions: '',
    retrievalInstructions: '',
    outputMode: '',
    retrievalReasoningEffortKind: 'minimal',
    knowledgeSourceNames: [],
    model: {
      enabled: true,
      kind: 'azureOpenAI',
      resourceUri: '',
      deploymentId: '',
      modelName: '',
      apiKey: '',
      authIdentityType: '#Microsoft.Azure.Search.DataNoneIdentity',
      authUserAssignedIdentity: ''
    },
    encryption: {
      enabled: false,
      keyVaultUri: '',
      keyVaultKeyName: '',
      keyVaultKeyVersion: '',
      applicationId: '',
      applicationSecret: '',
      identityType: '#Microsoft.Azure.Search.DataNoneIdentity',
      userAssignedIdentity: ''
    }
  }));

  useEffect(() => {
    setBreadcrumbs([{ label: 'Knowledge Bases' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const entityDesc = useMemo(() => getResolvedEntity(knowledgeBaseSchema).description || '', []);
  const typeDesc = useMemo(() => getTypeDescriptionFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR), []);

  const tips = useMemo(() => {
    return {
      name: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'name'),
      description: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'description'),
      answerInstructions: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'answerInstructions'),
      retrievalInstructions: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'retrievalInstructions'),
      outputMode: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'outputMode'),
      retrievalReasoningEffort: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'retrievalReasoningEffort'),
      encryptionKey: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'encryptionKey'),
      knowledgeSources: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'knowledgeSources'),
      models: getFieldTooltipFromSchema(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'models')
    };
  }, []);

  const outputModeOptions = useMemo(() => {
    const def = getResolvedFieldDefinition(knowledgeBaseSchema, KNOWLEDGE_BASE_DISCRIMINATOR, 'outputMode');
    if (!def) return [];
    return getResolvedFieldOptions(def);
  }, []);

  const outputModeSelectOptions = useMemo(() => {
    return outputModeOptions.map((o) => ({
      value: String(o.value),
      description: typeof o.description === 'string' ? o.description : undefined
    }));
  }, [outputModeOptions]);

  const modelNameOptions = useMemo(() => {
    const modelParamsType = resolveConfigRef<ConfigDrivenTypeDefinition>('Common/AI/types/AzureOpenAIVectorizerParameters.json');
    const field = modelParamsType?.fields?.find((f) => f.key === 'modelName');
    if (!field) return [];
    return getResolvedFieldOptions(field);
  }, []);

  const modelNameSelectOptions = useMemo(() => {
    return modelNameOptions.map((o) => ({
      value: String(o.value),
      description: typeof o.description === 'string' ? o.description : undefined
    }));
  }, [modelNameOptions]);

  const encryptionTypeDef = useMemo(() => {
    return resolveConfigRef<ConfigDrivenTypeDefinition>('Common/EncryptionKey/types/SearchResourceEncryptionKey.json');
  }, []);

  const encryptionSchema = useMemo(() => {
    return encryptionTypeDef ? buildTypeOnlySchema(encryptionTypeDef) : null;
  }, [encryptionTypeDef]);

  const identitySchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('Common/DataIdentity/dataIdentityConfig.json');
  }, []);

  const retrievalEffortSchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('KnowledgeBase/RetrievalReasoningEffort/retrievalReasoningEffortConfig.json');
  }, []);

  const retrievalEffortOptions = useMemo(() => {
    const values = ['minimal', 'low', 'medium'];
    return values.map((v) => ({
      value: v,
      description: retrievalEffortSchema ? getTypeDescriptionFromSchema(retrievalEffortSchema, v) : undefined
    }));
  }, [retrievalEffortSchema]);

  const identityTypeOptions = useMemo(() => {
    const none = '#Microsoft.Azure.Search.DataNoneIdentity';
    const uai = '#Microsoft.Azure.Search.DataUserAssignedIdentity';
    return [
      { value: none, label: 'None', description: identitySchema ? getTypeDescriptionFromSchema(identitySchema, none) : undefined },
      { value: uai, label: 'User Assigned', description: identitySchema ? getTypeDescriptionFromSchema(identitySchema, uai) : undefined }
    ];
  }, [identitySchema]);

  const getEncTip = useCallback(
    (key: string): string | undefined => {
      if (!encryptionSchema) return undefined;
      return getFieldTooltipFromSchema(encryptionSchema, 'SearchResourceEncryptionKey', key);
    },
    [encryptionSchema]
  );

  const getIdTip = useCallback(
    (key: string, discriminator: string): string | undefined => {
      if (!identitySchema) return undefined;
      return getFieldTooltipFromSchema(identitySchema, discriminator, key);
    },
    [identitySchema]
  );

  const fetchItems = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const [kbs, kss] = await Promise.all([
        knowledgeBasesService.listKnowledgeBases(activeConnectionId),
        knowledgeSourcesService.listKnowledgeSources(activeConnectionId)
      ]);
      setItems(kbs ?? []);
      setKsItems(kss ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeConnectionId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((x) => String(x.name || '').toLowerCase().includes(f));
  }, [filter, items]);

  const openCreate = () => {
    setSelected(null);
    setDraft({
      name: 'kb-new',
      description: '',
      answerInstructions: '',
      retrievalInstructions: '',
      outputMode: '',
      retrievalReasoningEffortKind: 'minimal',
      knowledgeSourceNames: [],
      model: {
        enabled: true,
        kind: 'azureOpenAI',
        resourceUri: '',
        deploymentId: '',
        modelName: '',
        apiKey: '',
        authIdentityType: '#Microsoft.Azure.Search.DataNoneIdentity',
        authUserAssignedIdentity: ''
      },
      encryption: {
        enabled: false,
        keyVaultUri: '',
        keyVaultKeyName: '',
        keyVaultKeyVersion: '',
        applicationId: '',
        applicationSecret: '',
        identityType: '#Microsoft.Azure.Search.DataNoneIdentity',
        userAssignedIdentity: ''
      }
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (it: KnowledgeBase) => {
    const ks = Array.isArray(it.knowledgeSources) ? it.knowledgeSources : [];
    const models = Array.isArray(it.models) ? it.models : [];

    const first = models.find((m) => String(m.kind || '').toLowerCase() === 'azureopenai') || null;
    const params = first && isPlainObject(first.azureOpenAIParameters) ? (first.azureOpenAIParameters as Record<string, unknown>) : {};

    const ek = isPlainObject(it.encryptionKey) ? (it.encryptionKey as Record<string, unknown>) : undefined;
    const identity = ek && isPlainObject(ek.identity) ? (ek.identity as Record<string, unknown>) : undefined;

    const authIdentity = isPlainObject(params.authIdentity) ? (params.authIdentity as Record<string, unknown>) : undefined;

    setSelected(it);
    setDraft({
      name: String(it.name || ''),
      description: String(it.description || ''),
      answerInstructions: String(it.answerInstructions || ''),
      retrievalInstructions: String(it.retrievalInstructions || ''),
      outputMode: String(it.outputMode || ''),
      retrievalReasoningEffortKind: (() => {
        const re = it.retrievalReasoningEffort;
        if (re && isPlainObject(re)) {
          const kind = getString(re, 'kind').trim();
          return kind || 'minimal';
        }
        return 'minimal';
      })(),
      knowledgeSourceNames: ks.map((x) => String(x.name || '')).filter(Boolean),
      model: {
        enabled: !!first,
        kind: 'azureOpenAI',
        resourceUri: getString(params, 'resourceUri'),
        deploymentId: getString(params, 'deploymentId'),
        modelName: getString(params, 'modelName'),
        apiKey: getString(params, 'apiKey'),
        authIdentityType: authIdentity ? getString(authIdentity, '@odata.type') : '#Microsoft.Azure.Search.DataNoneIdentity',
        authUserAssignedIdentity: authIdentity ? getString(authIdentity, 'userAssignedIdentity') : ''
      },
      encryption: {
        enabled: !!it.encryptionKey,
        keyVaultUri: ek ? getString(ek, 'keyVaultUri') : '',
        keyVaultKeyName: ek ? getString(ek, 'keyVaultKeyName') : '',
        keyVaultKeyVersion: ek ? getString(ek, 'keyVaultKeyVersion') : '',
        applicationId: ek && isPlainObject(ek.accessCredentials) ? getString(ek.accessCredentials as Record<string, unknown>, 'applicationId') : '',
        applicationSecret: ek && isPlainObject(ek.accessCredentials) ? getString(ek.accessCredentials as Record<string, unknown>, 'applicationSecret') : '',
        identityType: identity ? getString(identity, '@odata.type') : '#Microsoft.Azure.Search.DataNoneIdentity',
        userAssignedIdentity: identity ? getString(identity, 'userAssignedIdentity') : ''
      }
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = (d: Draft): Record<string, string> => {
    const next: Record<string, string> = {};

    const name = d.name.trim();
    if (!name) next.name = 'Name is required.';
    else if (name.length > 128) next.name = 'Must be 128 characters or less.';
    else if (!namePattern.test(name)) next.name = 'Only letters, digits, spaces, dashes or underscores; must start and end with alphanumeric.';

    if (d.encryption.enabled) {
      if (!d.encryption.keyVaultUri.trim()) next.keyVaultUri = 'Key Vault URI is required when encryption is enabled.';
      if (!d.encryption.keyVaultKeyName.trim()) next.keyVaultKeyName = 'Key name is required when encryption is enabled.';
      if (d.encryption.identityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity' && !d.encryption.userAssignedIdentity.trim()) {
        next.userAssignedIdentity = 'User assigned identity is required for user-assigned identity type.';
      }
    }

    if (d.model.enabled && d.model.authIdentityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity' && !d.model.authUserAssignedIdentity.trim()) {
      next.authUserAssignedIdentity = 'User assigned identity is required when model auth identity is user-assigned.';
    }

    return next;
  };

  const buildEncryptionKey = (enc: EncryptionKeyDraft): Record<string, unknown> | null => {
    if (!enc.enabled) return null;

    const out: Record<string, unknown> = {
      keyVaultUri: enc.keyVaultUri.trim(),
      keyVaultKeyName: enc.keyVaultKeyName.trim()
    };

    if (enc.keyVaultKeyVersion.trim()) out.keyVaultKeyVersion = enc.keyVaultKeyVersion.trim();

    if (enc.applicationId.trim() || enc.applicationSecret.trim()) {
      out.accessCredentials = {
        applicationId: enc.applicationId.trim() || undefined,
        applicationSecret: enc.applicationSecret.trim() || undefined
      };
    }

    if (enc.identityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity') {
      out.identity = {
        '@odata.type': '#Microsoft.Azure.Search.DataUserAssignedIdentity',
        userAssignedIdentity: enc.userAssignedIdentity.trim()
      };
    } else {
      out.identity = { '@odata.type': '#Microsoft.Azure.Search.DataNoneIdentity' };
    }

    return out;
  };

  const buildModel = (m: ModelDraft): KnowledgeBaseModel[] | undefined => {
    if (!m.enabled) return undefined;

    const params: Record<string, unknown> = {};
    if (m.resourceUri.trim()) params.resourceUri = m.resourceUri.trim();
    if (m.deploymentId.trim()) params.deploymentId = m.deploymentId.trim();
    if (m.modelName.trim()) params.modelName = m.modelName.trim();
    if (m.apiKey.trim()) params.apiKey = m.apiKey.trim();

    if (m.authIdentityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity') {
      params.authIdentity = {
        '@odata.type': '#Microsoft.Azure.Search.DataUserAssignedIdentity',
        userAssignedIdentity: m.authUserAssignedIdentity.trim()
      };
    }

    return [{ kind: 'azureOpenAI', azureOpenAIParameters: params }];
  };

  const buildPayload = (d: Draft): KnowledgeBase => {
    const payload: KnowledgeBase = {
      name: d.name.trim(),
      description: d.description.trim() || undefined,
      answerInstructions: d.answerInstructions.trim() || undefined,
      retrievalInstructions: d.retrievalInstructions.trim() || undefined,
      outputMode: d.outputMode.trim() || undefined,
      retrievalReasoningEffort: { kind: d.retrievalReasoningEffortKind || 'minimal' }
    };

    const knowledgeSources = d.knowledgeSourceNames.map((n): KnowledgeSourceReference => ({ name: n }));
    if (knowledgeSources.length > 0) payload.knowledgeSources = knowledgeSources;

    const models = buildModel(d.model);
    if (models && models.length > 0) payload.models = models;

    const ek = buildEncryptionKey(d.encryption);
    if (ek) payload.encryptionKey = ek;

    return payload;
  };

  const save = async () => {
    if (!activeConnectionId) return;

    const nextErrors = validate(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});
    try {
      const payload = buildPayload(draft);
      await knowledgeBasesService.upsertKnowledgeBase(activeConnectionId, payload);
      setIsModalOpen(false);
      await fetchItems();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (name: string) => {
    if (!activeConnectionId) return;
    const confirmed = await confirmService.confirm({
      title: 'Delete Knowledge Base',
      message: `Delete knowledge base '${name}'?`
    });
    if (!confirmed) return;

    try {
      await knowledgeBasesService.deleteKnowledgeBase(activeConnectionId, name);
      await fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const openJson = () => {
    const payload = buildPayload(draft) as unknown as Record<string, unknown>;
    setJsonPayload(payload);
    setIsJsonOpen(true);
  };

  const saveJson = async (nextValue: unknown) => {
    if (!activeConnectionId) return;
    if (!isPlainObject(nextValue)) throw new Error('JSON must be an object.');

    const name = String((nextValue as Record<string, unknown>).name ?? '').trim();
    if (!name) throw new Error("'name' is required.");
    if (selected && name !== String(selected.name ?? '')) {
      throw new Error("Cannot change 'name' when editing an existing knowledge base.");
    }

    await knowledgeBasesService.upsertKnowledgeBase(activeConnectionId, nextValue as unknown as KnowledgeBase);
    setIsModalOpen(false);
    await fetchItems();
  };

  const knowledgeSourceOptions = useMemo(() => {
    return (ksItems ?? [])
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((ks) => {
        const name = String(ks.name || '');
        const kind = String(ks.kind || '').trim();
        const desc = String(ks.description || '').trim();
        const description = [kind, desc].filter(Boolean).join(' • ') || undefined;
        return { value: name, description };
      });
  }, [ksItems]);

  const selectedEffortDesc = useMemo(() => {
    if (!retrievalEffortSchema) return '';
    return getTypeDescriptionFromSchema(retrievalEffortSchema, draft.retrievalReasoningEffortKind);
  }, [draft.retrievalReasoningEffortKind, retrievalEffortSchema]);

  return (
    <div className={styles.page}>
      <div className={styles.actions}>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus"></i> Create Knowledge Base
        </Button>
        <Button onClick={() => void fetchItems()} disabled={loading}>
          <i className="fas fa-sync"></i> Refresh
        </Button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {typeDesc ? (
            <span style={{ color: 'var(--text-color)', opacity: 0.75, fontSize: '12px' }}>
              {typeDesc} {entityDesc ? <InfoIcon tooltip={entityDesc} /> : null}
            </span>
          ) : null}
          <Input
            placeholder="Filter knowledge bases..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '240px' }}
          />
        </div>
      </div>

      <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflow: 'auto', flex: 1 }}>
          <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 16px' }}>Name</th>
                <th style={{ padding: '8px 16px' }}>Output Mode</th>
                <th style={{ padding: '8px 16px' }}>Retrieval</th>
                <th style={{ padding: '8px 16px' }}>Sources</th>
                <th style={{ padding: '8px 16px' }}>Model</th>
                <th style={{ padding: '8px 16px' }}>Encryption</th>
                <th style={{ padding: '8px 16px', width: '190px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    No knowledge bases found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 16px', color: 'var(--accent-color)' }}>
                      <i className="fa-solid fa-book" style={{ marginRight: '8px', opacity: 0.7 }}></i>
                      {it.name}
                      {it.description ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-color)', opacity: 0.7, marginTop: '2px' }}>
                          {String(it.description)}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{String(it.outputMode || '')}</td>
                    {(() => {
                      const re = isPlainObject(it.retrievalReasoningEffort) ? it.retrievalReasoningEffort : null;
                      const effort = re ? String(re.kind ?? '').trim() : '';

                      const sources = Array.isArray(it.knowledgeSources) ? it.knowledgeSources : [];
                      const sourceCount = sources.length;

                      const models = Array.isArray(it.models) ? it.models : [];
                      const first =
                        models.find((m) => String(m.kind || '').toLowerCase() === 'azureopenai') ||
                        models.find((m) => !!String(m.kind || '').trim()) ||
                        null;
                      const kind = first ? String(first.kind || '').trim() : '';
                      const params = first && isPlainObject(first.azureOpenAIParameters) ? (first.azureOpenAIParameters as Record<string, unknown>) : null;
                      const modelName = params ? String(params.modelName ?? '').trim() : '';

                      const modelLabel = (() => {
                        if (!first) return '';
                        if (modelName) return modelName;
                        return kind || 'enabled';
                      })();

                      const encryptionOn = it.encryptionKey != null;

                      return (
                        <>
                          <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{effort}</td>
                          <td style={{ padding: '8px 16px', fontSize: '12px', opacity: 0.85 }}>{sourceCount}</td>
                          <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{modelLabel}</td>
                          <td style={{ padding: '8px 16px', fontSize: '12px', opacity: 0.85 }}>{encryptionOn ? 'Yes' : 'No'}</td>
                        </>
                      );
                    })()}
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="icon" onClick={() => openEdit(it)} title="Edit / View">
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button variant="icon" onClick={() => void remove(String(it.name || ''))} title="Delete">
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selected ? `Edit Knowledge Base: ${selected.name}` : 'Create Knowledge Base'}
        width="920px"
        footer={
          <>
            <Button variant="secondary" onClick={openJson}>
              Edit JSON
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className={styles.formGrid}>
          <div>
            <div className={styles.fieldLabel}>
              <span>Name</span>
              {tips.name && <InfoIcon tooltip={tips.name} />}
            </div>
            <Input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} disabled={!!selected} />
            {errors.name && <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.name}</div>}
          </div>

          <div>
            <div className={styles.fieldLabel}>
              <span>Output Mode</span>
              {tips.outputMode && <InfoIcon tooltip={tips.outputMode} />}
            </div>
            <SelectWithDescription
              value={draft.outputMode}
              options={[{ value: '', label: '(default)' }, ...outputModeSelectOptions]}
              onChange={(e) => setDraft((p) => ({ ...p, outputMode: e.target.value }))}
            />
          </div>

          <div className={styles.fullRow}>
            <div className={styles.fieldLabel}>
              <span>Description</span>
              {tips.description && <InfoIcon tooltip={tips.description} />}
            </div>
            <TextArea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Optional"
            />
          </div>

          <div className={styles.fullRow}>
            <div className={styles.fieldLabel}>
              <span>Answer Instructions</span>
              {tips.answerInstructions && <InfoIcon tooltip={tips.answerInstructions} />}
            </div>
            <TextArea
              value={draft.answerInstructions}
              onChange={(e) => setDraft((p) => ({ ...p, answerInstructions: e.target.value }))}
              rows={3}
              placeholder="Optional"
            />
          </div>

          <div className={styles.fullRow}>
            <div className={styles.fieldLabel}>
              <span>Retrieval Instructions</span>
              {tips.retrievalInstructions && <InfoIcon tooltip={tips.retrievalInstructions} />}
            </div>
            <TextArea
              value={draft.retrievalInstructions}
              onChange={(e) => setDraft((p) => ({ ...p, retrievalInstructions: e.target.value }))}
              rows={3}
              placeholder="Optional"
            />
          </div>

          <div>
            <div className={styles.fieldLabel}>
              <span>Retrieval Reasoning Effort</span>
              {tips.retrievalReasoningEffort && <InfoIcon tooltip={tips.retrievalReasoningEffort} />}
              {selectedEffortDesc && <InfoIcon tooltip={selectedEffortDesc} />}
            </div>
            <SelectWithDescription
              value={draft.retrievalReasoningEffortKind}
              options={retrievalEffortOptions}
              onChange={(e) => setDraft((p) => ({ ...p, retrievalReasoningEffortKind: e.target.value }))}
            />
          </div>

          <div>
            <div className={styles.fieldLabel}>
              <span>Knowledge Sources</span>
              {tips.knowledgeSources && <InfoIcon tooltip={tips.knowledgeSources} />}
            </div>
            <SelectWithDescription
              multiple
              value={draft.knowledgeSourceNames}
              options={knowledgeSourceOptions}
              onChangeValues={(values) => setDraft((p) => ({ ...p, knowledgeSourceNames: values.slice().sort() }))}
            />
            {ksItems.length === 0 ? (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-color)', opacity: 0.7 }}>No knowledge sources available.</div>
            ) : null}
          </div>

          <div className={styles.fullRow}>
            <div className={styles.sectionTitle}>
              Models {tips.models && <InfoIcon tooltip={tips.models} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={draft.model.enabled}
                onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, enabled: e.target.checked } }))}
              />
              <span style={{ color: 'var(--text-color)', opacity: 0.85, fontSize: 12 }}>Enable Azure OpenAI model</span>
            </div>

            {draft.model.enabled && (
              <div className={styles.formGrid}>
                <div>
                  <div className={styles.fieldLabel}>
                    <span>Kind</span>
                  </div>
                  <Select value={draft.model.kind} onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, kind: e.target.value as 'azureOpenAI' } }))}>
                    <option value="azureOpenAI">azureOpenAI</option>
                  </Select>
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Model Name</span>
                  </div>
                  <SelectWithDescription
                    value={draft.model.modelName}
                    options={[{ value: '', label: '(select)' }, ...modelNameSelectOptions]}
                    onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, modelName: e.target.value } }))}
                  />
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Resource URI</span>
                  </div>
                  <Input
                    value={draft.model.resourceUri}
                    onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, resourceUri: e.target.value } }))}
                    placeholder="https://my-openai-resource.openai.azure.com"
                  />
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Deployment ID</span>
                  </div>
                  <Input
                    value={draft.model.deploymentId}
                    onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, deploymentId: e.target.value } }))}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>API Key</span>
                  </div>
                  <Input
                    type="password"
                    value={draft.model.apiKey}
                    onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, apiKey: e.target.value } }))}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Auth Identity</span>
                  </div>
                  <SelectWithDescription
                    value={draft.model.authIdentityType}
                    options={identityTypeOptions}
                    onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, authIdentityType: e.target.value } }))}
                  />
                </div>

                {draft.model.authIdentityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity' && (
                  <div className={styles.fullRow}>
                    <div className={styles.fieldLabel}>
                      <span>User Assigned Identity</span>
                      {getIdTip('userAssignedIdentity', '#Microsoft.Azure.Search.DataUserAssignedIdentity') && (
                        <InfoIcon tooltip={String(getIdTip('userAssignedIdentity', '#Microsoft.Azure.Search.DataUserAssignedIdentity'))} />
                      )}
                    </div>
                    <Input
                      value={draft.model.authUserAssignedIdentity}
                      onChange={(e) => setDraft((p) => ({ ...p, model: { ...p.model, authUserAssignedIdentity: e.target.value } }))}
                      placeholder="/subscriptions/.../userAssignedIdentities/myId"
                    />
                    {errors.authUserAssignedIdentity && (
                      <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.authUserAssignedIdentity}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.fullRow}>
            <div className={styles.sectionTitle}>
              Encryption Key {tips.encryptionKey && <InfoIcon tooltip={tips.encryptionKey} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={draft.encryption.enabled}
                onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, enabled: e.target.checked } }))}
              />
              <span style={{ color: 'var(--text-color)', opacity: 0.85, fontSize: 12 }}>Enable customer-managed key</span>
            </div>

            {draft.encryption.enabled && (
              <div className={styles.formGrid}>
                <div>
                  <div className={styles.fieldLabel}>
                    <span>Key Vault URI</span>
                    {getEncTip('keyVaultUri') && <InfoIcon tooltip={String(getEncTip('keyVaultUri'))} />}
                  </div>
                  <Input
                    value={draft.encryption.keyVaultUri}
                    onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, keyVaultUri: e.target.value } }))}
                    placeholder="https://my-kv.vault.azure.net"
                  />
                  {errors.keyVaultUri && (
                    <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.keyVaultUri}</div>
                  )}
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Key Name</span>
                    {getEncTip('keyVaultKeyName') && <InfoIcon tooltip={String(getEncTip('keyVaultKeyName'))} />}
                  </div>
                  <Input
                    value={draft.encryption.keyVaultKeyName}
                    onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, keyVaultKeyName: e.target.value } }))}
                    placeholder="my-key"
                  />
                  {errors.keyVaultKeyName && (
                    <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.keyVaultKeyName}</div>
                  )}
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Key Version</span>
                    {getEncTip('keyVaultKeyVersion') && <InfoIcon tooltip={String(getEncTip('keyVaultKeyVersion'))} />}
                  </div>
                  <Input
                    value={draft.encryption.keyVaultKeyVersion}
                    onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, keyVaultKeyVersion: e.target.value } }))}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Application ID</span>
                    {getEncTip('accessCredentials.applicationId') && <InfoIcon tooltip={String(getEncTip('accessCredentials.applicationId'))} />}
                  </div>
                  <Input
                    value={draft.encryption.applicationId}
                    onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, applicationId: e.target.value } }))}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <div className={styles.fieldLabel}>
                    <span>Application Secret</span>
                    {getEncTip('accessCredentials.applicationSecret') && <InfoIcon tooltip={String(getEncTip('accessCredentials.applicationSecret'))} />}
                  </div>
                  <Input
                    type="password"
                    value={draft.encryption.applicationSecret}
                    onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, applicationSecret: e.target.value } }))}
                    placeholder="Optional"
                  />
                </div>

                <div className={styles.fullRow}>
                  <div className={styles.fieldLabel}>
                    <span>Identity Type</span>
                    {getEncTip('identity') && <InfoIcon tooltip={String(getEncTip('identity'))} />}
                  </div>
                  <SelectWithDescription
                    value={draft.encryption.identityType}
                    options={identityTypeOptions}
                    onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, identityType: e.target.value } }))}
                  />
                </div>

                {draft.encryption.identityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity' && (
                  <div className={styles.fullRow}>
                    <div className={styles.fieldLabel}>
                      <span>User Assigned Identity</span>
                      {getIdTip('userAssignedIdentity', '#Microsoft.Azure.Search.DataUserAssignedIdentity') && (
                        <InfoIcon tooltip={String(getIdTip('userAssignedIdentity', '#Microsoft.Azure.Search.DataUserAssignedIdentity'))} />
                      )}
                    </div>
                    <Input
                      value={draft.encryption.userAssignedIdentity}
                      onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, userAssignedIdentity: e.target.value } }))}
                      placeholder="/subscriptions/.../userAssignedIdentities/myId"
                    />
                    {errors.userAssignedIdentity && (
                      <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.userAssignedIdentity}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <JsonEditorModal
        isOpen={isJsonOpen}
        onClose={() => setIsJsonOpen(false)}
        title="Knowledge Base JSON"
        value={jsonPayload}
        onSave={saveJson}
      />
    </div>
  );
};

export default KnowledgeBasesPage;
