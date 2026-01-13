import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { aliasesService } from '../../../services/aliasesService';
import { indexesService } from '../../../services/indexesService';
import type { SearchAlias } from '../../../types/AliasModels';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';
import { getFieldTooltipFromSchema, getTypeDescriptionFromSchema } from '../../common/configDriven/configDrivenUtils';
import { ALIAS_DISCRIMINATOR, aliasSchema } from './aliasTooltips';
import styles from './AliasesPage.module.css';

type Draft = {
  name: string;
  indexName: string;
};

const namePattern = new RegExp('^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9])?$');

const AliasesPage: React.FC = () => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();
  const [items, setItems] = useState<SearchAlias[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const [availableIndexes, setAvailableIndexes] = useState<Array<{ value: string; description?: string }>>([]);
  const [loadingIndexes, setLoadingIndexes] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<SearchAlias | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: 'new-alias', indexName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setBreadcrumbs([{ label: 'Aliases' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const typeDesc = useMemo(() => getTypeDescriptionFromSchema(aliasSchema, ALIAS_DISCRIMINATOR), []);
  const nameTooltip = useMemo(() => getFieldTooltipFromSchema(aliasSchema, ALIAS_DISCRIMINATOR, 'name'), []);
  const indexesTooltip = useMemo(() => getFieldTooltipFromSchema(aliasSchema, ALIAS_DISCRIMINATOR, 'indexes'), []);

  const fetchAliases = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const data = await aliasesService.listAliases(activeConnectionId);
      setItems(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeConnectionId]);

  const fetchIndexes = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoadingIndexes(true);
    try {
      const raw = await indexesService.listIndexes(activeConnectionId);
      const opts = (raw ?? [])
        .map((x: any) => {
          const name = String(x?.name ?? x?.Name ?? '').trim();
          if (!name) return null;
          const fieldsCount = Array.isArray(x?.Fields) ? x.Fields.length : Array.isArray(x?.fields) ? x.fields.length : null;
          const docCount = typeof x?.Stats?.documentCount === 'number' ? x.Stats.documentCount : typeof x?.stats?.documentCount === 'number' ? x.stats.documentCount : null;
          const descParts: string[] = [];
          if (typeof fieldsCount === 'number') descParts.push(`${fieldsCount} fields`);
          if (typeof docCount === 'number') descParts.push(`${docCount.toLocaleString()} docs`);
          return { value: name, description: descParts.join(' • ') || undefined };
        })
        .filter(Boolean) as Array<{ value: string; description?: string }>;

      opts.sort((a, b) => a.value.localeCompare(b.value));
      setAvailableIndexes(opts);
    } catch (e) {
      console.error(e);
      setAvailableIndexes([]);
    } finally {
      setLoadingIndexes(false);
    }
  }, [activeConnectionId]);

  useEffect(() => {
    void fetchAliases();
  }, [fetchAliases]);

  useEffect(() => {
    void fetchIndexes();
  }, [fetchIndexes]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((x) => String(x.name || '').toLowerCase().includes(f));
  }, [filter, items]);

  const openCreate = () => {
    setSelected(null);
    setDraft({ name: 'new-alias', indexName: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (it: SearchAlias) => {
    setSelected(it);
    setDraft({ name: String(it.name || ''), indexName: String((it.indexes && it.indexes[0]) || '') });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = (d: Draft): Record<string, string> => {
    const next: Record<string, string> = {};
    const name = (d.name || '').trim();
    const indexName = (d.indexName || '').trim();

    if (!name) next.name = 'Name is required.';
    else if (name.length > 128) next.name = 'Must be 128 characters or less.';
    else if (!namePattern.test(name)) next.name = 'Only letters, digits, spaces, dashes or underscores; must start and end with alphanumeric.';

    if (!indexName) next.indexes = 'Index name is required.';

    return next;
  };

  const save = async () => {
    if (!activeConnectionId) return;
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: SearchAlias = {
      name: draft.name.trim(),
      indexes: [draft.indexName.trim()]
    };

    setIsSaving(true);
    try {
      await aliasesService.createOrUpdateAlias(activeConnectionId, payload);
      setIsModalOpen(false);
      await fetchAliases();
    } catch (e) {
      console.error(e);
      setErrors({ form: e instanceof Error ? e.message : 'Failed to save alias.' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAlias = async (aliasName: string) => {
    if (!activeConnectionId) return;
    if (!confirm(`Delete alias "${aliasName}"?`)) return;
    try {
      await aliasesService.deleteAlias(activeConnectionId, aliasName);
      await fetchAliases();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.actions}>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus"></i> Create Alias
        </Button>
        <Button onClick={fetchAliases}>
          <i className="fas fa-sync"></i> Refresh
        </Button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {typeDesc ? (
            <span style={{ color: 'var(--text-color)', opacity: 0.75, fontSize: '12px' }}>{typeDesc}</span>
          ) : null}
          <Input
            placeholder="Filter aliases..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '220px' }}
          />
        </div>
      </div>

      <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflow: 'auto', flex: 1 }}>
          <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 16px' }}>Name</th>
                <th style={{ padding: '8px 16px' }}>Index</th>
                <th style={{ padding: '8px 16px', width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '16px', textAlign: 'center', opacity: 0.75 }}>
                    No aliases found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 16px', color: 'var(--accent-color)' }}>
                      <i className="fa-solid fa-link" style={{ marginRight: '8px', opacity: 0.7 }}></i>
                      {it.name}
                    </td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {(it.indexes && it.indexes[0]) || '-'}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" onClick={() => openEdit(it)}>
                          Edit
                        </Button>
                        <Button onClick={() => deleteAlias(String(it.name))}>
                          Delete
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
        title={selected ? `Edit Alias: ${selected.name}` : 'Create Alias'}
        width="820px"
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
              placeholder="e.g. products-active"
            />
            {errors.name ? <div className={styles.error}>{errors.name}</div> : null}
          </div>

          <div className={styles.label}>
            Index
            {indexesTooltip ? <InfoIcon tooltip={indexesTooltip} /> : null}
          </div>
          <div className={styles.field}>
            <SelectWithDescription
              value={draft.indexName}
              onChange={(e) => setDraft((p) => ({ ...p, indexName: e.target.value }))}
              options={availableIndexes.length > 0 ? availableIndexes : ['']}
              disabled={loadingIndexes || availableIndexes.length === 0}
            />
            {errors.indexes ? <div className={styles.error}>{errors.indexes}</div> : null}
            <div className={styles.hint}>
              {loadingIndexes
                ? 'Loading indexes...'
                : availableIndexes.length === 0
                  ? 'No indexes available. Create an index first.'
                  : 'Aliases map to a single index name.'}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AliasesPage;
