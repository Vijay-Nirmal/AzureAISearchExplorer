import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { classicRetrievalService } from '../../../services/classicRetrievalService';

import { Button } from '../../common/Button';
import { JsonViewerModal } from '../../common/JsonViewerModal';
import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';
import {
  applyDefaultsForType,
  getFieldTooltipFromSchema,
  getResolvedFieldDefinition,
  getResolvedFieldOptions,
  getTypeDescriptionFromSchema,
  resolveConfigRef
} from '../../common/configDriven/configDrivenUtils';
import styles from './ClassicRetrievalPage.module.css';
import { ClassicRetrievalDetailsModal } from './ClassicRetrievalDetailsModal';
import type { SelectOption } from '../../common/SelectWithDescription';

import type { ColumnDef, IndexFieldLike, IndexListLike, SearchDraft } from './classicRetrievalTypes';
import {
  buildVectorQueriesSchema,
  describeField,
  isVectorField,
  stringifyShort,
  toIndexFieldLike,
  toIndexListLike
} from './classicRetrievalUtils';
import { ClassicRetrievalCellModal } from './ClassicRetrievalCellModal';
import { ClassicRetrievalRequestJsonModal } from './ClassicRetrievalRequestJsonModal';
import { ClassicRetrievalRequestPanel } from './ClassicRetrievalRequestPanel';
import { ClassicRetrievalResultsPanel } from './ClassicRetrievalResultsPanel';

type ClassicRetrievalPageProps = {
  indexName?: string;
  onBack?: () => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
};

const ClassicRetrievalPage: React.FC<ClassicRetrievalPageProps> = ({ indexName, onBack, breadcrumbs }) => {
  const { activeConnectionId, setBreadcrumbs, breadcrumbs: currentBreadcrumbs } = useLayout();

  const requestSchema = useMemo(() => {
    // Classic request config references Common/Search request schema.
    return resolveConfigRef<ConfigDrivenSchema>('ClassicRetrieval/DocumentRetrieval/documentSearchRequestConfig.json');
  }, []);

  const responseSchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('ClassicRetrieval/DocumentRetrieval/documentSearchResponseConfig.json');
  }, []);

  const vectorQueryConfig = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('Common/Search/VectorQuery/vectorQueryConfig.json');
  }, []);

  const [indexes, setIndexes] = useState<IndexListLike[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>('');

  const [indexFields, setIndexFields] = useState<IndexFieldLike[]>([]);
  const [indexScoringProfiles, setIndexScoringProfiles] = useState<string[]>([]);
  const [indexSemanticConfigurations, setIndexSemanticConfigurations] = useState<string[]>([]);

  const [loadingIndexes, setLoadingIndexes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<Record<string, unknown> | null>(null);

  const [keyFieldName, setKeyFieldName] = useState<string | null>(null);

  const [requestJsonOpen, setRequestJsonOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDoc, setDetailsDoc] = useState<Record<string, unknown> | null>(null);

  const [columns, setColumns] = useState<ColumnDef[]>([
    { header: 'Score', path: '@search.score' }
  ]);
  const [viewCell, setViewCell] = useState<string | null>(null);
  const [viewJsonItem, setViewJsonItem] = useState<Record<string, unknown> | null>(null);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedSectionsOpen, setAdvancedSectionsOpen] = useState({
    searchScoring: true,
    facetsHighlight: false,
    semantic: true,
    languageRewrites: false,
    diagnostics: false,
    vectorHybrid: true
  });

  const [draft, setDraft] = useState<SearchDraft>(() => {
    // Start with safe defaults; we'll re-apply schema defaults once the schema is resolved.
    return {
      search: '*',
      queryType: 'simple',
      searchMode: 'any',
      queryLanguage: 'none',
      queryRewrites: 'none',
      speller: 'none',
      count: true,
      top: 25,
      skip: 0,
      filter: '',
      select: '',
      orderby: '',
      searchFields: '',
      facets: [],
      highlight: '',
      highlightPreTag: '<em>',
      highlightPostTag: '</em>',
      scoringProfile: '',
      scoringParameters: [],
      scoringStatistics: 'local',
      minimumCoverage: 100,
      answers: 'none',
      captions: 'none',
      debug: 'disabled',
      semanticFields: '',
      semanticConfiguration: '',
      semanticQuery: '',
      semanticErrorHandling: 'fail',
      semanticMaxWaitInMilliseconds: '',
      sessionId: '',
      hybridSearchEnabled: false,
      hybridCountAndFacetMode: 'countAllResults',
      hybridMaxTextRecallSize: 1000,
      basicVectorEnabled: false,
      basicVectorFields: '',
      basicVectorText: '',
      basicVectorK: 10,
      basicVectorWeight: 1,
      vectorFilterMode: 'preFilter',
      vectorQueries: []
    };
  });

  // Keep a simple (text-only) vector search experience outside Advanced.
  // When enabled, we maintain vectorQueries as a single VectorizableTextQuery.
  useEffect(() => {
    if (!draft.basicVectorEnabled) return;

    const fields = draft.basicVectorFields.trim();
    const text = draft.basicVectorText;
    const k = typeof draft.basicVectorK === 'number' ? draft.basicVectorK : 10;
    const weight = Number.isFinite(draft.basicVectorWeight) ? draft.basicVectorWeight : 1;

    const nextQuery: Record<string, unknown> = {
      kind: 'text',
      fields,
      k,
      text,
      weight
    };

    setDraft((d) => {
      if (!d.basicVectorEnabled) return d;
      const cur = d.vectorQueries;
      const cur0 = Array.isArray(cur) ? cur[0] : undefined;
      const isBasic =
        Array.isArray(cur) &&
        cur.length === 1 &&
        cur0 &&
        typeof cur0 === 'object' &&
        String((cur0 as Record<string, unknown>).kind ?? '') === 'text';

      if (isBasic) {
        const rec = cur0 as Record<string, unknown>;
        const same =
          String(rec.fields ?? '') === fields &&
          String(rec.text ?? '') === text &&
          Number(rec.k ?? NaN) === k &&
          Number(rec.weight ?? 1) === weight;
        if (same) return d;
      }

      return {
        ...d,
        vectorQueries: [nextQuery]
      };
    });
  }, [draft.basicVectorEnabled, draft.basicVectorFields, draft.basicVectorK, draft.basicVectorText, draft.basicVectorWeight]);

  useEffect(() => {
    if (!requestSchema) return;
    // Apply schema defaults once when schema becomes available.
    setDraft((cur) => {
      const base = cur as unknown as Record<string, unknown>;
      const next = applyDefaultsForType(requestSchema, 'SearchRequest', base);
      const nextRec = next as Record<string, unknown>;
      const maybeVectorQueries = nextRec.vectorQueries;
      return {
        ...(cur as SearchDraft),
        ...(next as unknown as Partial<SearchDraft>),
        // Ensure vectorQueries remains an array.
        vectorQueries: Array.isArray(maybeVectorQueries)
          ? (maybeVectorQueries as Record<string, unknown>[])
          : cur.vectorQueries
      } as SearchDraft;
    });
  }, [requestSchema]);

  useEffect(() => {
    // Clear breadcrumbs only when this page unmounts.
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const next = breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs : [{ label: 'Classic Retrieval' }];

    const sameLabels =
      currentBreadcrumbs.length === next.length &&
      currentBreadcrumbs.every((b, i) => b.label === next[i]?.label);

    if (!sameLabels) setBreadcrumbs(next);
  }, [breadcrumbs, currentBreadcrumbs, setBreadcrumbs]);

  useEffect(() => {
    if (!indexName) return;
    setSelectedIndex(indexName);
    setIndexes([{ name: indexName, description: undefined }]);
  }, [indexName]);

  const fetchIndexes = useCallback(async () => {
    if (indexName) return;
    if (!activeConnectionId) return;
    setLoadingIndexes(true);
    try {
      const raw = await indexesService.listIndexes(activeConnectionId);
      const parsed = (Array.isArray(raw) ? raw : []).map(toIndexListLike).filter((x): x is IndexListLike => !!x);
      parsed.sort((a, b) => a.name.localeCompare(b.name));
      setIndexes(parsed);
      if (!selectedIndex && parsed.length > 0) setSelectedIndex(parsed[0].name);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIndexes(false);
    }
  }, [activeConnectionId, indexName, selectedIndex]);

  useEffect(() => {
    void fetchIndexes();
  }, [fetchIndexes]);

  useEffect(() => {
    if (!activeConnectionId || !selectedIndex) {
      setKeyFieldName(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const idx = await indexesService.getIndex(activeConnectionId, selectedIndex);
        const key = idx?.fields?.find((f) => f.key)?.name ?? null;
        if (cancelled) return;
        setKeyFieldName(key);
        setIndexFields((idx?.fields || []).map(toIndexFieldLike).filter((x): x is IndexFieldLike => !!x));
        setIndexScoringProfiles((idx?.scoringProfiles || []).map((sp) => sp.name).filter(Boolean));
        setIndexSemanticConfigurations((idx?.semantic?.configurations || []).map((c) => c.name).filter(Boolean));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setKeyFieldName(null);
          setIndexFields([]);
          setIndexScoringProfiles([]);
          setIndexSemanticConfigurations([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConnectionId, selectedIndex]);

  const disc = 'SearchRequest';

  const tip = useCallback(
    (fieldKey: keyof SearchDraft | string) => {
      if (!requestSchema) return undefined;
      return getFieldTooltipFromSchema(requestSchema, disc, String(fieldKey));
    },
    [requestSchema]
  );

  const typeDesc = useMemo(() => {
    if (!requestSchema) return undefined;
    return getTypeDescriptionFromSchema(requestSchema, disc);
  }, [requestSchema]);

  const enumOptions = useCallback(
    (fieldKey: string): SelectOption[] => {
      if (!requestSchema) return [];
      const def = getResolvedFieldDefinition(requestSchema, disc, fieldKey);
      if (!def) return [];
      return getResolvedFieldOptions(def).map((o) => ({ value: o.value, label: o.label ?? o.value, description: o.description }));
    },
    [requestSchema]
  );

  const queryTypeOptions = useMemo(() => enumOptions('queryType'), [enumOptions]);
  const searchModeOptions = useMemo(() => enumOptions('searchMode'), [enumOptions]);
  const queryLanguageOptions = useMemo(() => enumOptions('queryLanguage'), [enumOptions]);
  const queryRewritesOptions = useMemo(() => enumOptions('queryRewrites'), [enumOptions]);
  const spellerOptions = useMemo(() => enumOptions('speller'), [enumOptions]);
  const scoringStatisticsOptions = useMemo(() => enumOptions('scoringStatistics'), [enumOptions]);
  const answersOptions = useMemo(() => enumOptions('answers'), [enumOptions]);
  const captionsOptions = useMemo(() => enumOptions('captions'), [enumOptions]);
  const debugOptions = useMemo(() => enumOptions('debug'), [enumOptions]);
  const semanticErrorHandlingOptions = useMemo(() => enumOptions('semanticErrorHandling'), [enumOptions]);
  const vectorFilterModeOptions = useMemo(() => enumOptions('vectorFilterMode'), [enumOptions]);

  const retrievableFieldOptions = useMemo<SelectOption[]>(
    () =>
      indexFields
        .filter((f) => f.retrievable)
        .map((f) => ({ value: f.name, label: f.name, description: describeField(f) }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    [indexFields]
  );

  const searchableFieldOptions = useMemo<SelectOption[]>(
    () =>
      indexFields
        .filter((f) => f.searchable)
        .map((f) => ({ value: f.name, label: f.name, description: describeField(f) }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    [indexFields]
  );

  const facetableFieldOptions = useMemo<SelectOption[]>(
    () =>
      indexFields
        .filter((f) => f.facetable)
        .map((f) => ({ value: f.name, label: f.name, description: describeField(f) }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    [indexFields]
  );

  const sortableFieldOptions = useMemo<SelectOption[]>(
    () =>
      indexFields
        .filter((f) => f.sortable)
        .map((f) => ({ value: f.name, label: f.name, description: describeField(f) }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    [indexFields]
  );

  const vectorFieldOptions = useMemo<SelectOption[]>(
    () =>
      indexFields
        .filter((f) => isVectorField(f))
        .map((f) => ({ value: f.name, label: f.name, description: describeField(f) }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    [indexFields]
  );

  const scoringProfileOptionsFromIndex = useMemo<SelectOption[]>(
    () => [
      { value: '', label: '(none)', description: 'No scoring profile.' },
      ...indexScoringProfiles.map((n) => ({ value: n, label: n, description: 'Index scoring profile.' }))
    ],
    [indexScoringProfiles]
  );

  const semanticConfigOptionsFromIndex = useMemo<SelectOption[]>(
    () => [
      { value: '', label: '(none)', description: 'No semantic configuration.' },
      ...indexSemanticConfigurations.map((n) => ({ value: n, label: n, description: 'Index semantic configuration.' }))
    ],
    [indexSemanticConfigurations]
  );

  const hybridCountAndFacetModeOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: 'countAllResults',
        label: 'countAllResults',
        description: "Include all documents matched by the search query when computing count and facets."
      },
      {
        value: 'countRetrievableResults',
        label: 'countRetrievableResults',
        description: "Only include documents matched within the maxTextRecallSize retrieval window when computing count and facets."
      }
    ],
    []
  );

  const toRequestPayload = useCallback((): Record<string, unknown> => {
    const facets = (draft.facets || []).map((x) => String(x).trim()).filter(Boolean);

    const hybridSearch = draft.hybridSearchEnabled
      ? {
          countAndFacetMode: draft.hybridCountAndFacetMode || undefined,
          maxTextRecallSize:
            typeof draft.hybridMaxTextRecallSize === 'number' ? draft.hybridMaxTextRecallSize : undefined
        }
      : undefined;

    // Mirrors Azure AI Search POST /docs/search request body.
    // Keep values close to what the user typed (e.g. select/orderby/searchFields as comma-separated strings).
    return {
      search: draft.search,
      queryType: draft.queryType,
      searchMode: draft.searchMode,
      queryLanguage: draft.queryLanguage && draft.queryLanguage !== 'none' ? draft.queryLanguage : undefined,
      queryRewrites: draft.queryRewrites && draft.queryRewrites !== 'none' ? draft.queryRewrites : undefined,
      speller: draft.speller && draft.speller !== 'none' ? draft.speller : undefined,
      count: draft.count,
      top: draft.top,
      skip: draft.skip,
      filter: draft.filter || undefined,
      select: draft.select || undefined,
      orderby: draft.orderby || undefined,
      searchFields: draft.searchFields || undefined,
      facets: facets.length > 0 ? facets : undefined,
      highlight: draft.highlight || undefined,
      highlightPreTag: draft.highlightPreTag || undefined,
      highlightPostTag: draft.highlightPostTag || undefined,
      scoringProfile: draft.scoringProfile || undefined,
      scoringParameters: draft.scoringParameters.length > 0 ? draft.scoringParameters : undefined,
      scoringStatistics: draft.scoringStatistics,
      minimumCoverage: draft.minimumCoverage,
      answers: draft.answers || undefined,
      captions: draft.captions || undefined,
      debug: draft.debug && draft.debug !== 'disabled' ? draft.debug : undefined,
      semanticConfiguration: draft.semanticConfiguration || undefined,
      semanticQuery: draft.semanticQuery || undefined,
      semanticErrorHandling: draft.semanticErrorHandling,
      semanticFields: draft.semanticFields || undefined,
      semanticMaxWaitInMilliseconds:
        typeof draft.semanticMaxWaitInMilliseconds === 'number' ? draft.semanticMaxWaitInMilliseconds : undefined,
      sessionId: draft.sessionId || undefined,
      hybridSearch,
      vectorFilterMode: draft.vectorFilterMode || undefined,
      vectorQueries: draft.vectorQueries.length > 0 ? draft.vectorQueries : undefined
    };
  }, [draft]);

  const requestPayloadText = useMemo(() => JSON.stringify(toRequestPayload(), null, 2), [toRequestPayload]);

  const runWithBody = useCallback(
    async (body: unknown) => {
      if (!activeConnectionId) return;
      if (!selectedIndex) {
        alert('Select an index first.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const resp = await classicRetrievalService.searchDocuments(activeConnectionId, selectedIndex, body);
        if (resp && typeof resp === 'object' && !Array.isArray(resp)) {
          setRawResponse(resp as Record<string, unknown>);
        } else {
          // Should be JSON from Azure Search, but keep the UI resilient.
          setRawResponse({ raw: resp } as Record<string, unknown>);
        }
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        setError(message || 'Query failed');
      } finally {
        setLoading(false);
      }
    },
    [activeConnectionId, selectedIndex]
  );

  const run = useCallback(async () => {
    await runWithBody(toRequestPayload());
  }, [runWithBody, toRequestPayload]);

  const results = useMemo(() => {
    const v = rawResponse?.value;
    return Array.isArray(v) ? v : [];
  }, [rawResponse]);

  const answers = useMemo(() => {
    const v = rawResponse?.['@search.answers'];
    return Array.isArray(v) ? (v as unknown[]) : [];
  }, [rawResponse]);

  const coverage = rawResponse?.['@search.coverage'];
  const count = rawResponse?.['@odata.count'];

  const openDetails = useCallback((doc: Record<string, unknown>) => {
    setDetailsDoc(doc);
    setDetailsOpen(true);
  }, []);

  const resetColumns = useCallback(() => {
    const base: ColumnDef[] = [{ header: 'Score', path: '@search.score' }];
    if (keyFieldName) base.push({ header: 'Key', path: keyFieldName });
    setColumns(base);
  }, [keyFieldName]);

  useEffect(() => {
    if (!keyFieldName) return;

    // If the table is still at its initial default, insert the key column.
    setColumns((cols) => {
      if (cols.length === 1 && cols[0]?.path === '@search.score') {
        return [{ header: 'Score', path: '@search.score' }, { header: 'Key', path: keyFieldName }];
      }
      return cols;
    });
  }, [keyFieldName]);

  const addColumn = useCallback((col: ColumnDef) => {
    if (!col.header.trim() || !col.path.trim()) return;
    setColumns((c) => [...c, col]);
  }, []);

  const removeColumn = useCallback((idx: number) => {
    setColumns((cols) => cols.filter((_, i) => i !== idx));
  }, []);

  const resolvePath = useCallback((obj: unknown, path: string): unknown => {
    if (!obj || typeof obj !== 'object') return undefined;
    if (path.startsWith('$')) path = path.substring(1);
    if (path.startsWith('.')) path = path.substring(1);

    const root = obj as Record<string, unknown>;
    // First, try direct key lookup (supports fields like "@search.score").
    if (Object.prototype.hasOwnProperty.call(root, path)) return root[path];

    return path.split('.').reduce<unknown>((acc, part) => {
      if (!acc || typeof acc !== 'object') return undefined;
      const rec = acc as Record<string, unknown>;
      return rec[part];
    }, obj);
  }, []);

  const getAutoColumnLimit = useCallback((width: number): number => {
    if (width < 860) return 4;
    if (width < 1200) return 6;
    return 8;
  }, []);

  const isVerboseField = useCallback((key: string, value: unknown): boolean => {
    const k = key.toLowerCase();
    if (k.includes('vector') || k.includes('embedding')) return true;
    if (Array.isArray(value)) {
      if (value.length > 20) return true;
      if (value.length > 0 && value.every((x) => typeof x === 'number')) return true;
    }
    if (value && typeof value === 'object') {
      const rec = value as Record<string, unknown>;
      const keys = Object.keys(rec);
      if (keys.length > 15) return true;
    }
    return false;
  }, []);

  const scoreFieldWeight = useCallback((key: string): number => {
    const k = key.toLowerCase();
    const preferred = [
      'title',
      'name',
      'subject',
      'filename',
      'file',
      'filepath',
      'path',
      'url',
      'source',
      'category',
      'tags',
      'summary',
      'description',
      'content',
      'text',
      'chunk',
      'chunkid'
    ];
    const idx = preferred.findIndex((p) => k === p || k.endsWith(`_${p}`) || k.includes(p));
    return idx >= 0 ? 100 - idx : 0;
  }, []);

  const cellValue = useCallback(
    (doc: Record<string, unknown>, path: string): string => {
      const v = resolvePath(doc, path);
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') return v;
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return stringifyShort(v);
    },
    [resolvePath]
  );

  useEffect(() => {
    // Auto-suggest a handful of document fields when the table is still at defaults.
    if (!rawResponse) return;
    if (results.length === 0) return;
    const defaultPaths = [
      '@search.score',
      ...(keyFieldName ? [keyFieldName] : [])
    ];
    if (columns.length !== defaultPaths.length) return;
    if (!columns.every((c, idx) => c.path === defaultPaths[idx])) return;

    const first = results[0];
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const limit = getAutoColumnLimit(width);

    const base: ColumnDef[] = [{ header: 'Score', path: '@search.score' }];
    if (Object.prototype.hasOwnProperty.call(first, '@search.rerankerScore')) base.push({ header: 'Rerank', path: '@search.rerankerScore' });
    if (keyFieldName) base.push({ header: 'Key', path: keyFieldName });

    // Trim base columns on narrow screens (prefer Score + Key).
    let trimmedBase = base;
    if (trimmedBase.length > limit) {
      trimmedBase = trimmedBase.filter((c) => c.path !== '@search.rerankerScore');
    }
    if (trimmedBase.length > limit) {
      trimmedBase = trimmedBase.slice(0, limit);
    }

    const candidates = Object.keys(first)
      .filter((k) => !k.startsWith('@'))
      .map((k) => ({ key: k, weight: scoreFieldWeight(k), value: first[k] }))
      .filter((c) => !isVerboseField(c.key, c.value))
      .sort((a, b) => b.weight - a.weight);

    const preferred = candidates.filter((c) => c.weight > 0).map((c) => ({ header: c.key, path: c.key }));

    // Fallback: pick any primitive-ish fields if none matched the preference list.
    const fallback = candidates
      .filter((c) => c.weight === 0)
      .filter((c) => typeof c.value === 'string' || typeof c.value === 'number' || typeof c.value === 'boolean')
      .map((c) => ({ header: c.key, path: c.key }));

    const additional = Math.max(0, limit - trimmedBase.length);
    const picked = [...preferred, ...fallback]
      .filter((c) => !trimmedBase.some((b) => b.path === c.path))
      .slice(0, additional);

    setColumns([...trimmedBase, ...picked]);
  }, [rawResponse, results, columns, getAutoColumnLimit, isVerboseField, scoreFieldWeight, keyFieldName]);

  const responseTips = useMemo(() => {
    if (!responseSchema) return {} as Record<string, string | undefined>;
    const discResp = 'SearchDocumentsResult';
    return {
      count: getFieldTooltipFromSchema(responseSchema, discResp, '@odata.count'),
      coverage: getFieldTooltipFromSchema(responseSchema, discResp, '@search.coverage'),
      answers: getFieldTooltipFromSchema(responseSchema, discResp, '@search.answers'),
      facets: getFieldTooltipFromSchema(responseSchema, discResp, '@search.facets'),
      results: getFieldTooltipFromSchema(responseSchema, discResp, 'value')
    };
  }, [responseSchema]);

  const vectorEditorSchema = useMemo(() => {
    if (!vectorQueryConfig) return undefined;
    return buildVectorQueriesSchema(vectorQueryConfig);
  }, [vectorQueryConfig]);

  const vectorEditorValue = useMemo(() => {
    return {
      vectorFilterMode: draft.vectorFilterMode,
      vectorQueries: draft.vectorQueries
    } as Record<string, unknown>;
  }, [draft.vectorFilterMode, draft.vectorQueries]);

  const setField = <K extends keyof SearchDraft>(key: K, value: SearchDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const scoreTip = useMemo(() => {
    if (!responseSchema) return undefined;
    // Best-effort: if schema isn't loaded, tooltips degrade gracefully.
    return getFieldTooltipFromSchema(responseSchema as unknown as ConfigDrivenSchema, 'SearchResult', '@search.score');
  }, [responseSchema]);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.title}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div>Classic Retrieval</div>
            <div className={styles.subTitle}>{typeDesc || 'Build a classic search request and inspect results.'}</div>
          </div>
        </div>

        <div className={styles.actions}>
          {onBack ? (
            <Button variant="secondary" onClick={onBack} title="Back">
              <i className="fas fa-arrow-left"></i> Back
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => setAdvancedOpen((v) => !v)} title="Show/hide advanced query options">
            <i className="fas fa-sliders-h"></i> {advancedOpen ? 'Hide' : 'Show'} Advanced
          </Button>
          <Button variant="primary" onClick={() => void run()} disabled={!activeConnectionId || !selectedIndex || loading}>
            <i className="fas fa-play"></i> Run
          </Button>
        </div>
      </div>

      <div className={styles.main}>
        <ClassicRetrievalRequestPanel
          activeConnectionId={activeConnectionId}
          loadingIndexes={loadingIndexes}
          indexes={indexes}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          indexSelectionLocked={!!indexName}
          draft={draft}
          setDraft={setDraft}
          setField={setField}
          tip={tip}
          advancedOpen={advancedOpen}
          onToggleAdvanced={() => setAdvancedOpen((v) => !v)}
          advancedSectionsOpen={advancedSectionsOpen}
          setAdvancedSectionsOpen={setAdvancedSectionsOpen}
          retrievableFieldOptions={retrievableFieldOptions}
          searchableFieldOptions={searchableFieldOptions}
          facetableFieldOptions={facetableFieldOptions}
          sortableFieldOptions={sortableFieldOptions}
          vectorFieldOptions={vectorFieldOptions}
          queryTypeOptions={queryTypeOptions}
          searchModeOptions={searchModeOptions}
          queryLanguageOptions={queryLanguageOptions}
          queryRewritesOptions={queryRewritesOptions}
          spellerOptions={spellerOptions}
          scoringStatisticsOptions={scoringStatisticsOptions}
          answersOptions={answersOptions}
          captionsOptions={captionsOptions}
          debugOptions={debugOptions}
          semanticErrorHandlingOptions={semanticErrorHandlingOptions}
          vectorFilterModeOptions={vectorFilterModeOptions}
          scoringProfileOptionsFromIndex={scoringProfileOptionsFromIndex}
          semanticConfigOptionsFromIndex={semanticConfigOptionsFromIndex}
          indexScoringProfilesCount={indexScoringProfiles.length}
          indexSemanticConfigurationsCount={indexSemanticConfigurations.length}
          hybridCountAndFacetModeOptions={hybridCountAndFacetModeOptions}
          onOpenRequestJson={() => setRequestJsonOpen(true)}
          vectorEditorSchema={vectorEditorSchema}
          vectorEditorValue={vectorEditorValue}
        />

        <ClassicRetrievalResultsPanel
          loading={loading}
          error={error}
          rawResponse={rawResponse}
          results={results}
          answers={answers}
          count={count}
          coverage={coverage}
          responseTips={responseTips}
          scoreTip={scoreTip}
          columns={columns}
          keyFieldName={keyFieldName}
          onAddColumn={addColumn}
          onRemoveColumn={removeColumn}
          onResetColumns={resetColumns}
          onOpenDetails={openDetails}
          onViewDocumentJson={setViewJsonItem}
          onExpandCell={setViewCell}
          cellValue={cellValue}
        />
      </div>

      <ClassicRetrievalRequestJsonModal
        isOpen={requestJsonOpen}
        onClose={() => setRequestJsonOpen(false)}
        payloadText={requestPayloadText}
        canRun={!!activeConnectionId && !!selectedIndex}
        loading={loading}
        onRunWithBody={runWithBody}
      />

      <JsonViewerModal isOpen={viewJsonItem !== null} onClose={() => setViewJsonItem(null)} title="Document JSON" data={viewJsonItem} />

      <ClassicRetrievalCellModal isOpen={viewCell !== null} value={viewCell || ''} onClose={() => setViewCell(null)} />

      <ClassicRetrievalDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        doc={detailsDoc}
        keyFieldName={keyFieldName}
      />
    </div>
  );
};

export default ClassicRetrievalPage;
