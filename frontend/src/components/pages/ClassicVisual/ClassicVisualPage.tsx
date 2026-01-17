import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useLayout } from '../../../context/LayoutContext';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { SchemaDrivenEditorModal } from '../../common/configDriven/SchemaDrivenEditorModal';
import { applyDefaultsForType, getResolvedTypeDefinitions } from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../common/configDriven/configDrivenTypes';

import { indexersService } from '../../../services/indexersService';
import { datasourcesService } from '../../../services/datasourcesService';
import { skillsetsService } from '../../../services/skillsetsService';
import { indexesService } from '../../../services/indexesService';
import { aliasesService } from '../../../services/aliasesService';
import { synonymMapsService } from '../../../services/synonymMapsService';
import { alertService } from '../../../services/alertService';
import { confirmService } from '../../../services/confirmService';

import type { IndexerListItem, SearchIndexer } from '../../../types/IndexerModels';
import type { SearchIndexerDataSourceConnection } from '../../../types/DataSourceModels';
import type { SearchIndexerSkillset } from '../../../types/SkillsetModels';
import type { SearchIndex, SearchField } from '../../../types/IndexModels';
import type { SearchAlias } from '../../../types/AliasModels';
import type { SynonymMap } from '../../../types/SynonymMapModels';

import { indexerSchema } from '../Indexers/indexerTooltips';
import { aliasSchema } from '../Aliases/aliasTooltips';
import { synonymMapSchema } from '../SynonymMaps/synonymMapTooltips';

import skillsSchemaJson from '../../../data/constants/config/Skillset/Skills/skillsConfig.json';
import selectorTypeJson from '../../../data/constants/config/Skillset/IndexProjections/types/SearchIndexerIndexProjectionSelector.json';
import mappingTypeJson from '../../../data/constants/config/Skillset/types/InputFieldMappingEntry.json';
import dataSourceSchemaJson from '../../../data/constants/config/DataSource/dataSourceConfig.json';
import dataSourceTypeJson from '../../../data/constants/config/DataSource/types/SearchIndexerDataSource.json';

import { ClassicVisualGraph } from './ClassicVisualGraph';
import { JsonEditorModal } from '../../common/JsonEditorModal';
import styles from './ClassicVisualPage.module.css';

const skillsSchema = skillsSchemaJson as unknown as ConfigDrivenSchema;
const selectorType = selectorTypeJson as unknown as ConfigDrivenTypeDefinition;
const mappingType = mappingTypeJson as unknown as ConfigDrivenTypeDefinition;
const dataSourceSchema = dataSourceSchemaJson as unknown as ConfigDrivenSchema;
const dataSourceType = dataSourceTypeJson as unknown as ConfigDrivenTypeDefinition;

const makeSchemaFromType = (
  title: string,
  typeDef: ConfigDrivenTypeDefinition,
  entityKeys?: { discriminatorKey?: string; nameKey?: string }
): ConfigDrivenSchema => {
  return {
    entity: {
      title,
      description: typeDef.description,
      discriminatorKey: entityKeys?.discriminatorKey ?? '@odata.type',
      nameKey: entityKeys?.nameKey ?? 'name'
    },
    commonFields: [],
    types: [typeDef]
  };
};

const selectorSchema: ConfigDrivenSchema = makeSchemaFromType('Index Projection Selector', selectorType);
const mappingSchema: ConfigDrivenSchema = makeSchemaFromType('Projection Mapping', mappingType);

type EditorTarget =
  | { kind: 'indexer' }
  | { kind: 'datasource' }
  | { kind: 'skillset' }
  | { kind: 'index' }
  | { kind: 'skill'; index: number; value: Record<string, unknown> }
  | { kind: 'selector'; index: number; value: Record<string, unknown> }
  | { kind: 'alias'; name: string; value: SearchAlias }
  | { kind: 'synonym'; name: string; value: SynonymMap };

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const getArrayOfObjects = (v: unknown) => (Array.isArray(v) ? v.filter(isPlainObject) : ([] as Record<string, unknown>[]));

const getSkillName = (skill: Record<string, unknown>, index: number) => {
  const n = trim(skill.name);
  return n ? n : `#${index + 1}`;
};

const ClassicVisualPage: React.FC = () => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();

  const [indexers, setIndexers] = useState<IndexerListItem[]>([]);
  const [selectedIndexerName, setSelectedIndexerName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [indexerDef, setIndexerDef] = useState<SearchIndexer | null>(null);
  const [dataSourceDef, setDataSourceDef] = useState<SearchIndexerDataSourceConnection | null>(null);
  const [skillsetDef, setSkillsetDef] = useState<SearchIndexerSkillset | null>(null);
  const [indexDef, setIndexDef] = useState<SearchIndex | null>(null);
  const [aliases, setAliases] = useState<SearchAlias[]>([]);
  const [synonymMaps, setSynonymMaps] = useState<SynonymMap[]>([]);

  const [dirtyIndexer, setDirtyIndexer] = useState(false);
  const [dirtyDataSource, setDirtyDataSource] = useState(false);
  const [dirtySkillset, setDirtySkillset] = useState(false);
  const [dirtyIndex, setDirtyIndex] = useState(false);
  const [dirtyAliases, setDirtyAliases] = useState<string[]>([]);
  const [dirtySynonyms, setDirtySynonyms] = useState<string[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Classic Visual' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const resetDirtyFlags = useCallback(() => {
    setDirtyIndexer(false);
    setDirtyDataSource(false);
    setDirtySkillset(false);
    setDirtyIndex(false);
    setDirtyAliases([]);
    setDirtySynonyms([]);
  }, []);

  const loadIndexers = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const data = await indexersService.listIndexers(activeConnectionId);
      setIndexers(data);
      if (!selectedIndexerName && data.length > 0) {
        setSelectedIndexerName(data[0].name);
      }
    } finally {
      setLoading(false);
    }
  }, [activeConnectionId, selectedIndexerName]);

  useEffect(() => {
    void loadIndexers();
  }, [loadIndexers]);

  const loadResources = useCallback(async () => {
    if (!activeConnectionId || !selectedIndexerName) return;
    setLoading(true);
    try {
      const indexer = await indexersService.getIndexer(activeConnectionId, selectedIndexerName);
      setIndexerDef(indexer);

      if (indexer.dataSourceName) {
        const ds = await datasourcesService.getDataSource(activeConnectionId, indexer.dataSourceName);
        setDataSourceDef(ds);
      } else {
        setDataSourceDef(null);
      }

      if (indexer.skillsetName) {
        const skillset = await skillsetsService.getSkillset(activeConnectionId, indexer.skillsetName);
        setSkillsetDef(skillset);
      } else {
        setSkillsetDef(null);
      }

      if (indexer.targetIndexName) {
        const idx = await indexesService.getIndex(activeConnectionId, indexer.targetIndexName);
        setIndexDef(idx);

        const allAliases = await aliasesService.listAliases(activeConnectionId);
        setAliases(allAliases.filter(a => (a.indexes || []).includes(indexer.targetIndexName!)));

        const allSynonyms = await synonymMapsService.listSynonymMaps(activeConnectionId);
        const usedSynonyms = new Set<string>();
        idx.fields?.forEach(f => f.synonymMaps?.forEach(s => usedSynonyms.add(s)));
        setSynonymMaps(allSynonyms.filter(s => usedSynonyms.has(s.name)));
      } else {
        setIndexDef(null);
        setAliases([]);
        setSynonymMaps([]);
      }

      resetDirtyFlags();
    } finally {
      setLoading(false);
    }
  }, [activeConnectionId, resetDirtyFlags, selectedIndexerName]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const hasDirty = useMemo(() => {
    return (
      dirtyIndexer ||
      dirtyDataSource ||
      dirtySkillset ||
      dirtyIndex ||
      dirtyAliases.length > 0 ||
      dirtySynonyms.length > 0
    );
  }, [dirtyAliases.length, dirtyDataSource, dirtyIndex, dirtyIndexer, dirtySkillset, dirtySynonyms.length]);

  const saveAll = useCallback(async () => {
    if (!activeConnectionId || !indexerDef) return;
    setSaving(true);
    try {
      if (dirtyIndexer) {
        const saved = await indexersService.createOrUpdateIndexer(activeConnectionId, indexerDef);
        setIndexerDef(saved);
      }
      if (dirtyDataSource && dataSourceDef) {
        const saved = await datasourcesService.createOrUpdateDataSource(activeConnectionId, dataSourceDef);
        setDataSourceDef(saved);
      }
      if (dirtySkillset && skillsetDef) {
        const saved = await skillsetsService.createOrUpdateSkillset(activeConnectionId, skillsetDef);
        setSkillsetDef(saved);
      }
      if (dirtyIndex && indexDef) {
        const saved = await indexesService.createOrUpdateIndex(activeConnectionId, indexDef);
        setIndexDef(saved);
      }
      if (dirtyAliases.length > 0) {
        const updates = aliases.filter(a => dirtyAliases.includes(a.name));
        const results = [] as SearchAlias[];
        for (const a of updates) {
          results.push(await aliasesService.createOrUpdateAlias(activeConnectionId, a));
        }
        setAliases(prev => prev.map(a => results.find(r => r.name === a.name) || a));
      }
      if (dirtySynonyms.length > 0) {
        const updates = synonymMaps.filter(s => dirtySynonyms.includes(s.name));
        const results = [] as SynonymMap[];
        for (const s of updates) {
          results.push(await synonymMapsService.createOrUpdateSynonymMap(activeConnectionId, s));
        }
        setSynonymMaps(prev => prev.map(s => results.find(r => r.name === s.name) || s));
      }
      resetDirtyFlags();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alertService.show({ title: 'Error', message: `Failed to save changes: ${message}` });
    } finally {
      setSaving(false);
    }
  }, [activeConnectionId, aliases, dataSourceDef, dirtyAliases, dirtyDataSource, dirtyIndex, dirtyIndexer, dirtySkillset, dirtySynonyms, indexDef, indexerDef, resetDirtyFlags, skillsetDef, synonymMaps]);

  const revertAll = useCallback(() => {
    void loadResources();
    setFocusNodeId(null);
  }, [loadResources]);

  const openEditor = useCallback((target: EditorTarget) => {
    setEditorTarget(target);
    setEditorOpen(true);
  }, []);

  const onEditNode = useCallback(
    (node: { id: string; type?: string; data: unknown }) => {
      const d = node.data as { kind?: unknown; index?: unknown; name?: unknown };
      if (d?.kind === 'skill' && typeof d.index === 'number' && skillsetDef) {
        const raw = Array.isArray(skillsetDef.skills) ? (skillsetDef.skills as unknown[])[d.index] : null;
        if (!isPlainObject(raw)) return;
        openEditor({ kind: 'skill', index: d.index, value: raw });
        return;
      }

      if (d?.kind === 'selector' && typeof d.index === 'number' && skillsetDef) {
        const indexProjections = isPlainObject(skillsetDef.indexProjections) ? (skillsetDef.indexProjections as Record<string, unknown>) : null;
        const selectors = indexProjections ? getArrayOfObjects(indexProjections.selectors) : [];
        const sel = selectors[d.index];
        if (!sel) return;
        openEditor({ kind: 'selector', index: d.index, value: sel });
        return;
      }

      if (d?.kind === 'field') {
        return openEditor({ kind: 'index' });
      }

      if (node.id === 'indexer') return openEditor({ kind: 'indexer' });
      if (node.id === 'indexer-field-mappings' || node.id === 'indexer-output-field-mappings') {
        return openEditor({ kind: 'indexer' });
      }
      if (node.id === 'datasource') return openEditor({ kind: 'datasource' });
      if (node.id === 'skillset') return openEditor({ kind: 'skillset' });
      if (node.id === 'index') return openEditor({ kind: 'index' });

      if (node.id.startsWith('alias-')) {
        const name = node.id.replace('alias-', '');
        const alias = aliases.find(a => a.name === name);
        if (alias) openEditor({ kind: 'alias', name, value: alias });
        return;
      }

      if (node.id.startsWith('synonym-')) {
        const name = node.id.replace('synonym-', '');
        const syn = synonymMaps.find(s => s.name === name);
        if (syn) openEditor({ kind: 'synonym', name, value: syn });
      }
    },
    [aliases, openEditor, skillsetDef, synonymMaps]
  );

  const editSelected = useCallback(() => {
    const id = selectedNodeId;
    if (!id) return;

    if (id.startsWith('skill-') && skillsetDef) {
      const idx = Number(id.slice('skill-'.length));
      if (!Number.isFinite(idx)) return;
      const raw = Array.isArray(skillsetDef.skills) ? (skillsetDef.skills as unknown[])[idx] : null;
      if (!isPlainObject(raw)) return;
      openEditor({ kind: 'skill', index: idx, value: raw });
      return;
    }

    if (id.startsWith('selector-') && skillsetDef) {
      const idx = Number(id.slice('selector-'.length));
      if (!Number.isFinite(idx)) return;
      const indexProjections = isPlainObject(skillsetDef.indexProjections) ? (skillsetDef.indexProjections as Record<string, unknown>) : null;
      const selectors = indexProjections ? getArrayOfObjects(indexProjections.selectors) : [];
      const sel = selectors[idx];
      if (!sel) return;
      openEditor({ kind: 'selector', index: idx, value: sel });
      return;
    }

    if (id.startsWith('field-')) return openEditor({ kind: 'index' });

    if (id === 'indexer') return openEditor({ kind: 'indexer' });
    if (id === 'indexer-field-mappings' || id === 'indexer-output-field-mappings') {
      return openEditor({ kind: 'indexer' });
    }
    if (id === 'datasource') return openEditor({ kind: 'datasource' });
    if (id === 'skillset') return openEditor({ kind: 'skillset' });
    if (id === 'index') return openEditor({ kind: 'index' });

    if (id.startsWith('alias-')) {
      const name = id.replace('alias-', '');
      const alias = aliases.find(a => a.name === name);
      if (alias) openEditor({ kind: 'alias', name, value: alias });
      return;
    }

    if (id.startsWith('synonym-')) {
      const name = id.replace('synonym-', '');
      const syn = synonymMaps.find(s => s.name === name);
      if (syn) openEditor({ kind: 'synonym', name, value: syn });
    }
  }, [aliases, openEditor, selectedNodeId, skillsetDef, synonymMaps]);

  const canDeleteSelected = useMemo(() => {
    const id = selectedNodeId;
    if (!id) return false;
    if (id.startsWith('skill-')) return !!skillsetDef;
    if (id.startsWith('selector-')) return !!skillsetDef;
    if (id.startsWith('alias-')) return true;
    if (id.startsWith('synonym-')) return true;
    if (id === 'indexer-field-mappings' || id === 'indexer-output-field-mappings') return !!indexerDef;
    return false;
  }, [indexerDef, selectedNodeId, skillsetDef]);

  const deleteSelected = useCallback(async () => {
    const id = selectedNodeId;
    if (!id) return;

    const confirmed = await confirmService.confirm({
      title: 'Delete Node',
      message: 'Delete the selected node?'
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      if (id.startsWith('skill-') && skillsetDef) {
        const idx = Number(id.slice('skill-'.length));
        if (Number.isFinite(idx)) {
          setSkillsetDef(prev => {
            if (!prev) return prev;
            const skills = Array.isArray(prev.skills) ? (prev.skills as unknown[]).filter(isPlainObject) : [];
            const nextSkills = skills.filter((_, i) => i !== idx);
            return { ...prev, skills: nextSkills } as SearchIndexerSkillset;
          });
          setDirtySkillset(true);
          setSelectedNodeId(null);
        }
        return;
      }

      if (id.startsWith('selector-') && skillsetDef) {
        const idx = Number(id.slice('selector-'.length));
        if (Number.isFinite(idx)) {
          setSkillsetDef(prev => {
            if (!prev) return prev;
            const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : {};
            const selectors = getArrayOfObjects(current.selectors);
            const nextSelectors = selectors.filter((_, i) => i !== idx);
            current.selectors = nextSelectors;
            return { ...prev, indexProjections: current } as SearchIndexerSkillset;
          });
          setDirtySkillset(true);
          setSelectedNodeId(null);
        }
        return;
      }

      if (id === 'indexer-field-mappings' && indexerDef) {
        setIndexerDef(prev => (prev ? { ...prev, fieldMappings: [] } : prev));
        setDirtyIndexer(true);
        setSelectedNodeId(null);
        return;
      }

      if (id === 'indexer-output-field-mappings' && indexerDef) {
        setIndexerDef(prev => (prev ? { ...prev, outputFieldMappings: [] } : prev));
        setDirtyIndexer(true);
        setSelectedNodeId(null);
        return;
      }

      if (id.startsWith('alias-') && activeConnectionId) {
        const name = id.replace('alias-', '');
        await aliasesService.deleteAlias(activeConnectionId, name);
        setAliases(prev => prev.filter(a => a.name !== name));
        setDirtyAliases(prev => prev.filter(n => n !== name));
        setSelectedNodeId(null);
        return;
      }

      if (id.startsWith('synonym-') && activeConnectionId) {
        const name = id.replace('synonym-', '');
        await synonymMapsService.deleteSynonymMap(activeConnectionId, name);
        setSynonymMaps(prev => prev.filter(s => s.name !== name));
        setDirtySynonyms(prev => prev.filter(n => n !== name));
        setIndexDef(prev => {
          if (!prev) return prev;
          const nextFields = (prev.fields || []).map((f) => {
            const maps = Array.isArray(f.synonymMaps) ? f.synonymMaps : [];
            return maps.includes(name) ? { ...f, synonymMaps: maps.filter(m => m !== name) } : f;
          });
          return { ...prev, fields: nextFields } as SearchIndex;
        });
        setDirtyIndex(true);
        setSelectedNodeId(null);
      }
    } finally {
      setDeleting(false);
    }
  }, [activeConnectionId, indexerDef, selectedNodeId, skillsetDef]);

  const editor = (() => {
    if (!editorTarget) return null;

    if (editorTarget.kind === 'indexer' && indexerDef) {
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={`Edit Indexer: ${indexerDef.name}`}
          schema={indexerSchema}
          value={indexerDef as unknown as Record<string, unknown>}
          onSave={(next) => {
            setIndexerDef(next as SearchIndexer);
            setDirtyIndexer(true);
            setFocusNodeId('indexer');
          }}
          nestedPresentation="accordion"
        />
      );
    }

    if (editorTarget.kind === 'datasource' && dataSourceDef) {
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={`Edit Data Source: ${dataSourceDef.name}`}
          schema={dataSourceSchema}
          value={dataSourceDef as unknown as Record<string, unknown>}
          onSave={(next) => {
            setDataSourceDef(next as SearchIndexerDataSourceConnection);
            setDirtyDataSource(true);
            setFocusNodeId('datasource');
          }}
          nestedPresentation="accordion"
        />
      );
    }

    if (editorTarget.kind === 'skillset' && skillsetDef) {
      return (
        <JsonEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={`Edit Skillset: ${skillsetDef.name}`}
          value={skillsetDef}
          onSave={(next) => {
            setSkillsetDef(next as SearchIndexerSkillset);
            setDirtySkillset(true);
            setFocusNodeId('skillset');
          }}
        />
      );
    }

    if (editorTarget.kind === 'index' && indexDef) {
      return (
        <JsonEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={`Edit Index: ${indexDef.name}`}
          value={indexDef}
          onSave={(next) => {
            setIndexDef(next as SearchIndex);
            setDirtyIndex(true);
            setFocusNodeId('index');
          }}
        />
      );
    }

    if (editorTarget.kind === 'skill' && skillsetDef) {
      const idx = editorTarget.index;
      const title = `Edit Skill: ${getSkillName(editorTarget.value, idx)}`;
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={title}
          schema={skillsSchema}
          value={editorTarget.value}
          onSave={(next) => {
            setSkillsetDef(prev => {
              if (!prev) return prev;
              const skills = Array.isArray(prev.skills) ? (prev.skills as unknown[]).filter(isPlainObject) : [];
              const nextSkills = [...skills];
              nextSkills[idx] = next;
              return { ...prev, skills: nextSkills } as SearchIndexerSkillset;
            });
            setDirtySkillset(true);
            setFocusNodeId(`skill-${idx}`);
          }}
          nestedPresentation="accordion"
        />
      );
    }

    if (editorTarget.kind === 'selector' && skillsetDef) {
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title="Edit Selector"
          schema={selectorSchema}
          value={editorTarget.value}
          onSave={(next) => {
            setSkillsetDef(prev => {
              if (!prev) return prev;
              const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : {};
              const selectors = getArrayOfObjects(current.selectors);
              const nextSelectors = [...selectors];
              nextSelectors[editorTarget.index] = next;
              current.selectors = nextSelectors;
              return { ...prev, indexProjections: current } as SearchIndexerSkillset;
            });
            setDirtySkillset(true);
            setFocusNodeId(`selector-${editorTarget.index}`);
          }}
          nestedPresentation="accordion"
        />
      );
    }

    if (editorTarget.kind === 'alias') {
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={`Edit Alias: ${editorTarget.name}`}
          schema={aliasSchema}
          value={editorTarget.value as unknown as Record<string, unknown>}
          onSave={(next) => {
            setAliases(prev => prev.map(a => (a.name === editorTarget.name ? (next as SearchAlias) : a)));
            setDirtyAliases(prev => (prev.includes(editorTarget.name) ? prev : [...prev, editorTarget.name]));
            setFocusNodeId(`alias-${editorTarget.name}`);
          }}
          nestedPresentation="accordion"
        />
      );
    }

    if (editorTarget.kind === 'synonym') {
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={`Edit Synonym Map: ${editorTarget.name}`}
          schema={synonymMapSchema}
          value={editorTarget.value as unknown as Record<string, unknown>}
          onSave={(next) => {
            setSynonymMaps(prev => prev.map(s => (s.name === editorTarget.name ? (next as SynonymMap) : s)));
            setDirtySynonyms(prev => (prev.includes(editorTarget.name) ? prev : [...prev, editorTarget.name]));
            setFocusNodeId(`synonym-${editorTarget.name}`);
          }}
          nestedPresentation="accordion"
        />
      );
    }

    return null;
  })();

  const addMappingToSelectedSelector = () => {
    const selectorId = selectedNodeId?.startsWith('selector-') ? selectedNodeId : null;
    const selectorIndex = selectorId ? Number(selectorId.slice('selector-'.length)) : -1;
    if (!Number.isFinite(selectorIndex) || selectorIndex < 0) return;
    const nextMapping = applyDefaultsForType(mappingSchema, mappingType.discriminatorValue, { name: '', source: '', inputs: [] });

    setSkillsetDef(prev => {
      if (!prev) return prev;
      const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : null;
      if (!current) return prev;
      const selectors = getArrayOfObjects(current.selectors);
      if (selectorIndex < 0 || selectorIndex >= selectors.length) return prev;
      const chosen = { ...selectors[selectorIndex] };
      const mappings = getArrayOfObjects(chosen.mappings);
      chosen.mappings = [...mappings, nextMapping];
      const nextSelectors = [...selectors];
      nextSelectors[selectorIndex] = chosen;
      current.selectors = nextSelectors;
      return { ...prev, indexProjections: current } as SearchIndexerSkillset;
    });
    setDirtySkillset(true);
    setFocusNodeId(`selector-${selectorIndex}`);
  };

  const addSelector = () => {
    const nextSelector = applyDefaultsForType(selectorSchema, selectorType.discriminatorValue, {
      targetIndexName: indexerDef?.targetIndexName || '',
      parentKeyFieldName: '',
      sourceContext: '/document',
      mappings: []
    });

    setSkillsetDef(prev => {
      if (!prev) return prev;
      const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : {};
      const selectors = getArrayOfObjects(current.selectors);
      current.selectors = [...selectors, nextSelector];
      setFocusNodeId(`selector-${selectors.length}`);
      return { ...prev, indexProjections: current } as SearchIndexerSkillset;
    });
    setDirtySkillset(true);
  };

  const addSkill = () => {
    const type = getResolvedTypeDefinitions(skillsSchema)[0]?.discriminatorValue;
    const nextSkill = type ? applyDefaultsForType(skillsSchema, type, {}) : { '@odata.type': '' };
    setSkillsetDef(prev => {
      if (!prev) return prev;
      const skills = Array.isArray(prev.skills) ? (prev.skills as unknown[]).filter(isPlainObject) : [];
      setFocusNodeId(`skill-${skills.length}`);
      return { ...prev, skills: [...skills, nextSkill] } as SearchIndexerSkillset;
    });
    setDirtySkillset(true);
  };

  const addDataSource = () => {
    if (!indexerDef) return;
    const next = applyDefaultsForType(dataSourceSchema, dataSourceType.discriminatorValue, {
      name: indexerDef.dataSourceName || 'new-datasource',
      type: '',
      container: { name: '' }
    });
    setDataSourceDef(next as SearchIndexerDataSourceConnection);
    setDirtyDataSource(true);
    setFocusNodeId('datasource');
  };

  const addSkillset = () => {
    if (!indexerDef?.skillsetName) return;
    const base: SearchIndexerSkillset = {
      name: indexerDef.skillsetName,
      skills: [],
      description: ''
    };
    setSkillsetDef(base);
    setDirtySkillset(true);
    setFocusNodeId('skillset');
  };

  const addIndex = () => {
    if (!indexerDef?.targetIndexName) return;
    const base: SearchIndex = {
      name: indexerDef.targetIndexName,
      fields: [
        { name: 'id', type: 'Edm.String', key: true, searchable: false, retrievable: true, filterable: false, sortable: false, facetable: false }
      ],
      vectorSearch: {
        algorithms: [],
        profiles: [],
        compressions: [],
        vectorizers: []
      },
      corsOptions: { allowedOrigins: ['*'], maxAgeInSeconds: 300 },
      suggesters: [],
      scoringProfiles: []
    };
    setIndexDef(base);
    setDirtyIndex(true);
    setFocusNodeId('index');
  };

  const addIndexField = () => {
    if (!indexDef) return;
    const existing = new Set((indexDef.fields || []).map(f => f.name));
    let idx = (indexDef.fields?.length ?? 0) + 1;
    let name = `field_${idx}`;
    while (existing.has(name)) {
      idx += 1;
      name = `field_${idx}`;
    }
    const nextField: SearchField = {
      name,
      type: 'Edm.String',
      searchable: true,
      retrievable: true
    };
    setIndexDef(prev => prev ? { ...prev, fields: [...(prev.fields || []), nextField] } : prev);
    setDirtyIndex(true);
    setFocusNodeId('index');
  };

  const addAlias = () => {
    if (!indexDef) return;
    const baseName = `${indexDef.name}-alias`;
    let name = baseName;
    let i = 1;
    const existing = new Set(aliases.map(a => a.name));
    while (existing.has(name)) {
      i += 1;
      name = `${baseName}-${i}`;
    }
    const next: SearchAlias = { name, indexes: [indexDef.name] };
    setAliases(prev => [...prev, next]);
    setDirtyAliases(prev => (prev.includes(name) ? prev : [...prev, name]));
    setFocusNodeId(`alias-${name}`);
  };

  const addSynonymMap = () => {
    if (!indexDef || !indexDef.fields?.length) return;
    const baseName = `${indexDef.name}-synonyms`;
    let name = baseName;
    let i = 1;
    const existing = new Set(synonymMaps.map(s => s.name));
    while (existing.has(name)) {
      i += 1;
      name = `${baseName}-${i}`;
    }
    const next: SynonymMap = { name, format: 'solr', synonyms: '' };
    const fieldName = indexDef.fields[0]?.name;
    setIndexDef(prev => {
      if (!prev || !fieldName) return prev;
      const nextFields = prev.fields.map(f => {
        if (f.name !== fieldName) return f;
        const maps = Array.isArray(f.synonymMaps) ? f.synonymMaps : [];
        return { ...f, synonymMaps: maps.includes(name) ? maps : [...maps, name] };
      });
      return { ...prev, fields: nextFields };
    });
    setSynonymMaps(prev => [...prev, next]);
    setDirtySynonyms(prev => (prev.includes(name) ? prev : [...prev, name]));
    setDirtyIndex(true);
    setFocusNodeId(`synonym-${name}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Select
            value={selectedIndexerName}
            onChange={(e) => setSelectedIndexerName(e.target.value)}
            disabled={loading || !indexers.length}
            style={{ minWidth: '220px' }}
          >
            {indexers.length === 0 && <option value="">No indexers found</option>}
            {indexers.map(i => (
              <option key={i.name} value={i.name}>
                {i.name}
              </option>
            ))}
          </Select>
          {skillsetDef && (
            <>
              <Button variant="secondary" onClick={addSkill}>
                <i className="fas fa-plus"></i> Add Skill to Skillset
              </Button>
              <Button variant="secondary" onClick={addSelector}>
                <i className="fas fa-plus"></i> Add Index Projection
              </Button>
              <Button
                variant="secondary"
                onClick={addMappingToSelectedSelector}
                disabled={!selectedNodeId?.startsWith('selector-')}
              >
                <i className="fas fa-diagram-project"></i> Add Mapping to Selected Selector
              </Button>
            </>
          )}
          {!skillsetDef && indexerDef?.skillsetName && (
            <Button variant="secondary" onClick={addSkillset}>
              <i className="fas fa-plus"></i> Create Skillset
            </Button>
          )}
          {!indexDef && indexerDef?.targetIndexName && (
            <Button variant="secondary" onClick={addIndex}>
              <i className="fas fa-plus"></i> Create Index
            </Button>
          )}
          {!dataSourceDef && indexerDef?.dataSourceName && (
            <Button variant="secondary" onClick={addDataSource}>
              <i className="fas fa-plus"></i> Add Data Source
            </Button>
          )}
          {indexDef && (
            <>
              <Button variant="secondary" onClick={addIndexField}>
                <i className="fas fa-plus"></i> Add Index Field
              </Button>
              <Button variant="secondary" onClick={addAlias}>
                <i className="fas fa-plus"></i> Add Alias
              </Button>
              <Button variant="secondary" onClick={addSynonymMap} disabled={!indexDef.fields?.length}>
                <i className="fas fa-plus"></i> Add Synonym Map
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={editSelected} disabled={!selectedNodeId}>
            <i className="fas fa-pen"></i> Edit Selected
          </Button>
          <Button
            variant="secondary"
            onClick={() => void deleteSelected()}
            disabled={!canDeleteSelected || deleting || loading}
            title={canDeleteSelected ? 'Delete selected node' : 'Select a deletable node'}
          >
            <i className="fas fa-trash"></i> Delete Selected
          </Button>
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.statusText}>{hasDirty ? 'Unsaved changes' : 'All changes saved'}</div>
          <Button variant="secondary" onClick={revertAll} disabled={!hasDirty || loading}>
            <i className="fas fa-undo"></i> Revert All
          </Button>
          <Button variant="primary" onClick={saveAll} disabled={!hasDirty || saving}>
            <i className="fas fa-save"></i> Save All
          </Button>
        </div>
      </div>

      <div className={styles.canvasArea}>
        <Card style={{ padding: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ClassicVisualGraph
            indexer={indexerDef}
            dataSource={dataSourceDef}
            skillset={skillsetDef}
            index={indexDef}
            aliases={aliases}
            synonymMaps={synonymMaps}
            onSelectNode={setSelectedNodeId}
            onEditNode={onEditNode}
            focusNodeId={focusNodeId}
          />
        </Card>
      </div>

      {editor}
    </div>
  );
};

export default ClassicVisualPage;
