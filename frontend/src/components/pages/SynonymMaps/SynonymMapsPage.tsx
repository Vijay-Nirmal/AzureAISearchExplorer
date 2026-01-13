import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { synonymMapsService } from '../../../services/synonymMapsService';
import type { SynonymMap } from '../../../types/SynonymMapModels';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Modal } from '../../common/Modal';
import { Select } from '../../common/Select';
import { TextArea } from '../../common/TextArea';
import { InfoIcon } from '../../common/InfoIcon';
import {
  getFieldTooltipFromSchema,
  getResolvedFieldDefinition,
  getResolvedFieldOptions,
  getTypeDescriptionFromSchema,
  resolveConfigRef
} from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../common/configDriven/configDrivenTypes';
import { SYNONYM_MAP_DISCRIMINATOR, synonymMapSchema } from './synonymMapTooltips';
import styles from './SynonymMapsPage.module.css';

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
  format: string;
  synonyms: string;
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

const SynonymMapsPage: React.FC = () => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();
  const [items, setItems] = useState<SynonymMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<SynonymMap | null>(null);
  const [draft, setDraft] = useState<Draft>(() => ({
    name: 'sm-new',
    format: 'solr',
    synonyms: '',
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setBreadcrumbs([{ label: 'Synonym Maps' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const typeDesc = useMemo(() => getTypeDescriptionFromSchema(synonymMapSchema, SYNONYM_MAP_DISCRIMINATOR), []);
  const nameTooltip = useMemo(() => getFieldTooltipFromSchema(synonymMapSchema, SYNONYM_MAP_DISCRIMINATOR, 'name'), []);
  const formatTooltip = useMemo(() => getFieldTooltipFromSchema(synonymMapSchema, SYNONYM_MAP_DISCRIMINATOR, 'format'), []);
  const synonymsTooltip = useMemo(() => getFieldTooltipFromSchema(synonymMapSchema, SYNONYM_MAP_DISCRIMINATOR, 'synonyms'), []);
  const encryptionTooltip = useMemo(() => getFieldTooltipFromSchema(synonymMapSchema, SYNONYM_MAP_DISCRIMINATOR, 'encryptionKey'), []);

  const formatOptions = useMemo(() => {
    const def = getResolvedFieldDefinition(synonymMapSchema, SYNONYM_MAP_DISCRIMINATOR, 'format');
    if (!def) return [];
    return getResolvedFieldOptions(def);
  }, []);

  const encryptionTypeDef = useMemo(() => {
    return resolveConfigRef<ConfigDrivenTypeDefinition>('Common/EncryptionKey/types/SearchResourceEncryptionKey.json');
  }, []);

  const encryptionSchema = useMemo(() => {
    return encryptionTypeDef ? buildTypeOnlySchema(encryptionTypeDef) : null;
  }, [encryptionTypeDef]);

  const identitySchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('Common/DataIdentity/dataIdentityConfig.json');
  }, []);

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
      // Data identity discriminator values in config are the @odata.type values.
      return getFieldTooltipFromSchema(identitySchema, draft.encryption.identityType, key);
    },
    [draft.encryption.identityType, identitySchema]
  );

  const fetchSynonymMaps = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const data = await synonymMapsService.listSynonymMaps(activeConnectionId);
      setItems(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeConnectionId]);

  useEffect(() => {
    void fetchSynonymMaps();
  }, [fetchSynonymMaps]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((x) => String(x.name || '').toLowerCase().includes(f));
  }, [filter, items]);

  const openCreate = () => {
    setSelected(null);
    setDraft({
      name: 'sm-new',
      format: 'solr',
      synonyms: '',
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

  const openEdit = (it: SynonymMap) => {
    const ek = (it.encryptionKey || undefined) as any;
    const identity = ek?.identity as any;

    setSelected(it);
    setDraft({
      name: String(it.name || ''),
      format: String(it.format || 'solr'),
      synonyms: String(it.synonyms || ''),
      encryption: {
        enabled: !!it.encryptionKey,
        keyVaultUri: String(ek?.keyVaultUri || ''),
        keyVaultKeyName: String(ek?.keyVaultKeyName || ''),
        keyVaultKeyVersion: String(ek?.keyVaultKeyVersion || ''),
        applicationId: String(ek?.accessCredentials?.applicationId || ''),
        applicationSecret: String(ek?.accessCredentials?.applicationSecret || ''),
        identityType: String(identity?.['@odata.type'] || '#Microsoft.Azure.Search.DataNoneIdentity'),
        userAssignedIdentity: String(identity?.userAssignedIdentity || '')
      }
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = (d: Draft): Record<string, string> => {
    const next: Record<string, string> = {};
    const name = (d.name || '').trim();
    const synonyms = (d.synonyms || '').trim();

    if (!name) next.name = 'Name is required.';
    else if (name.length > 128) next.name = 'Must be 128 characters or less.';
    else if (!namePattern.test(name)) next.name = 'Only letters, digits, spaces, dashes or underscores; must start and end with alphanumeric.';

    if (!synonyms) next.synonyms = 'Synonyms are required.';

    if (d.encryption.enabled) {
      if (!d.encryption.keyVaultUri.trim()) next.keyVaultUri = 'Key Vault URI is required when encryption is enabled.';
      if (!d.encryption.keyVaultKeyName.trim()) next.keyVaultKeyName = 'Key name is required when encryption is enabled.';
      // version can be empty
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

  const save = async () => {
    if (!activeConnectionId) return;
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const encryptionKey = buildEncryptionKey(draft.encryption);
    const payload: SynonymMap = {
      name: draft.name.trim(),
      format: draft.format.trim() || 'solr',
      synonyms: draft.synonyms,
      ...(encryptionKey ? { encryptionKey } : {})
    };

    setIsSaving(true);
    try {
      await synonymMapsService.createOrUpdateSynonymMap(activeConnectionId, payload);
      setIsModalOpen(false);
      await fetchSynonymMaps();
    } catch (e) {
      console.error(e);
      setErrors({ form: e instanceof Error ? e.message : 'Failed to save synonym map.' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSynonymMap = async (name: string) => {
    if (!activeConnectionId) return;
    if (!confirm(`Delete synonym map "${name}"?`)) return;
    try {
      await synonymMapsService.deleteSynonymMap(activeConnectionId, name);
      await fetchSynonymMaps();
    } catch (e) {
      console.error(e);
    }
  };

  const synopsis = (s: string) => {
    const t = String(s || '').trim();
    if (!t) return '-';
    const lines = t.split(/\r?\n/).filter((x) => x.trim()).length;
    return `${lines} rule${lines === 1 ? '' : 's'}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.actions}>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus"></i> Create Synonym Map
        </Button>
        <Button onClick={fetchSynonymMaps}>
          <i className="fas fa-sync"></i> Refresh
        </Button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {typeDesc ? (
            <span style={{ color: 'var(--text-color)', opacity: 0.75, fontSize: '12px' }}>{typeDesc}</span>
          ) : null}
          <Input
            placeholder="Filter synonym maps..."
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
                <th style={{ padding: '8px 16px' }}>Format</th>
                <th style={{ padding: '8px 16px' }}>Synonyms</th>
                <th style={{ padding: '8px 16px' }}>Encrypted</th>
                <th style={{ padding: '8px 16px', width: '190px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    No synonym maps found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 16px', color: 'var(--accent-color)' }}>
                      <i className="fa-solid fa-language" style={{ marginRight: '8px', opacity: 0.7 }}></i>
                      {it.name}
                    </td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{String(it.format || 'solr')}</td>
                    <td style={{ padding: '8px 16px' }}>{synopsis(String(it.synonyms || ''))}</td>
                    <td style={{ padding: '8px 16px' }}>{it.encryptionKey ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" onClick={() => openEdit(it)}>
                          Edit
                        </Button>
                        <Button onClick={() => deleteSynonymMap(String(it.name))}>Delete</Button>
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
        title={selected ? `Edit Synonym Map: ${selected.name}` : 'Create Synonym Map'}
        width="980px"
        footer={
          <>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={isSaving}>
              <i className="fas fa-save"></i> {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        {errors.form ? <div className={styles.error}>{errors.form}</div> : null}

        <div className={styles.modalGrid}>
          <div className={styles.label}>
            Name
            {nameTooltip ? <InfoIcon tooltip={nameTooltip} /> : null}
          </div>
          <div className={styles.field}>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. sm-products"
            />
            {errors.name ? <div className={styles.error}>{errors.name}</div> : null}
          </div>

          <div className={styles.label}>
            Format
            {formatTooltip ? <InfoIcon tooltip={formatTooltip} /> : null}
          </div>
          <div className={styles.field}>
            <Select value={draft.format} onChange={(e) => setDraft((p) => ({ ...p, format: e.target.value }))}>
              {(formatOptions.length > 0 ? formatOptions : [{ value: 'solr', description: 'Solr synonym format.' }]).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                  {o.description ? ` — ${o.description}` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.label}>
            Synonyms
            {synonymsTooltip ? <InfoIcon tooltip={synonymsTooltip} /> : null}
          </div>
          <div className={styles.field}>
            <TextArea
              value={draft.synonyms}
              onChange={(e) => setDraft((p) => ({ ...p, synonyms: e.target.value }))}
              placeholder="e.g.\ncar, automobile\nnyc => new york"
              rows={12}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
            {errors.synonyms ? <div className={styles.error}>{errors.synonyms}</div> : null}
            <div className={styles.hint}>One rule per line. Supports Solr synonym syntax.</div>
          </div>

          <div className={styles.sectionTitle}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Encryption (optional)
              {encryptionTooltip ? <InfoIcon tooltip={encryptionTooltip} /> : null}
            </span>
          </div>

          <div className={styles.label}>Enable</div>
          <div className={styles.field}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={draft.encryption.enabled}
                onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, enabled: e.target.checked } }))}
              />
              Use customer-managed key (Key Vault)
            </label>
          </div>

          {draft.encryption.enabled ? (
            <>
              <div className={styles.label}>
                Key Vault URI
                {getEncTip('keyVaultUri') ? <InfoIcon tooltip={getEncTip('keyVaultUri')!} /> : null}
              </div>
              <div className={styles.field}>
                <Input
                  value={draft.encryption.keyVaultUri}
                  onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, keyVaultUri: e.target.value } }))}
                  placeholder="https://my-keyvault.vault.azure.net"
                />
                {errors.keyVaultUri ? <div className={styles.error}>{errors.keyVaultUri}</div> : null}
              </div>

              <div className={styles.label}>
                Key Name
                {getEncTip('keyVaultKeyName') ? <InfoIcon tooltip={getEncTip('keyVaultKeyName')!} /> : null}
              </div>
              <div className={styles.field}>
                <Input
                  value={draft.encryption.keyVaultKeyName}
                  onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, keyVaultKeyName: e.target.value } }))}
                  placeholder="my-key"
                />
                {errors.keyVaultKeyName ? <div className={styles.error}>{errors.keyVaultKeyName}</div> : null}
              </div>

              <div className={styles.label}>
                Key Version
                {getEncTip('keyVaultKeyVersion') ? <InfoIcon tooltip={getEncTip('keyVaultKeyVersion')!} /> : null}
              </div>
              <div className={styles.field}>
                <Input
                  value={draft.encryption.keyVaultKeyVersion}
                  onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, keyVaultKeyVersion: e.target.value } }))}
                  placeholder="(optional)"
                />
              </div>

              <div className={styles.label}>
                Identity Type
                {getIdTip('@odata.type') ? <InfoIcon tooltip={getIdTip('@odata.type')!} /> : null}
              </div>
              <div className={styles.field}>
                <Select
                  value={draft.encryption.identityType}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      encryption: { ...p.encryption, identityType: e.target.value, userAssignedIdentity: '' }
                    }))
                  }
                >
                  <option value="#Microsoft.Azure.Search.DataNoneIdentity">None (clear)</option>
                  <option value="#Microsoft.Azure.Search.DataUserAssignedIdentity">User-assigned managed identity</option>
                </Select>
              </div>

              {draft.encryption.identityType === '#Microsoft.Azure.Search.DataUserAssignedIdentity' ? (
                <>
                  <div className={styles.label}>
                    User Assigned Identity
                    {getIdTip('userAssignedIdentity') ? <InfoIcon tooltip={getIdTip('userAssignedIdentity')!} /> : null}
                  </div>
                  <div className={styles.field}>
                    <Input
                      value={draft.encryption.userAssignedIdentity}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, encryption: { ...p.encryption, userAssignedIdentity: e.target.value } }))
                      }
                      placeholder="/subscriptions/.../resourceGroups/.../providers/Microsoft.ManagedIdentity/userAssignedIdentities/..."
                    />
                    {errors.userAssignedIdentity ? <div className={styles.error}>{errors.userAssignedIdentity}</div> : null}
                  </div>
                </>
              ) : null}

              <div className={styles.label}>
                Application ID
                {getEncTip('accessCredentials.applicationId') ? <InfoIcon tooltip={getEncTip('accessCredentials.applicationId')!} /> : null}
              </div>
              <div className={styles.field}>
                <Input
                  value={draft.encryption.applicationId}
                  onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, applicationId: e.target.value } }))}
                  placeholder="(optional)"
                />
              </div>

              <div className={styles.label}>
                Application Secret
                {getEncTip('accessCredentials.applicationSecret') ? <InfoIcon tooltip={getEncTip('accessCredentials.applicationSecret')!} /> : null}
              </div>
              <div className={styles.field}>
                <Input
                  value={draft.encryption.applicationSecret}
                  onChange={(e) => setDraft((p) => ({ ...p, encryption: { ...p.encryption, applicationSecret: e.target.value } }))}
                  placeholder="(optional)"
                  type="password"
                />
              </div>
            </>
          ) : (
            <>
              <div className={styles.label}></div>
              <div className={styles.hint}>Leave disabled unless you specifically need CMK encryption.</div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SynonymMapsPage;
