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
  buildTypeOptions,
  getFieldTooltipFromSchema,
  getResolvedEntity,
  getResolvedFieldDefinition,
  getResolvedFieldNestedDefinition,
  getResolvedFieldOptions,
  getTypeDescriptionFromSchema,
  resolveConfigRef
} from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../common/configDriven/configDrivenTypes';
import type { SearchField, SearchIndex } from '../../../types/IndexModels';
import type { KnowledgeSource, KnowledgeSourceKind, SearchIndexFieldReference } from '../../../types/KnowledgeSourceModels';
import { indexesService } from '../../../services/indexesService';
import { knowledgeSourcesService } from '../../../services/knowledgeSourcesService';
import { KNOWLEDGE_SOURCE_DISCRIMINATOR, knowledgeSourceSchema } from './knowledgeSourceSchema';

import styles from './KnowledgeSourcesPage.module.css';

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

const getFieldRefArray = (obj: Record<string, unknown>, key: string): SearchIndexFieldReference[] => {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (isPlainObject(x) ? ({ name: getString(x, 'name') } as SearchIndexFieldReference) : null))
    .filter((x): x is SearchIndexFieldReference => !!x && !!String(x.name || '').trim());
};

const getStringArray = (obj: Record<string, unknown>, key: string): string[] => {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? '').trim()).filter(Boolean);
};

const getDomainArray = (obj: Record<string, unknown>, key: string): { address: string; includeSubpages: boolean }[] => {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (!isPlainObject(x)) return null;
      const address = String(x.address ?? '').trim();
      if (!address) return null;
      return { address, includeSubpages: !!x.includeSubpages };
    })
    .filter((x): x is { address: string; includeSubpages: boolean } => !!x);
};

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

type Draft = {
  name: string;
  kind: KnowledgeSourceKind;
  description: string;
  searchIndexParameters: {
    searchIndexName: string;
    semanticConfigurationName: string;
    searchFields: SearchIndexFieldReference[];
    sourceDataFields: SearchIndexFieldReference[];
  };
  azureBlobParameters: {
    connectionString: string;
    containerName: string;
    folderPath: string;
    isADLSGen2: boolean;
  };
  indexedOneLakeParameters: {
    fabricWorkspaceId: string;
    lakehouseId: string;
    targetPath: string;
  };
  indexedSharePointParameters: {
    connectionString: string;
    containerName: string;
    query: string;
  };
  remoteSharePointParameters: {
    containerTypeId: string;
    filterExpression: string;
    resourceMetadata: string[];
  };
  webParameters: {
    allowedDomains: { address: string; includeSubpages: boolean }[];
    blockedDomains: { address: string; includeSubpages: boolean }[];
  };
  encryption: EncryptionKeyDraft;
};

const namePattern = new RegExp('^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9])?$');

const makeEmptyDraft = (kind: KnowledgeSourceKind): Draft => {
  return {
    name: 'ks-new',
    kind,
    description: '',
    searchIndexParameters: {
      searchIndexName: '',
      semanticConfigurationName: '',
      searchFields: [],
      sourceDataFields: []
    },
    azureBlobParameters: {
      connectionString: '',
      containerName: '',
      folderPath: '',
      isADLSGen2: false
    },
    indexedOneLakeParameters: {
      fabricWorkspaceId: '',
      lakehouseId: '',
      targetPath: ''
    },
    indexedSharePointParameters: {
      connectionString: '',
      containerName: 'defaultSiteLibrary',
      query: ''
    },
    remoteSharePointParameters: {
      containerTypeId: '',
      filterExpression: '',
      resourceMetadata: []
    },
    webParameters: {
      allowedDomains: [],
      blockedDomains: []
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
  };
};

type IndexListLike = {
  name: string;
  description?: string;
};

const toIndexListLike = (value: unknown): IndexListLike | null => {
  if (!isPlainObject(value)) return null;
  const name = String(value.name ?? '').trim();
  if (!name) return null;
  const description = typeof value.description === 'string' ? value.description : undefined;
  return { name, description };
};

const fieldDescription = (f: SearchField): string => {
  const flags: string[] = [];
  if (f.key) flags.push('key');
  if (f.searchable) flags.push('searchable');
  if (f.filterable) flags.push('filterable');
  if (f.sortable) flags.push('sortable');
  if (f.facetable) flags.push('facetable');

  const type = String((f as unknown as { type?: unknown }).type ?? '').trim();
  const left = type || 'field';
  return flags.length > 0 ? `${left} • ${flags.join(', ')}` : left;
};

const KnowledgeSourcesPage: React.FC = () => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();

  const [items, setItems] = useState<KnowledgeSource[]>([]);
  const [indexes, setIndexes] = useState<IndexListLike[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<KnowledgeSource | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState<Record<string, unknown> | null>(null);

  const [draft, setDraft] = useState<Draft>(() => ({
    ...makeEmptyDraft(KNOWLEDGE_SOURCE_DISCRIMINATOR)
  }));

  useEffect(() => {
    setBreadcrumbs([{ label: 'Knowledge Sources' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const entityDesc = useMemo(() => getResolvedEntity(knowledgeSourceSchema).description || '', []);

  const kindOptions = useMemo(() => {
    return buildTypeOptions(knowledgeSourceSchema).map((o) => ({
      value: o.value,
      label: o.label || o.value,
      description: o.description
    }));
  }, []);

  const currentKind = draft.kind || KNOWLEDGE_SOURCE_DISCRIMINATOR;
  const currentTypeDesc = useMemo(() => getTypeDescriptionFromSchema(knowledgeSourceSchema, currentKind), [currentKind]);

  const paramsInfo = useMemo(() => {
    const kind = String(currentKind);
    switch (kind) {
      case 'azureBlob':
        return { fieldKey: 'azureBlobParameters', typeDiscriminator: 'AzureBlobKnowledgeSourceParameters' };
      case 'indexedOneLake':
        return { fieldKey: 'indexedOneLakeParameters', typeDiscriminator: 'IndexedOneLakeKnowledgeSourceParameters' };
      case 'indexedSharePoint':
        return { fieldKey: 'indexedSharePointParameters', typeDiscriminator: 'IndexedSharePointKnowledgeSourceParameters' };
      case 'remoteSharePoint':
        return { fieldKey: 'remoteSharePointParameters', typeDiscriminator: 'RemoteSharePointKnowledgeSourceParameters' };
      case 'web':
        return { fieldKey: 'webParameters', typeDiscriminator: 'WebKnowledgeSourceParameters' };
      case 'searchIndex':
      default:
        return { fieldKey: 'searchIndexParameters', typeDiscriminator: 'SearchIndexKnowledgeSourceParameters' };
    }
  }, [currentKind]);

  const tips = useMemo(() => {
    return {
      name: getFieldTooltipFromSchema(knowledgeSourceSchema, currentKind, 'name'),
      kind: getFieldTooltipFromSchema(knowledgeSourceSchema, currentKind, 'kind'),
      description: getFieldTooltipFromSchema(knowledgeSourceSchema, currentKind, 'description'),
      encryptionKey: getFieldTooltipFromSchema(knowledgeSourceSchema, currentKind, 'encryptionKey'),
      parameters: getFieldTooltipFromSchema(knowledgeSourceSchema, currentKind, paramsInfo.fieldKey)
    };
  }, [currentKind, paramsInfo.fieldKey]);

  const paramsSchema = useMemo(() => {
    const paramsField = getResolvedFieldDefinition(knowledgeSourceSchema, currentKind, paramsInfo.fieldKey);
    if (!paramsField) return null;

    const nested = getResolvedFieldNestedDefinition(paramsField);
    if (!nested) return null;
    if (nested.kind === 'schema') return nested.schema;
    return buildTypeOnlySchema(nested.typeDef);
  }, [currentKind, paramsInfo.fieldKey]);

  const getParamTip = useCallback(
    (key: string) => {
      if (!paramsSchema) return undefined;
      return getFieldTooltipFromSchema(paramsSchema, paramsInfo.typeDiscriminator, key);
    },
    [paramsInfo.typeDiscriminator, paramsSchema]
  );

  const indexedSharePointContainerOptions = useMemo(() => {
    if (currentKind !== 'indexedSharePoint') return [] as { value: string; description?: string; label?: string }[];
    if (!paramsSchema) return [];
    const field = getResolvedFieldDefinition(paramsSchema, paramsInfo.typeDiscriminator, 'containerName');
    if (!field) return [];
    return getResolvedFieldOptions(field).map((o) => ({ value: o.value, description: o.description }));
  }, [currentKind, paramsInfo.typeDiscriminator, paramsSchema]);

  const encryptionTypeDef = useMemo(() => {
    return resolveConfigRef<ConfigDrivenTypeDefinition>('Common/EncryptionKey/types/SearchResourceEncryptionKey.json');
  }, []);

  const encryptionSchema = useMemo(() => {
    return encryptionTypeDef ? buildTypeOnlySchema(encryptionTypeDef) : null;
  }, [encryptionTypeDef]);

  const identitySchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('Common/DataIdentity/dataIdentityConfig.json');
  }, []);

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
    (key: string): string | undefined => {
      if (!identitySchema) return undefined;
      return getFieldTooltipFromSchema(identitySchema, draft.encryption.identityType, key);
    },
    [draft.encryption.identityType, identitySchema]
  );

  const fetchItems = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const [ks, idx] = await Promise.all([
        knowledgeSourcesService.listKnowledgeSources(activeConnectionId),
        indexesService.listIndexes(activeConnectionId)
      ]);
      setItems(ks ?? []);
      const parsed = (Array.isArray(idx) ? idx : []).map(toIndexListLike).filter((x): x is IndexListLike => !!x);
      parsed.sort((a, b) => a.name.localeCompare(b.name));
      setIndexes(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeConnectionId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const loadIndex = async () => {
      if (!activeConnectionId) return;
      if (draft.kind !== 'searchIndex') {
        setSelectedIndex(null);
        return;
      }
      const name = draft.searchIndexParameters.searchIndexName.trim();
      if (!name) {
        setSelectedIndex(null);
        return;
      }
      try {
        const idx = await indexesService.getIndex(activeConnectionId, name);
        setSelectedIndex(idx);
      } catch (e) {
        console.error(e);
        setSelectedIndex(null);
      }
    };
    void loadIndex();
  }, [activeConnectionId, draft.kind, draft.searchIndexParameters.searchIndexName]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((x) => String(x.name || '').toLowerCase().includes(f));
  }, [filter, items]);

  const openCreate = () => {
    setSelected(null);
    setDraft(makeEmptyDraft(KNOWLEDGE_SOURCE_DISCRIMINATOR));
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (it: KnowledgeSource) => {
    const kind = (String(it.kind || KNOWLEDGE_SOURCE_DISCRIMINATOR) as KnowledgeSourceKind) || KNOWLEDGE_SOURCE_DISCRIMINATOR;

    const sip = isPlainObject(it.searchIndexParameters) ? it.searchIndexParameters : {};
    const abp = isPlainObject(it.azureBlobParameters) ? it.azureBlobParameters : {};
    const olp = isPlainObject(it.indexedOneLakeParameters) ? it.indexedOneLakeParameters : {};
    const spp = isPlainObject(it.indexedSharePointParameters) ? it.indexedSharePointParameters : {};
    const rsp = isPlainObject(it.remoteSharePointParameters) ? it.remoteSharePointParameters : {};

    const wp = isPlainObject(it.webParameters) ? it.webParameters : {};
    const domains = wp && isPlainObject(wp.domains) ? (wp.domains as Record<string, unknown>) : {};

    const ek = isPlainObject(it.encryptionKey) ? it.encryptionKey : undefined;
    const identity = ek && isPlainObject(ek.identity) ? (ek.identity as Record<string, unknown>) : undefined;

    setSelected(it);
    setDraft({
      name: String(it.name || ''),
      kind,
      description: String(it.description || ''),
      searchIndexParameters: {
        searchIndexName: getString(sip, 'searchIndexName'),
        semanticConfigurationName: getString(sip, 'semanticConfigurationName'),
        searchFields: getFieldRefArray(sip, 'searchFields'),
        sourceDataFields: getFieldRefArray(sip, 'sourceDataFields')
      },
      azureBlobParameters: {
        connectionString: getString(abp, 'connectionString'),
        containerName: getString(abp, 'containerName'),
        folderPath: getString(abp, 'folderPath'),
        isADLSGen2: !!abp.isADLSGen2
      },
      indexedOneLakeParameters: {
        fabricWorkspaceId: getString(olp, 'fabricWorkspaceId'),
        lakehouseId: getString(olp, 'lakehouseId'),
        targetPath: getString(olp, 'targetPath')
      },
      indexedSharePointParameters: {
        connectionString: getString(spp, 'connectionString'),
        containerName: getString(spp, 'containerName') || 'defaultSiteLibrary',
        query: getString(spp, 'query')
      },
      remoteSharePointParameters: {
        containerTypeId: getString(rsp, 'containerTypeId'),
        filterExpression: getString(rsp, 'filterExpression'),
        resourceMetadata: getStringArray(rsp, 'resourceMetadata')
      },
      webParameters: {
        allowedDomains: getDomainArray(domains, 'allowedDomains'),
        blockedDomains: getDomainArray(domains, 'blockedDomains')
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

    const kind = String(d.kind || KNOWLEDGE_SOURCE_DISCRIMINATOR);
    if (kind === 'searchIndex') {
      const idxName = d.searchIndexParameters.searchIndexName.trim();
      if (!idxName) next.searchIndexName = 'Search Index Name is required.';
    } else if (kind === 'azureBlob') {
      if (!d.azureBlobParameters.connectionString.trim()) next.azureBlob_connectionString = 'Connection String is required.';
      if (!d.azureBlobParameters.containerName.trim()) next.azureBlob_containerName = 'Container Name is required.';
    } else if (kind === 'indexedOneLake') {
      if (!d.indexedOneLakeParameters.fabricWorkspaceId.trim()) next.indexedOneLake_fabricWorkspaceId = 'Fabric Workspace ID is required.';
      if (!d.indexedOneLakeParameters.lakehouseId.trim()) next.indexedOneLake_lakehouseId = 'Lakehouse ID is required.';
    } else if (kind === 'indexedSharePoint') {
      if (!d.indexedSharePointParameters.connectionString.trim()) next.indexedSharePoint_connectionString = 'Connection String is required.';
      if (!d.indexedSharePointParameters.containerName.trim()) next.indexedSharePoint_containerName = 'Container Name is required.';
    }

    if (d.encryption.enabled) {
      if (!d.encryption.keyVaultUri.trim()) next.keyVaultUri = 'Key Vault URI is required when encryption is enabled.';
      if (!d.encryption.keyVaultKeyName.trim()) next.keyVaultKeyName = 'Key name is required when encryption is enabled.';
      if (d.encryption.identityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity' && !d.encryption.userAssignedIdentity.trim()) {
        next.userAssignedIdentity = 'User assigned identity is required for user-assigned identity type.';
      }
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

  const buildPayload = (d: Draft): KnowledgeSource => {
    const out: KnowledgeSource = {
      ...(selected ? (selected as unknown as Record<string, unknown>) : {}),
      name: d.name.trim(),
      kind: d.kind,
      description: d.description.trim() || undefined
    } as unknown as KnowledgeSource;

    // Clear all known parameter bags, then add the one for the current kind.
    delete (out as unknown as Record<string, unknown>).searchIndexParameters;
    delete (out as unknown as Record<string, unknown>).azureBlobParameters;
    delete (out as unknown as Record<string, unknown>).indexedOneLakeParameters;
    delete (out as unknown as Record<string, unknown>).indexedSharePointParameters;
    delete (out as unknown as Record<string, unknown>).remoteSharePointParameters;
    delete (out as unknown as Record<string, unknown>).webParameters;

    const kind = String(d.kind || KNOWLEDGE_SOURCE_DISCRIMINATOR);
    if (kind === 'searchIndex') {
      const existing = selected && isPlainObject(selected.searchIndexParameters) ? selected.searchIndexParameters : {};
      out.searchIndexParameters = {
        ...(existing as Record<string, unknown>),
        searchIndexName: d.searchIndexParameters.searchIndexName.trim(),
        semanticConfigurationName: d.searchIndexParameters.semanticConfigurationName.trim() || undefined,
        searchFields: d.searchIndexParameters.searchFields
          .filter((x) => String(x.name || '').trim())
          .map((x) => ({ name: String(x.name).trim() })),
        sourceDataFields: d.searchIndexParameters.sourceDataFields
          .filter((x) => String(x.name || '').trim())
          .map((x) => ({ name: String(x.name).trim() }))
      };
    } else if (kind === 'azureBlob') {
      const existing = selected && isPlainObject(selected.azureBlobParameters) ? selected.azureBlobParameters : {};
      out.azureBlobParameters = {
        ...(existing as Record<string, unknown>),
        connectionString: d.azureBlobParameters.connectionString.trim(),
        containerName: d.azureBlobParameters.containerName.trim(),
        folderPath: d.azureBlobParameters.folderPath.trim() || undefined,
        isADLSGen2: !!d.azureBlobParameters.isADLSGen2
      };
    } else if (kind === 'indexedOneLake') {
      const existing = selected && isPlainObject(selected.indexedOneLakeParameters) ? selected.indexedOneLakeParameters : {};
      out.indexedOneLakeParameters = {
        ...(existing as Record<string, unknown>),
        fabricWorkspaceId: d.indexedOneLakeParameters.fabricWorkspaceId.trim(),
        lakehouseId: d.indexedOneLakeParameters.lakehouseId.trim(),
        targetPath: d.indexedOneLakeParameters.targetPath.trim() || undefined
      };
    } else if (kind === 'indexedSharePoint') {
      const existing = selected && isPlainObject(selected.indexedSharePointParameters) ? selected.indexedSharePointParameters : {};
      out.indexedSharePointParameters = {
        ...(existing as Record<string, unknown>),
        connectionString: d.indexedSharePointParameters.connectionString.trim(),
        containerName: d.indexedSharePointParameters.containerName.trim(),
        query: d.indexedSharePointParameters.query.trim() || undefined
      };
    } else if (kind === 'remoteSharePoint') {
      const existing = selected && isPlainObject(selected.remoteSharePointParameters) ? selected.remoteSharePointParameters : {};
      out.remoteSharePointParameters = {
        ...(existing as Record<string, unknown>),
        containerTypeId: d.remoteSharePointParameters.containerTypeId.trim() || undefined,
        filterExpression: d.remoteSharePointParameters.filterExpression.trim() || undefined,
        resourceMetadata: d.remoteSharePointParameters.resourceMetadata.map((x) => String(x ?? '').trim()).filter(Boolean)
      };
    } else if (kind === 'web') {
      const existing = selected && isPlainObject(selected.webParameters) ? selected.webParameters : {};
      out.webParameters = {
        ...(existing as Record<string, unknown>),
        domains: {
          allowedDomains: d.webParameters.allowedDomains
            .map((x) => ({ address: String(x.address ?? '').trim(), includeSubpages: !!x.includeSubpages }))
            .filter((x) => !!x.address),
          blockedDomains: d.webParameters.blockedDomains
            .map((x) => ({ address: String(x.address ?? '').trim(), includeSubpages: !!x.includeSubpages }))
            .filter((x) => !!x.address)
        }
      };
    }

    const ek = buildEncryptionKey(d.encryption);
    if (ek) out.encryptionKey = ek;
    else delete (out as unknown as Record<string, unknown>).encryptionKey;

    return out;
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
      await knowledgeSourcesService.upsertKnowledgeSource(activeConnectionId, payload);
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
    if (!confirm(`Delete knowledge source '${name}'?`)) return;

    try {
      await knowledgeSourcesService.deleteKnowledgeSource(activeConnectionId, name);
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
      throw new Error("Cannot change 'name' when editing an existing knowledge source.");
    }

    await knowledgeSourcesService.upsertKnowledgeSource(activeConnectionId, nextValue as unknown as KnowledgeSource);
    setIsModalOpen(false);
    await fetchItems();
  };

  const indexOptions = useMemo(() => {
    return indexes.map((x) => ({ value: x.name, description: x.description }));
  }, [indexes]);

  const semanticConfigOptions = useMemo(() => {
    const configs = selectedIndex?.semanticSearch?.configurations;
    if (!Array.isArray(configs)) return [];
    const values = configs
      .map((x) => (isPlainObject(x) ? String(x.name ?? '').trim() : String((x as unknown as { name?: unknown })?.name ?? '').trim()))
      .filter((x) => !!x);
    return values.map((v) => ({ value: v }));
  }, [selectedIndex]);

  const fieldOptions = useMemo(() => {
    const fields = Array.isArray(selectedIndex?.fields) ? selectedIndex?.fields : [];
    return fields
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((f) => ({ value: String(f.name || ''), description: fieldDescription(f) }));
  }, [selectedIndex]);

  const setFieldRef = (key: 'searchFields' | 'sourceDataFields', index: number, value: string) => {
    setDraft((prev) => {
      const arr = [...prev.searchIndexParameters[key]];
      arr[index] = { name: value };
      return { ...prev, searchIndexParameters: { ...prev.searchIndexParameters, [key]: arr } };
    });
  };

  const addFieldRef = (key: 'searchFields' | 'sourceDataFields') => {
    setDraft((prev) => {
      const arr = [...prev.searchIndexParameters[key], { name: '' }];
      return { ...prev, searchIndexParameters: { ...prev.searchIndexParameters, [key]: arr } };
    });
  };

  const removeFieldRef = (key: 'searchFields' | 'sourceDataFields', index: number) => {
    setDraft((prev) => {
      const arr = prev.searchIndexParameters[key].filter((_, i) => i !== index);
      return { ...prev, searchIndexParameters: { ...prev.searchIndexParameters, [key]: arr } };
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.actions}>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus"></i> Create Knowledge Source
        </Button>
        <Button onClick={() => void fetchItems()} disabled={loading}>
          <i className="fas fa-sync"></i> Refresh
        </Button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentTypeDesc || entityDesc ? (
              <span style={{ color: 'var(--text-color)', opacity: 0.75, fontSize: '12px' }}>
                {currentTypeDesc ? currentTypeDesc : 'Knowledge sources'} {entityDesc ? <InfoIcon tooltip={entityDesc} /> : null}
              </span>
            ) : null}
          <Input
            placeholder="Filter knowledge sources..."
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
                <th style={{ padding: '8px 16px' }}>Kind</th>
                <th style={{ padding: '8px 16px' }}>Primary</th>
                <th style={{ padding: '8px 16px' }}>Details</th>
                <th style={{ padding: '8px 16px' }}>Encryption</th>
                <th style={{ padding: '8px 16px', width: '190px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    No knowledge sources found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => {
                  const kind = String(it.kind ?? '').trim() || KNOWLEDGE_SOURCE_DISCRIMINATOR;
                  const encryptionOn = it.encryptionKey != null;

                  let primary = '';
                  let details = '';

                  if (kind === 'searchIndex') {
                    const p = it.searchIndexParameters;
                    const rec = isPlainObject(p) ? p : null;
                    const indexName = rec ? getString(rec, 'searchIndexName') : '';
                    const semantic = rec ? getString(rec, 'semanticConfigurationName') : '';
                    const searchFields = rec ? getFieldRefArray(rec, 'searchFields') : [];
                    const sourceFields = rec ? getFieldRefArray(rec, 'sourceDataFields') : [];
                    primary = indexName;
                    details = `${semantic ? `semantic:${semantic} • ` : ''}fields search:${searchFields.length} source:${sourceFields.length}`;
                  } else if (kind === 'azureBlob') {
                    const p = it.azureBlobParameters;
                    const rec = isPlainObject(p) ? p : null;
                    primary = rec ? getString(rec, 'containerName') : '';
                    const folder = rec ? getString(rec, 'folderPath') : '';
                    const gen2 = rec ? rec.isADLSGen2 === true : false;
                    details = `${folder ? `path:${folder} • ` : ''}adlsGen2:${gen2 ? 'yes' : 'no'}`;
                  } else if (kind === 'indexedOneLake') {
                    const p = it.indexedOneLakeParameters;
                    const rec = isPlainObject(p) ? p : null;
                    primary = rec ? getString(rec, 'lakehouseId') : '';
                    const ws = rec ? getString(rec, 'fabricWorkspaceId') : '';
                    const target = rec ? getString(rec, 'targetPath') : '';
                    details = `${ws ? `ws:${ws} • ` : ''}${target ? `path:${target}` : ''}`.trim();
                  } else if (kind === 'indexedSharePoint') {
                    const p = it.indexedSharePointParameters;
                    const rec = isPlainObject(p) ? p : null;
                    primary = rec ? getString(rec, 'containerName') : '';
                    const query = rec ? getString(rec, 'query') : '';
                    details = query ? `query:${query}` : '';
                  } else if (kind === 'remoteSharePoint') {
                    const p = it.remoteSharePointParameters;
                    const rec = isPlainObject(p) ? p : null;
                    primary = rec ? getString(rec, 'containerTypeId') : '';
                    const filterExp = rec ? getString(rec, 'filterExpression') : '';
                    const meta = rec ? getStringArray(rec, 'resourceMetadata') : [];
                    details = `${filterExp ? `filter:${filterExp} • ` : ''}meta:${meta.length}`;
                  } else if (kind === 'web') {
                    const p = it.webParameters;
                    const rec = isPlainObject(p) ? p : null;
                    const domainsRaw = rec ? rec.domains : null;
                    const domains = isPlainObject(domainsRaw) ? domainsRaw : null;
                    const allowedRaw = domains ? domains.allowedDomains : null;
                    const blockedRaw = domains ? domains.blockedDomains : null;
                    const allowed = Array.isArray(allowedRaw) ? allowedRaw : [];
                    const blocked = Array.isArray(blockedRaw) ? blockedRaw : [];
                    details = `allowed:${allowed.length} blocked:${blocked.length}`;
                  }

                  return (
                    <tr key={it.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 16px', color: 'var(--accent-color)' }}>
                        <i className="fa-solid fa-database" style={{ marginRight: '8px', opacity: 0.7 }}></i>
                        {it.name}
                      </td>
                      <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{kind}</td>
                      <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{primary}</td>
                      <td
                        style={{
                          padding: '8px 16px',
                          fontSize: '12px',
                          opacity: 0.85,
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 480,
                        }}
                        title={details}
                      >
                        {details}
                      </td>
                      <td style={{ padding: '8px 16px', fontSize: '12px', opacity: 0.85 }}>{encryptionOn ? 'Yes' : 'No'}</td>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selected ? `Edit Knowledge Source: ${selected.name}` : 'Create Knowledge Source'}
        width="860px"
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
            <Input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. ks-products"
              disabled={!!selected}
            />
            {errors.name && <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.name}</div>}
          </div>

          <div>
            <div className={styles.fieldLabel}>
              <span>Kind</span>
              {tips.kind && <InfoIcon tooltip={tips.kind} />}
            </div>
            <SelectWithDescription
              value={draft.kind}
              options={kindOptions}
              onChange={(e) => {
                const next = e.target.value as KnowledgeSourceKind;
                setDraft((p) => ({ ...p, kind: next }));
                setErrors({});
              }}
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
              placeholder="Optional"
              rows={3}
            />
          </div>

          <div className={styles.fullRow}>
            <div className={styles.sectionTitle}>
              Parameters {tips.parameters && <InfoIcon tooltip={tips.parameters} />}
            </div>
          </div>

          {draft.kind === 'searchIndex' ? (
            <>
              <div>
                <div className={styles.fieldLabel}>
                  <span>Search Index Name</span>
                  {getParamTip('searchIndexName') && <InfoIcon tooltip={String(getParamTip('searchIndexName'))} />}
                </div>
                <SelectWithDescription
                  value={draft.searchIndexParameters.searchIndexName}
                  options={[{ value: '', label: '(select index)' }, ...indexOptions]}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDraft((p) => ({
                      ...p,
                      searchIndexParameters: {
                        ...p.searchIndexParameters,
                        searchIndexName: next,
                        searchFields: next !== p.searchIndexParameters.searchIndexName ? [] : p.searchIndexParameters.searchFields,
                        sourceDataFields: next !== p.searchIndexParameters.searchIndexName ? [] : p.searchIndexParameters.sourceDataFields,
                        semanticConfigurationName: next !== p.searchIndexParameters.searchIndexName ? '' : p.searchIndexParameters.semanticConfigurationName
                      }
                    }));
                  }}
                  disabled={indexes.length === 0}
                />
                {errors.searchIndexName && (
                  <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.searchIndexName}</div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>Semantic Configuration Name</span>
                  {getParamTip('semanticConfigurationName') && <InfoIcon tooltip={String(getParamTip('semanticConfigurationName'))} />}
                </div>
                {semanticConfigOptions.length > 0 ? (
                  <SelectWithDescription
                    value={draft.searchIndexParameters.semanticConfigurationName}
                    options={[{ value: '', label: '(none)' }, ...semanticConfigOptions]}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        searchIndexParameters: { ...p.searchIndexParameters, semanticConfigurationName: e.target.value }
                      }))
                    }
                  />
                ) : (
                  <Input
                    value={draft.searchIndexParameters.semanticConfigurationName}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        searchIndexParameters: { ...p.searchIndexParameters, semanticConfigurationName: e.target.value }
                      }))
                    }
                    placeholder="Optional"
                  />
                )}
              </div>

              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Search Fields</span>
                  {getParamTip('searchFields') && <InfoIcon tooltip={String(getParamTip('searchFields'))} />}
                </div>
                {draft.searchIndexParameters.searchFields.map((f, i) => (
                  <div key={i} className={styles.arrayRow}>
                    {fieldOptions.length > 0 ? (
                      <SelectWithDescription
                        value={String(f.name || '')}
                        options={[{ value: '', label: '(select field)' }, ...fieldOptions]}
                        onChange={(e) => setFieldRef('searchFields', i, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <Input
                        value={String(f.name || '')}
                        onChange={(e) => setFieldRef('searchFields', i, e.target.value)}
                        placeholder="Field name"
                        style={{ flex: 1 }}
                      />
                    )}
                    <Button variant="secondary" onClick={() => removeFieldRef('searchFields', i)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" onClick={() => addFieldRef('searchFields')}>
                  + Add Search Field
                </Button>
              </div>

              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Source Data Fields</span>
                  {getParamTip('sourceDataFields') && <InfoIcon tooltip={String(getParamTip('sourceDataFields'))} />}
                </div>
                {draft.searchIndexParameters.sourceDataFields.map((f, i) => (
                  <div key={i} className={styles.arrayRow}>
                    {fieldOptions.length > 0 ? (
                      <SelectWithDescription
                        value={String(f.name || '')}
                        options={[{ value: '', label: '(select field)' }, ...fieldOptions]}
                        onChange={(e) => setFieldRef('sourceDataFields', i, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <Input
                        value={String(f.name || '')}
                        onChange={(e) => setFieldRef('sourceDataFields', i, e.target.value)}
                        placeholder="Field name"
                        style={{ flex: 1 }}
                      />
                    )}
                    <Button variant="secondary" onClick={() => removeFieldRef('sourceDataFields', i)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" onClick={() => addFieldRef('sourceDataFields')}>
                  + Add Source Data Field
                </Button>
              </div>
            </>
          ) : null}

          {draft.kind === 'azureBlob' ? (
            <>
              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Connection String</span>
                  {getParamTip('connectionString') && <InfoIcon tooltip={String(getParamTip('connectionString'))} />}
                </div>
                <Input
                  value={draft.azureBlobParameters.connectionString}
                  onChange={(e) => setDraft((p) => ({ ...p, azureBlobParameters: { ...p.azureBlobParameters, connectionString: e.target.value } }))}
                  placeholder="DefaultEndpointsProtocol=..."
                />
                {errors.azureBlob_connectionString && (
                  <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.azureBlob_connectionString}</div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>Container Name</span>
                  {getParamTip('containerName') && <InfoIcon tooltip={String(getParamTip('containerName'))} />}
                </div>
                <Input
                  value={draft.azureBlobParameters.containerName}
                  onChange={(e) => setDraft((p) => ({ ...p, azureBlobParameters: { ...p.azureBlobParameters, containerName: e.target.value } }))}
                  placeholder="my-container"
                />
                {errors.azureBlob_containerName && (
                  <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.azureBlob_containerName}</div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>Folder Path</span>
                  {getParamTip('folderPath') && <InfoIcon tooltip={String(getParamTip('folderPath'))} />}
                </div>
                <Input
                  value={draft.azureBlobParameters.folderPath}
                  onChange={(e) => setDraft((p) => ({ ...p, azureBlobParameters: { ...p.azureBlobParameters, folderPath: e.target.value } }))}
                  placeholder="Optional"
                />
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>ADLS Gen2</span>
                  {getParamTip('isADLSGen2') && <InfoIcon tooltip={String(getParamTip('isADLSGen2'))} />}
                </div>
                <Select
                  value={draft.azureBlobParameters.isADLSGen2 ? 'true' : 'false'}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      azureBlobParameters: { ...p.azureBlobParameters, isADLSGen2: e.target.value === 'true' }
                    }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
              </div>
            </>
          ) : null}

          {draft.kind === 'indexedOneLake' ? (
            <>
              <div>
                <div className={styles.fieldLabel}>
                  <span>Fabric Workspace ID</span>
                  {getParamTip('fabricWorkspaceId') && <InfoIcon tooltip={String(getParamTip('fabricWorkspaceId'))} />}
                </div>
                <Input
                  value={draft.indexedOneLakeParameters.fabricWorkspaceId}
                  onChange={(e) => setDraft((p) => ({ ...p, indexedOneLakeParameters: { ...p.indexedOneLakeParameters, fabricWorkspaceId: e.target.value } }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                {errors.indexedOneLake_fabricWorkspaceId && (
                  <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.indexedOneLake_fabricWorkspaceId}</div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>Lakehouse ID</span>
                  {getParamTip('lakehouseId') && <InfoIcon tooltip={String(getParamTip('lakehouseId'))} />}
                </div>
                <Input
                  value={draft.indexedOneLakeParameters.lakehouseId}
                  onChange={(e) => setDraft((p) => ({ ...p, indexedOneLakeParameters: { ...p.indexedOneLakeParameters, lakehouseId: e.target.value } }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                {errors.indexedOneLake_lakehouseId && (
                  <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.indexedOneLake_lakehouseId}</div>
                )}
              </div>

              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Target Path</span>
                  {getParamTip('targetPath') && <InfoIcon tooltip={String(getParamTip('targetPath'))} />}
                </div>
                <Input
                  value={draft.indexedOneLakeParameters.targetPath}
                  onChange={(e) => setDraft((p) => ({ ...p, indexedOneLakeParameters: { ...p.indexedOneLakeParameters, targetPath: e.target.value } }))}
                  placeholder="Optional"
                />
              </div>
            </>
          ) : null}

          {draft.kind === 'indexedSharePoint' ? (
            <>
              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Connection String</span>
                  {getParamTip('connectionString') && <InfoIcon tooltip={String(getParamTip('connectionString'))} />}
                </div>
                <Input
                  value={draft.indexedSharePointParameters.connectionString}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      indexedSharePointParameters: { ...p.indexedSharePointParameters, connectionString: e.target.value }
                    }))
                  }
                  placeholder="SharePointOnlineEndpoint=..."
                />
                {errors.indexedSharePoint_connectionString && (
                  <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.indexedSharePoint_connectionString}</div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>Container Name</span>
                  {getParamTip('containerName') && <InfoIcon tooltip={String(getParamTip('containerName'))} />}
                </div>
                <SelectWithDescription
                  value={draft.indexedSharePointParameters.containerName}
                  options={indexedSharePointContainerOptions.length > 0 ? indexedSharePointContainerOptions : ['defaultSiteLibrary', 'allSiteLibraries', 'useQuery']}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      indexedSharePointParameters: { ...p.indexedSharePointParameters, containerName: e.target.value }
                    }))
                  }
                />
                {errors.indexedSharePoint_containerName && (
                  <div style={{ color: 'var(--error-color)', marginTop: 6, fontSize: 12 }}>{errors.indexedSharePoint_containerName}</div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>Query</span>
                  {getParamTip('query') && <InfoIcon tooltip={String(getParamTip('query'))} />}
                </div>
                <Input
                  value={draft.indexedSharePointParameters.query}
                  onChange={(e) => setDraft((p) => ({ ...p, indexedSharePointParameters: { ...p.indexedSharePointParameters, query: e.target.value } }))}
                  placeholder="Optional"
                />
              </div>
            </>
          ) : null}

          {draft.kind === 'remoteSharePoint' ? (
            <>
              <div>
                <div className={styles.fieldLabel}>
                  <span>Container Type ID</span>
                  {getParamTip('containerTypeId') && <InfoIcon tooltip={String(getParamTip('containerTypeId'))} />}
                </div>
                <Input
                  value={draft.remoteSharePointParameters.containerTypeId}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      remoteSharePointParameters: { ...p.remoteSharePointParameters, containerTypeId: e.target.value }
                    }))
                  }
                  placeholder="Optional"
                />
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  <span>Filter Expression</span>
                  {getParamTip('filterExpression') && <InfoIcon tooltip={String(getParamTip('filterExpression'))} />}
                </div>
                <Input
                  value={draft.remoteSharePointParameters.filterExpression}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      remoteSharePointParameters: { ...p.remoteSharePointParameters, filterExpression: e.target.value }
                    }))
                  }
                  placeholder="Optional KQL"
                />
              </div>

              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Resource Metadata</span>
                  {getParamTip('resourceMetadata') && <InfoIcon tooltip={String(getParamTip('resourceMetadata'))} />}
                </div>
                {draft.remoteSharePointParameters.resourceMetadata.map((v, i) => (
                  <div key={i} className={styles.arrayRow}>
                    <Input
                      value={v}
                      onChange={(e) =>
                        setDraft((p) => {
                          const next = [...p.remoteSharePointParameters.resourceMetadata];
                          next[i] = e.target.value;
                          return { ...p, remoteSharePointParameters: { ...p.remoteSharePointParameters, resourceMetadata: next } };
                        })
                      }
                      placeholder="metadataField"
                      style={{ flex: 1 }}
                    />
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setDraft((p) => {
                          const next = p.remoteSharePointParameters.resourceMetadata.filter((_, idx) => idx !== i);
                          return { ...p, remoteSharePointParameters: { ...p.remoteSharePointParameters, resourceMetadata: next } };
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      remoteSharePointParameters: {
                        ...p.remoteSharePointParameters,
                        resourceMetadata: [...p.remoteSharePointParameters.resourceMetadata, '']
                      }
                    }))
                  }
                >
                  + Add Metadata Field
                </Button>
              </div>
            </>
          ) : null}

          {draft.kind === 'web' ? (
            <>
              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Allowed Domains</span>
                </div>
                {draft.webParameters.allowedDomains.map((d, i) => (
                  <div key={i} className={styles.arrayRow}>
                    <Input
                      value={d.address}
                      onChange={(e) =>
                        setDraft((p) => {
                          const next = [...p.webParameters.allowedDomains];
                          next[i] = { ...next[i], address: e.target.value };
                          return { ...p, webParameters: { ...p.webParameters, allowedDomains: next } };
                        })
                      }
                      placeholder="example.com"
                      style={{ flex: 1 }}
                    />
                    <Select
                      value={d.includeSubpages ? 'true' : 'false'}
                      onChange={(e) =>
                        setDraft((p) => {
                          const next = [...p.webParameters.allowedDomains];
                          next[i] = { ...next[i], includeSubpages: e.target.value === 'true' };
                          return { ...p, webParameters: { ...p.webParameters, allowedDomains: next } };
                        })
                      }
                      style={{ width: 160 }}
                    >
                      <option value="false">Exact</option>
                      <option value="true">Include subpages</option>
                    </Select>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setDraft((p) => {
                          const next = p.webParameters.allowedDomains.filter((_, idx) => idx !== i);
                          return { ...p, webParameters: { ...p.webParameters, allowedDomains: next } };
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      webParameters: {
                        ...p.webParameters,
                        allowedDomains: [...p.webParameters.allowedDomains, { address: '', includeSubpages: false }]
                      }
                    }))
                  }
                >
                  + Add Allowed Domain
                </Button>
              </div>

              <div className={styles.fullRow}>
                <div className={styles.fieldLabel}>
                  <span>Blocked Domains</span>
                </div>
                {draft.webParameters.blockedDomains.map((d, i) => (
                  <div key={i} className={styles.arrayRow}>
                    <Input
                      value={d.address}
                      onChange={(e) =>
                        setDraft((p) => {
                          const next = [...p.webParameters.blockedDomains];
                          next[i] = { ...next[i], address: e.target.value };
                          return { ...p, webParameters: { ...p.webParameters, blockedDomains: next } };
                        })
                      }
                      placeholder="example.com"
                      style={{ flex: 1 }}
                    />
                    <Select
                      value={d.includeSubpages ? 'true' : 'false'}
                      onChange={(e) =>
                        setDraft((p) => {
                          const next = [...p.webParameters.blockedDomains];
                          next[i] = { ...next[i], includeSubpages: e.target.value === 'true' };
                          return { ...p, webParameters: { ...p.webParameters, blockedDomains: next } };
                        })
                      }
                      style={{ width: 160 }}
                    >
                      <option value="false">Exact</option>
                      <option value="true">Include subpages</option>
                    </Select>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setDraft((p) => {
                          const next = p.webParameters.blockedDomains.filter((_, idx) => idx !== i);
                          return { ...p, webParameters: { ...p.webParameters, blockedDomains: next } };
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      webParameters: {
                        ...p.webParameters,
                        blockedDomains: [...p.webParameters.blockedDomains, { address: '', includeSubpages: false }]
                      }
                    }))
                  }
                >
                  + Add Blocked Domain
                </Button>
              </div>
            </>
          ) : null}

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
                      {getIdTip('userAssignedIdentity') && <InfoIcon tooltip={String(getIdTip('userAssignedIdentity'))} />}
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
        title="Knowledge Source JSON"
        value={jsonPayload}
        onSave={saveJson}
      />
    </div>
  );
};

export default KnowledgeSourcesPage;
