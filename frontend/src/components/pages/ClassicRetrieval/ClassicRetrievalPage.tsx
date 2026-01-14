import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { classicRetrievalService } from '../../../services/classicRetrievalService';

import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { TextArea } from '../../common/TextArea';
import { InfoIcon } from '../../common/InfoIcon';
import { JsonViewerModal } from '../../common/JsonViewerModal';
import { JsonView } from '../../common/JsonView';
import { SelectWithDescription, type SelectOption } from '../../common/SelectWithDescription';
import { SchemaDrivenEditorModal } from '../../common/configDriven/SchemaDrivenEditorModal';
import { Modal } from '../../common/Modal';
import { TruncatedTextCell } from '../../common/TruncatedTextCell';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../common/configDriven/configDrivenTypes';
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

type IndexListLike = {
  name: string;
  description?: string;
};

interface ColumnDef {
  header: string;
  path: string;
}

const toIndexListLike = (value: unknown): IndexListLike | null => {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  const name = String(rec.Name ?? rec.name ?? '').trim();
  if (!name) return null;
  const description = String(rec.Description ?? rec.description ?? '').trim();
  return { name, description: description || undefined };
};

type SearchDraft = {
  search: string;
  queryType: string;
  searchMode: string;
  count: boolean;
  top: number;
  skip: number;
  filter: string;
  select: string;
  orderby: string;
  searchFields: string;
  facets: string[];
  highlight: string;
  highlightPreTag: string;
  highlightPostTag: string;
  scoringProfile: string;
  scoringParameters: string[];
  scoringStatistics: string;
  minimumCoverage: number;
  answers: string;
  captions: string;
  debug: string;
  semanticConfiguration: string;
  semanticQuery: string;
  semanticErrorHandling: string;
  semanticMaxWaitInMilliseconds: number | '';
  sessionId: string;
  vectorFilterMode: string;
  vectorQueries: Record<string, unknown>[];
};

type TabId = 'table' | 'insights' | 'json';

const stringifyShort = (v: unknown): string => {
  if (v === null || typeof v === 'undefined') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const buildVectorQueriesSchema = (vectorQueryConfig: ConfigDrivenSchema): ConfigDrivenSchema => {
  const typeDef: ConfigDrivenTypeDefinition = {
    discriminatorValue: 'VectorQueriesEditor',
    label: 'VectorQueriesEditor',
    description: 'Edit vector query payloads used for vector/hybrid search.',
    fields: [
      {
        key: 'vectorFilterMode',
        label: 'Vector Filter Mode',
        type: 'string',
        tooltip: 'Whether filters are applied before or after vector search.'
      },
      {
        key: 'vectorQueries',
        label: 'Vector Queries',
        type: 'objectArray',
        orderMatters: true,
        tooltip: 'Vector and hybrid search query parameters.',
        schema: vectorQueryConfig
      }
    ]
  };

  return {
    entity: {
      title: 'Vector Search',
      description: 'Vector/hybrid query options',
      discriminatorKey: '@odata.type',
      nameKey: 'name'
    },
    commonFields: [],
    types: [typeDef]
  };
};

const ClassicRetrievalPage: React.FC = () => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();

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

  const [loadingIndexes, setLoadingIndexes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('table');
  const [rawResponse, setRawResponse] = useState<Record<string, unknown> | null>(null);

  const [keyFieldName, setKeyFieldName] = useState<string | null>(null);

  const [requestJsonOpen, setRequestJsonOpen] = useState(false);
  const [requestJsonText, setRequestJsonText] = useState<string>('');
  const [requestJsonParseError, setRequestJsonParseError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDoc, setDetailsDoc] = useState<Record<string, unknown> | null>(null);

  const [columns, setColumns] = useState<ColumnDef[]>([
    { header: 'Score', path: '@search.score' }
  ]);
  const [newColHeader, setNewColHeader] = useState('');
  const [newColPath, setNewColPath] = useState('');
  const [viewCell, setViewCell] = useState<string | null>(null);
  const [viewJsonItem, setViewJsonItem] = useState<Record<string, unknown> | null>(null);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [vectorEditorOpen, setVectorEditorOpen] = useState(false);

  const [draft, setDraft] = useState<SearchDraft>(() => {
    // Start with safe defaults; we'll re-apply schema defaults once the schema is resolved.
    return {
      search: '*',
      queryType: 'simple',
      searchMode: 'any',
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
      semanticConfiguration: '',
      semanticQuery: '',
      semanticErrorHandling: 'fail',
      semanticMaxWaitInMilliseconds: '',
      sessionId: '',
      vectorFilterMode: 'preFilter',
      vectorQueries: []
    };
  });

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
    setBreadcrumbs([{ label: 'Classic Retrieval' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const fetchIndexes = useCallback(async () => {
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
  }, [activeConnectionId, selectedIndex]);

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
        if (!cancelled) setKeyFieldName(key);
      } catch (e) {
        console.error(e);
        if (!cancelled) setKeyFieldName(null);
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
  const scoringStatisticsOptions = useMemo(() => enumOptions('scoringStatistics'), [enumOptions]);
  const answersOptions = useMemo(() => enumOptions('answers'), [enumOptions]);
  const captionsOptions = useMemo(() => enumOptions('captions'), [enumOptions]);
  const debugOptions = useMemo(() => enumOptions('debug'), [enumOptions]);
  const semanticErrorHandlingOptions = useMemo(() => enumOptions('semanticErrorHandling'), [enumOptions]);
  const vectorFilterModeOptions = useMemo(() => enumOptions('vectorFilterMode'), [enumOptions]);

  const toRequestPayload = useCallback((): Record<string, unknown> => {
    const facets = (draft.facets || []).map((x) => String(x).trim()).filter(Boolean);

    // Mirrors Azure AI Search POST /docs/search request body.
    // Keep values close to what the user typed (e.g. select/orderby/searchFields as comma-separated strings).
    return {
      search: draft.search,
      queryType: draft.queryType,
      searchMode: draft.searchMode,
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
      answers: draft.answers,
      captions: draft.captions,
      debug: draft.debug,
      semanticConfiguration: draft.semanticConfiguration || undefined,
      semanticQuery: draft.semanticQuery || undefined,
      semanticErrorHandling: draft.semanticErrorHandling,
      semanticMaxWaitInMilliseconds:
        typeof draft.semanticMaxWaitInMilliseconds === 'number' ? draft.semanticMaxWaitInMilliseconds : undefined,
      sessionId: draft.sessionId || undefined,
      vectorFilterMode: draft.vectorFilterMode || undefined,
      vectorQueries: draft.vectorQueries.length > 0 ? draft.vectorQueries : undefined
    };
  }, [draft]);

  useEffect(() => {
    if (!requestJsonOpen) return;
    setRequestJsonText(JSON.stringify(toRequestPayload(), null, 2));
    setRequestJsonParseError(null);
  }, [requestJsonOpen, toRequestPayload]);

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

  const addColumn = useCallback(() => {
    const header = newColHeader.trim();
    const path = newColPath.trim();
    if (!header || !path) return;
    setColumns((c) => [...c, { header, path }]);
    setNewColHeader('');
    setNewColPath('');
  }, [newColHeader, newColPath]);

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
    if (!vectorQueryConfig) return null;
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

  const renderResultsTable = () => {
    if (loading) return <div className={styles.empty}>Running query…</div>;
    if (error) return <div className={styles.empty}>{error}</div>;
    if (!rawResponse) return <div className={styles.empty}>Run a query to see results.</div>;

    const rows = results;
    if (rows.length === 0) return <div className={styles.empty}>No results.</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
        <div className={styles.columnControls}>
          <div className={styles.columnControlsRow}>
            <span className={styles.columnControlsLabel}>Cols:</span>
            <Input
              placeholder="Header"
              value={newColHeader}
              onChange={(e) => setNewColHeader(e.target.value)}
              style={{ width: 120 }}
            />
            <Input
              placeholder="Path (e.g. Address.City)"
              value={newColPath}
              onChange={(e) => setNewColPath(e.target.value)}
              style={{ width: 220 }}
            />
            <Button variant="secondary" onClick={addColumn} title="Add column">
              <i className="fas fa-plus"></i>
            </Button>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                variant="secondary"
                onClick={resetColumns}
                title="Reset columns"
              >
                Reset
              </Button>
            </div>
          </div>
          <div className={styles.smallHint}>Path supports dot notation ("Field.SubField"). The index key field is detected from the index schema.</div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: 44 }}></th>
                {columns.map((col, idx) => (
                  <th key={idx} className={styles.th}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className={styles.labelRow}>
                          {col.header}
                          {col.path === '@search.score' ? <InfoIcon tooltip={scoreTip || 'Relevance score of the document.'} /> : null}
                          {keyFieldName && col.path === keyFieldName ? (
                            <span title="Index key field" style={{ marginLeft: 6, opacity: 0.85 }}>
                              <i className="fas fa-key"></i>
                            </span>
                          ) : null}
                        </span>
                        <span className={styles.thPath}>{col.path}</span>
                      </div>
                      <button
                        className={styles.iconBtn}
                        title="Remove column"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeColumn(idx);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((doc, i) => (
                <tr key={i} className={styles.row} onClick={() => openDetails(doc)}>
                  <td className={styles.td} style={{ width: 44 }}>
                    <button
                      className={styles.iconBtn}
                      title="View document JSON"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewJsonItem(doc);
                      }}
                    >
                      <i className="fas fa-code"></i>
                    </button>
                  </td>
                  {columns.map((col, cIdx) => {
                    const value = cellValue(doc, col.path);
                    return <TruncatedTextCell key={cIdx} value={value} onExpand={setViewCell} maxWidth="420px" compact />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (!rawResponse) return <div className={styles.empty}>Run a query to see insights.</div>;

    const data = results
      .map((d, i) => {
        const score = typeof d['@search.score'] === 'number' ? (d['@search.score'] as number) : null;
        const reranker = typeof d['@search.rerankerScore'] === 'number' ? (d['@search.rerankerScore'] as number) : null;
        return { i: i + 1, score, reranker };
      })
      .filter((d) => typeof d.score === 'number');

    return (
      <div className={styles.insightsWrap}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>Result Overview</div>
              <div className={styles.smallHint}>Score distribution for the current page of results.</div>
            </div>
            <div className={styles.smallHint}>
              {typeof count === 'number' ? (
                <span className={styles.pill} title={responseTips.count}>
                  <i className="fas fa-hashtag"></i> count: {count}
                </span>
              ) : null}{' '}
              {typeof coverage === 'number' ? (
                <span className={styles.pill} title={responseTips.coverage}>
                  <i className="fas fa-chart-pie"></i> coverage: {coverage.toFixed(2)}%
                </span>
              ) : null}
            </div>
          </div>
          <div style={{ height: 220, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="i" tick={{ fill: 'var(--text-color)', opacity: 0.7 }} />
                <YAxis tick={{ fill: 'var(--text-color)', opacity: 0.7 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                />
                <Bar dataKey="score" name="@search.score" fill="var(--accent-color)" />
                <Bar dataKey="reranker" name="@search.rerankerScore" fill="var(--status-warn-text)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <span>Answers</span>
              <InfoIcon tooltip={responseTips.answers || 'Semantic answers returned by the service when enabled.'} />
            </div>
            {answers.length === 0 ? (
              <div className={styles.smallHint}>No answers returned (enable Answers or use semantic query type).</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {answers.slice(0, 6).map((a, idx) => (
                  <div key={idx} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                    <div className={styles.smallHint} style={{ marginBottom: 6 }}>
                      <i className="fas fa-wand-magic-sparkles"></i> answer #{idx + 1}
                    </div>
                    <div className={styles.wrapAnywhere} style={{ color: 'var(--text-color)', whiteSpace: 'pre-wrap' }}>
                      {stringifyShort(a)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

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
          <Button variant="secondary" onClick={() => setAdvancedOpen((v) => !v)} title="Show/hide advanced query options">
            <i className="fas fa-sliders-h"></i> {advancedOpen ? 'Hide' : 'Show'} Advanced
          </Button>
          <Button variant="primary" onClick={() => void run()} disabled={!activeConnectionId || !selectedIndex || loading}>
            <i className="fas fa-play"></i> Run
          </Button>
        </div>
      </div>

      <div className={styles.main}>
        <Card className={styles.panel} style={{ padding: 0 }}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleText}>
              <div className={styles.panelTitleTop}>Request</div>
              <div className={styles.panelTitleSub}>Pick an index and build your query.</div>
            </div>
            <div className={styles.panelTitleActions}>
              <Button variant="secondary" onClick={() => setAdvancedOpen((v) => !v)} title="Show/hide advanced query options">
                <i className="fas fa-sliders-h"></i>
              </Button>
              <Button
                variant="icon"
                icon={<i className="fas fa-code"></i>}
                onClick={() => setRequestJsonOpen(true)}
                title="View/edit the generated search request body"
              />
              {loadingIndexes ? <span className={styles.badge}>Loading…</span> : null}
            </div>
          </div>

          <div className={styles.formBody}>
            <div className={styles.fieldRow}>
              <div className={styles.labelRow}>
                <Label>Index</Label>
                <InfoIcon tooltip="Select the target index for this query." />
              </div>
              <SelectWithDescription
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(e.target.value)}
                disabled={!activeConnectionId || loadingIndexes}
                options={[
                  {
                    value: '',
                    label: activeConnectionId ? 'Select an index' : 'Select a connection first',
                    description: undefined
                  },
                  ...indexes.map((i) => ({ value: i.name, label: i.name, description: i.description }))
                ]}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.labelRow}>
                <Label>Search</Label>
                <InfoIcon tooltip={tip('search') || 'Full-text search query expression.'} />
              </div>
              <Input value={draft.search} onChange={(e) => setField('search', e.target.value)} placeholder="*" />
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.labelRow}>
                <input
                  type="checkbox"
                  checked={draft.count}
                  onChange={(e) => setField('count', e.target.checked)}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>Count</span>
                  <InfoIcon tooltip={tip('count') || 'Whether to fetch the total count of results.'} />
                </span>
              </label>
              <div className={styles.smallHint}>If enabled, the service includes @odata.count.</div>
            </div>

            <div className={styles.inlineRow}>
              <div className={styles.fieldRow}>
                <div className={styles.labelRow}>
                  <Label>Query Type</Label>
                  <InfoIcon tooltip={tip('queryType') || ''} />
                </div>
                <SelectWithDescription
                  value={draft.queryType}
                  onChange={(e) => setField('queryType', e.target.value)}
                  options={queryTypeOptions}
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.labelRow}>
                  <Label>Search Mode</Label>
                  <InfoIcon tooltip={tip('searchMode') || ''} />
                </div>
                <SelectWithDescription
                  value={draft.searchMode}
                  onChange={(e) => setField('searchMode', e.target.value)}
                  options={searchModeOptions}
                />
              </div>
            </div>

            <div className={styles.inlineRow}>
              <div className={styles.fieldRow}>
                <div className={styles.labelRow}>
                  <Label>Top</Label>
                  <InfoIcon tooltip={tip('top') || ''} />
                </div>
                <Input
                  type="number"
                  value={draft.top}
                  onChange={(e) => setField('top', Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.labelRow}>
                  <Label>Skip</Label>
                  <InfoIcon tooltip={tip('skip') || ''} />
                </div>
                <Input
                  type="number"
                  value={draft.skip}
                  onChange={(e) => setField('skip', Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.labelRow}>
                <Label>Filter</Label>
                <InfoIcon tooltip={tip('filter') || ''} />
              </div>
              <TextArea
                rows={3}
                value={draft.filter}
                onChange={(e) => setField('filter', e.target.value)}
                placeholder="field eq 'value'"
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.labelRow}>
                <Label>Select</Label>
                <InfoIcon tooltip={tip('select') || ''} />
              </div>
              <Input
                value={draft.select}
                onChange={(e) => setField('select', e.target.value)}
                placeholder="field1,field2"
              />
              <div className={styles.smallHint}>Comma-separated field list.</div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.labelRow}>
                <Label>Order By</Label>
                <InfoIcon tooltip={tip('orderby') || ''} />
              </div>
              <Input
                value={draft.orderby}
                onChange={(e) => setField('orderby', e.target.value)}
                placeholder="search.score() desc"
              />
            </div>

            {advancedOpen ? (
              <>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <i className="fas fa-toolbox"></i>
                    Advanced
                  </div>
                  <span className={styles.badge}>All options</span>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Search Fields</Label>
                    <InfoIcon tooltip={tip('searchFields') || ''} />
                  </div>
                  <Input
                    value={draft.searchFields}
                    onChange={(e) => setField('searchFields', e.target.value)}
                    placeholder="field1,field2"
                  />
                </div>

                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Scoring Profile</Label>
                      <InfoIcon tooltip={tip('scoringProfile') || ''} />
                    </div>
                    <Input
                      value={draft.scoringProfile}
                      onChange={(e) => setField('scoringProfile', e.target.value)}
                      placeholder="optional"
                    />
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Scoring Statistics</Label>
                      <InfoIcon tooltip={tip('scoringStatistics') || ''} />
                    </div>
                    <SelectWithDescription
                      value={draft.scoringStatistics}
                      onChange={(e) => setField('scoringStatistics', e.target.value)}
                      options={scoringStatisticsOptions}
                    />
                  </div>
                </div>

                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Minimum Coverage</Label>
                      <InfoIcon tooltip={tip('minimumCoverage') || ''} />
                    </div>
                    <Input
                      type="number"
                      value={draft.minimumCoverage}
                      onChange={(e) => setField('minimumCoverage', Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Scoring Parameters</Label>
                      <InfoIcon tooltip={tip('scoringParameters') || ''} />
                    </div>
                    <TextArea
                      rows={3}
                      value={draft.scoringParameters.join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value
                          .split('\n')
                          .map((x) => x.trim())
                          .filter(Boolean);
                        setField('scoringParameters', lines);
                      }}
                      placeholder="name--value\nname--value"
                    />
                    <div className={styles.smallHint}>One per line.</div>
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Facets</Label>
                    <InfoIcon tooltip={tip('facets') || ''} />
                  </div>
                  <TextArea
                    rows={3}
                    value={(draft.facets || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value
                        .split('\n')
                        .map((x) => x.trim())
                        .filter(Boolean);
                      setField('facets', lines);
                    }}
                    placeholder="category,count:10\nbrand,count:5"
                  />
                  <div className={styles.smallHint}>One facet expression per line.</div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Highlight Fields</Label>
                    <InfoIcon tooltip={tip('highlight') || ''} />
                  </div>
                  <Input
                    value={draft.highlight}
                    onChange={(e) => setField('highlight', e.target.value)}
                    placeholder="field1,field2"
                  />
                  <div className={styles.inlineRow} style={{ marginTop: 8 }}>
                    <div className={styles.fieldRow}>
                      <div className={styles.labelRow}>
                        <Label>Pre Tag</Label>
                        <InfoIcon tooltip={tip('highlightPreTag') || ''} />
                      </div>
                      <Input value={draft.highlightPreTag} onChange={(e) => setField('highlightPreTag', e.target.value)} />
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={styles.labelRow}>
                        <Label>Post Tag</Label>
                        <InfoIcon tooltip={tip('highlightPostTag') || ''} />
                      </div>
                      <Input value={draft.highlightPostTag} onChange={(e) => setField('highlightPostTag', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Answers</Label>
                      <InfoIcon tooltip={tip('answers') || ''} />
                    </div>
                    <SelectWithDescription value={draft.answers} onChange={(e) => setField('answers', e.target.value)} options={answersOptions} />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Captions</Label>
                      <InfoIcon tooltip={tip('captions') || ''} />
                    </div>
                    <SelectWithDescription value={draft.captions} onChange={(e) => setField('captions', e.target.value)} options={captionsOptions} />
                  </div>
                </div>

                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Debug</Label>
                      <InfoIcon tooltip={tip('debug') || ''} />
                    </div>
                    <SelectWithDescription value={draft.debug} onChange={(e) => setField('debug', e.target.value)} options={debugOptions} />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Session Id</Label>
                      <InfoIcon tooltip={tip('sessionId') || ''} />
                    </div>
                    <Input value={draft.sessionId} onChange={(e) => setField('sessionId', e.target.value)} placeholder="optional" />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Semantic Configuration</Label>
                    <InfoIcon tooltip={tip('semanticConfiguration') || ''} />
                  </div>
                  <Input
                    value={draft.semanticConfiguration}
                    onChange={(e) => setField('semanticConfiguration', e.target.value)}
                    placeholder="optional"
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Semantic Query</Label>
                    <InfoIcon tooltip={tip('semanticQuery') || ''} />
                  </div>
                  <TextArea
                    rows={2}
                    value={draft.semanticQuery}
                    onChange={(e) => setField('semanticQuery', e.target.value)}
                    placeholder="optional"
                  />
                </div>

                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Semantic Error Handling</Label>
                      <InfoIcon tooltip={tip('semanticErrorHandling') || ''} />
                    </div>
                    <SelectWithDescription
                      value={draft.semanticErrorHandling}
                      onChange={(e) => setField('semanticErrorHandling', e.target.value)}
                      options={semanticErrorHandlingOptions}
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Semantic Max Wait (ms)</Label>
                      <InfoIcon tooltip={tip('semanticMaxWaitInMilliseconds') || ''} />
                    </div>
                    <Input
                      type="number"
                      value={draft.semanticMaxWaitInMilliseconds}
                      onChange={(e) => {
                        const v = e.target.value;
                        setField('semanticMaxWaitInMilliseconds', v === '' ? '' : Number(v));
                      }}
                      placeholder="700"
                    />
                  </div>
                </div>

                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <i className="fas fa-vector-square"></i>
                    Vector / Hybrid
                    <span className={styles.badge}>{draft.vectorQueries.length} queries</span>
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Vector Filter Mode</Label>
                    <InfoIcon tooltip={tip('vectorFilterMode') || ''} />
                  </div>
                  <SelectWithDescription
                    value={draft.vectorFilterMode}
                    onChange={(e) => setField('vectorFilterMode', e.target.value)}
                    options={vectorFilterModeOptions}
                  />
                </div>

                <div className={styles.fieldRow}>
                  <Button
                    variant="secondary"
                    onClick={() => setVectorEditorOpen(true)}
                    disabled={!vectorEditorSchema}
                    title="Edit vectorQueries payload"
                  >
                    <i className="fas fa-pen"></i> Edit Vector Queries
                  </Button>
                  <div className={styles.smallHint}>Uses the shared VectorQuery config to provide field-level tooltips.</div>
                </div>
              </>
            ) : null}

            {vectorEditorSchema ? (
              <SchemaDrivenEditorModal
                isOpen={vectorEditorOpen}
                onClose={() => setVectorEditorOpen(false)}
                title="Vector Search"
                schema={vectorEditorSchema}
                value={vectorEditorValue}
                onSave={(next) => {
                  const rec = next as Record<string, unknown>;
                  const nextMode = String(rec.vectorFilterMode ?? draft.vectorFilterMode);
                  const nextQueries = Array.isArray(rec.vectorQueries) ? (rec.vectorQueries as Record<string, unknown>[]) : [];
                  setDraft((d) => ({ ...d, vectorFilterMode: nextMode, vectorQueries: nextQueries }));
                }}
              />
            ) : null}
          </div>
        </Card>

        <Card className={styles.panel} style={{ padding: 0 }}>
          <div className={styles.tabs}>
            <div
              className={`${styles.tab} ${activeTab === 'table' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('table')}
            >
              <i className="fas fa-table"></i>&nbsp;Table
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'insights' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              <i className="fas fa-chart-column"></i>&nbsp;Insights
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'json' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('json')}
            >
              <i className="fas fa-code"></i>&nbsp;JSON
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '6px' }}>
              {typeof count === 'number' ? (
                <span className={styles.pill} title={responseTips.count}>
                  <i className="fas fa-hashtag"></i> {count}
                </span>
              ) : null}
              {typeof coverage === 'number' ? (
                <span className={styles.pill} title={responseTips.coverage}>
                  <i className="fas fa-percent"></i> {coverage.toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>

          <div className={styles.resultsBody}>
            {activeTab === 'table' ? renderResultsTable() : null}
            {activeTab === 'insights' ? renderInsights() : null}
            {activeTab === 'json' ? (
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <JsonView
                  data={rawResponse || '// Setup query and click Run'}
                  options={{ lineNumbers: 'on', minimap: { enabled: true } }}
                />
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={requestJsonOpen}
        onClose={() => setRequestJsonOpen(false)}
        title="Search Request Body"
        width="min(1200px, 95vw)"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRequestJsonText(JSON.stringify(toRequestPayload(), null, 2));
                setRequestJsonParseError(null);
              }}
              title="Reset to the current request builder values"
            >
              <i className="fas fa-rotate-left"></i> Reset
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(requestJsonText)}
              title="Copy request JSON"
            >
              <i className="fas fa-copy"></i> Copy
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const parsed = JSON.parse(requestJsonText) as unknown;
                  setRequestJsonParseError(null);
                  await runWithBody(parsed);
                  setRequestJsonOpen(false);
                } catch (e) {
                  const msg = e instanceof Error ? e.message : String(e);
                  setRequestJsonParseError(msg || 'Invalid JSON');
                }
              }}
              disabled={loading || !activeConnectionId || !selectedIndex}
              title="Run the edited request JSON"
            >
              <i className="fas fa-play"></i> Run Edited
            </Button>
            <Button onClick={() => setRequestJsonOpen(false)}>Close</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requestJsonParseError ? (
            <div className={styles.requestJsonError}>
              <i className="fas fa-triangle-exclamation"></i> {requestJsonParseError}
            </div>
          ) : null}

          <div
            style={{
              height: 'min(70vh, 800px)',
              minHeight: '420px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <JsonView
              data={requestJsonText || '{}'}
              readOnly={false}
              onChange={(val) => setRequestJsonText(val ?? '')}
              options={{ lineNumbers: 'on', minimap: { enabled: true } }}
            />
          </div>

        </div>
      </Modal>

      <JsonViewerModal isOpen={viewJsonItem !== null} onClose={() => setViewJsonItem(null)} title="Document JSON" data={viewJsonItem} />

      <Modal
        isOpen={viewCell !== null}
        onClose={() => setViewCell(null)}
        title="Cell Content"
        footer={
          <>
            <Button variant="secondary" onClick={() => viewCell && navigator.clipboard.writeText(viewCell)}>
              <i className="fas fa-copy"></i> Copy
            </Button>
            <Button onClick={() => setViewCell(null)}>Close</Button>
          </>
        }
      >
        <textarea
          readOnly
          style={{
            width: '100%',
            height: '100%',
            minHeight: '300px',
            backgroundColor: 'var(--sidebar-bg)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            resize: 'none',
            padding: '10px'
          }}
          value={viewCell || ''}
        />
      </Modal>

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
