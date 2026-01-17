import React, { useMemo, useState } from 'react';

import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { InfoIcon } from '../../common/InfoIcon';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { SchemaDrivenEditorModal } from '../../common/configDriven/SchemaDrivenEditorModal';
import { SelectWithDescription, type SelectOption } from '../../common/SelectWithDescription';
import { TextArea } from '../../common/TextArea';

import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import type { IndexListLike, SearchDraft } from './classicRetrievalTypes';
import {
  csvToList,
  formatOrderbySingle,
  listToCsv,
  parseOrderbySingle
} from './classicRetrievalUtils';
import styles from './ClassicRetrievalPage.module.css';

type AdvancedSectionsOpen = {
  searchScoring: boolean;
  facetsHighlight: boolean;
  semantic: boolean;
  languageRewrites: boolean;
  diagnostics: boolean;
  vectorHybrid: boolean;
};

type Props = {
  activeConnectionId: string | null;

  loadingIndexes: boolean;
  indexes: IndexListLike[];
  selectedIndex: string;
  onSelectedIndexChange: (next: string) => void;
  indexSelectionLocked?: boolean;

  draft: SearchDraft;
  setDraft: React.Dispatch<React.SetStateAction<SearchDraft>>;
  setField: <K extends keyof SearchDraft>(key: K, value: SearchDraft[K]) => void;

  tip: (fieldKey: keyof SearchDraft | string) => string | undefined;

  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  advancedSectionsOpen: AdvancedSectionsOpen;
  setAdvancedSectionsOpen: React.Dispatch<React.SetStateAction<AdvancedSectionsOpen>>;

  // Field-derived options
  retrievableFieldOptions: SelectOption[];
  searchableFieldOptions: SelectOption[];
  facetableFieldOptions: SelectOption[];
  sortableFieldOptions: SelectOption[];
  vectorFieldOptions: SelectOption[];

  // Enum options
  queryTypeOptions: SelectOption[];
  searchModeOptions: SelectOption[];
  queryLanguageOptions: SelectOption[];
  queryRewritesOptions: SelectOption[];
  spellerOptions: SelectOption[];
  scoringStatisticsOptions: SelectOption[];
  answersOptions: SelectOption[];
  captionsOptions: SelectOption[];
  debugOptions: SelectOption[];
  semanticErrorHandlingOptions: SelectOption[];
  vectorFilterModeOptions: SelectOption[];

  scoringProfileOptionsFromIndex: SelectOption[];
  semanticConfigOptionsFromIndex: SelectOption[];
  indexScoringProfilesCount: number;
  indexSemanticConfigurationsCount: number;

  hybridCountAndFacetModeOptions: SelectOption[];

  onOpenRequestJson: () => void;

  vectorEditorSchema: ConfigDrivenSchema | undefined;
  vectorEditorValue: Record<string, unknown>;
};

export const ClassicRetrievalRequestPanel: React.FC<Props> = ({
  activeConnectionId,
  loadingIndexes,
  indexes,
  selectedIndex,
  onSelectedIndexChange,
  indexSelectionLocked,
  draft,
  setDraft,
  setField,
  tip,
  advancedOpen,
  onToggleAdvanced,
  advancedSectionsOpen,
  setAdvancedSectionsOpen,
  retrievableFieldOptions,
  searchableFieldOptions,
  facetableFieldOptions,
  sortableFieldOptions,
  vectorFieldOptions,
  queryTypeOptions,
  searchModeOptions,
  queryLanguageOptions,
  queryRewritesOptions,
  spellerOptions,
  scoringStatisticsOptions,
  answersOptions,
  captionsOptions,
  debugOptions,
  semanticErrorHandlingOptions,
  vectorFilterModeOptions,
  scoringProfileOptionsFromIndex,
  semanticConfigOptionsFromIndex,
  indexScoringProfilesCount,
  indexSemanticConfigurationsCount,
  hybridCountAndFacetModeOptions,
  onOpenRequestJson,
  vectorEditorSchema,
  vectorEditorValue
}) => {
  const defaultSemanticConfig = useMemo(
    () => semanticConfigOptionsFromIndex.find((opt) => !!opt.value)?.value ?? '',
    [semanticConfigOptionsFromIndex]
  );

  const defaultQueryLanguage = useMemo(
    () => queryLanguageOptions.find((opt) => opt.value === 'en-us')?.value ?? 'en-us',
    [queryLanguageOptions]
  );
  const [facetFieldPick, setFacetFieldPick] = useState('');

  const orderbyParsed = useMemo(() => parseOrderbySingle(draft.orderby), [draft.orderby]);
  const orderbyFieldPick = orderbyParsed?.field ?? '';
  const orderbyDirPick = orderbyParsed?.dir ?? 'desc';

  const debugSelectedValues = useMemo(() => {
    const raw = (draft.debug || '').trim();
    if (!raw || raw === 'disabled') return [] as string[];
    return raw
      .split('|')
      .map((x) => x.trim())
      .filter(Boolean);
  }, [draft.debug]);

  const [vectorEditorOpen, setVectorEditorOpen] = useState(false);

  return (
    <Card className={styles.panel} style={{ padding: 0 }}>
      <div className={styles.panelTitle}>
        <div className={styles.panelTitleText}>
          <div className={styles.panelTitleTop}>Request</div>
          <div className={styles.panelTitleSub}>Pick an index and build your query.</div>
        </div>
        <div className={styles.panelTitleActions}>
          <Button variant="secondary" onClick={onToggleAdvanced} title="Show/hide advanced query options">
            <i className="fas fa-sliders-h"></i>
          </Button>
          <Button
            variant="icon"
            icon={<i className="fas fa-code"></i>}
            onClick={onOpenRequestJson}
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
            onChange={(e) => onSelectedIndexChange(e.target.value)}
            disabled={!activeConnectionId || loadingIndexes || !!indexSelectionLocked}
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
            <SelectWithDescription value={draft.queryType} onChange={(e) => setField('queryType', e.target.value)} options={queryTypeOptions} />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.labelRow}>
              <Label>Search Mode</Label>
              <InfoIcon tooltip={tip('searchMode') || ''} />
            </div>
            <SelectWithDescription value={draft.searchMode} onChange={(e) => setField('searchMode', e.target.value)} options={searchModeOptions} />
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <i className="fas fa-vector-square"></i>
            Vector Search (simple)
          </div>
          {draft.basicVectorEnabled ? <span className={styles.badge}>enabled</span> : <span className={styles.badge}>off</span>}
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.labelRow}>
            <input
              type="checkbox"
              checked={draft.basicVectorEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                setDraft((d) => ({
                  ...d,
                  basicVectorEnabled: enabled,
                  basicVectorText: enabled ? (d.basicVectorText || d.search || '') : d.basicVectorText,
                  queryType: enabled ? 'semantic' : d.queryType,
                  queryLanguage: enabled ? (d.queryLanguage && d.queryLanguage !== 'none' ? d.queryLanguage : defaultQueryLanguage) : d.queryLanguage,
                  queryRewrites: enabled ? (d.queryRewrites && d.queryRewrites !== 'none' ? d.queryRewrites : 'generative') : d.queryRewrites,
                  semanticConfiguration: enabled ? (d.semanticConfiguration || defaultSemanticConfig) : d.semanticConfiguration,
                  captions: enabled ? (d.captions && d.captions !== 'none' ? d.captions : 'extractive') : d.captions,
                  answers: enabled ? (d.answers && d.answers !== 'none' ? d.answers : 'extractive|count-3') : d.answers
                }));
              }}
              style={{ accentColor: 'var(--accent-color)' }}
            />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>Use vector search with text</span>
              <InfoIcon tooltip="Adds a single vector query of kind 'text' (service vectorizes your text)." />
            </span>
          </label>
          <div className={styles.smallHint}>Friendly starter mode. For multiple vector queries, images, thresholds, etc. use Advanced.</div>
        </div>

        {draft.basicVectorEnabled ? (
          <>
            <div className={styles.fieldRow}>
              <div className={styles.labelRow}>
                <Label>Vector Fields</Label>
                <InfoIcon tooltip="Comma-separated vector field names to search (Collection(Edm.Single))." />
              </div>
              {vectorFieldOptions.length > 0 ? (
                <>
                  <SelectWithDescription
                    multiple
                    closeOnSelect={false}
                    value={csvToList(draft.basicVectorFields)}
                    onChangeValues={(values) => setField('basicVectorFields', listToCsv(values))}
                    options={vectorFieldOptions}
                  />
                  <div className={styles.smallHint}>Vector fields detected from the selected index.</div>
                </>
              ) : (
                <Input
                  value={draft.basicVectorFields}
                  onChange={(e) => setField('basicVectorFields', e.target.value)}
                  placeholder="vectorField"
                />
              )}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.labelRow}>
                <Label>Vector Text</Label>
                <InfoIcon tooltip="Text to be vectorized by the service." />
              </div>
              <TextArea
                rows={2}
                value={draft.basicVectorText}
                onChange={(e) => setField('basicVectorText', e.target.value)}
                placeholder="Text to vectorize"
              />
            </div>
          </>
        ) : null}

        <div className={styles.inlineRow}>
          <div className={styles.fieldRow}>
            <div className={styles.labelRow}>
              <Label>Top</Label>
              <InfoIcon tooltip={tip('top') || ''} />
            </div>
            <Input type="number" value={draft.top} onChange={(e) => setField('top', Math.max(0, Number(e.target.value)))} />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.labelRow}>
              <Label>Skip</Label>
              <InfoIcon tooltip={tip('skip') || ''} />
            </div>
            <Input type="number" value={draft.skip} onChange={(e) => setField('skip', Math.max(0, Number(e.target.value)))} />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.labelRow}>
            <Label>Filter</Label>
            <InfoIcon tooltip={tip('filter') || ''} />
          </div>
          <TextArea rows={3} value={draft.filter} onChange={(e) => setField('filter', e.target.value)} placeholder="field eq 'value'" />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.labelRow}>
            <Label>Select</Label>
            <InfoIcon tooltip={tip('select') || ''} />
          </div>
          {retrievableFieldOptions.length > 0 ? (
            <>
              <SelectWithDescription
                multiple
                closeOnSelect={false}
                value={csvToList(draft.select)}
                onChangeValues={(values) => setField('select', listToCsv(values))}
                options={retrievableFieldOptions}
              />
              <div className={styles.smallHint}>Retrievable fields from the selected index.</div>
            </>
          ) : (
            <>
              <Input value={draft.select} onChange={(e) => setField('select', e.target.value)} placeholder="field1,field2" />
              <div className={styles.smallHint}>Comma-separated field list.</div>
            </>
          )}
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.labelRow}>
            <Label>Order By</Label>
            <InfoIcon tooltip={tip('orderby') || ''} />
          </div>
          <div className={styles.inlineRow}>
            <div className={styles.fieldRow}>
              <SelectWithDescription
                value={orderbyFieldPick}
                onChange={(e) => {
                  const field = e.target.value;
                  const next = formatOrderbySingle(field, orderbyDirPick);
                  setField('orderby', next);
                }}
                options={[
                  { value: '', label: '(none)', description: 'No explicit sort.' },
                  { value: 'search.score()', label: 'search.score()', description: 'Sort by relevance score.' },
                  ...sortableFieldOptions
                ]}
              />
            </div>
            <div className={styles.fieldRow} style={{ maxWidth: 140 }}>
              <SelectWithDescription
                value={orderbyDirPick}
                onChange={(e) => {
                  const dir = e.target.value as 'asc' | 'desc';
                  if (!orderbyFieldPick) return;
                  const next = formatOrderbySingle(orderbyFieldPick, dir);
                  setField('orderby', next);
                }}
                options={[
                  { value: 'asc', label: 'asc', description: 'Ascending' },
                  { value: 'desc', label: 'desc', description: 'Descending' }
                ]}
              />
            </div>
          </div>
          <div className={styles.smallHint}>Applies automatically. Current: {draft.orderby || '(none)'}</div>
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

            <div
              className={styles.sectionHeader}
              role="button"
              tabIndex={0}
              onClick={() =>
                setAdvancedSectionsOpen((s) => ({
                  ...s,
                  searchScoring: !s.searchScoring
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAdvancedSectionsOpen((s) => ({
                    ...s,
                    searchScoring: !s.searchScoring
                  }));
                }
              }}
            >
              <div className={styles.sectionTitle}>
                <i className={`fas fa-chevron-${advancedSectionsOpen.searchScoring ? 'down' : 'right'}`}></i>
                Search & Scoring
              </div>
              <span className={styles.badge}>{advancedSectionsOpen.searchScoring ? 'Hide' : 'Show'}</span>
            </div>
            {advancedSectionsOpen.searchScoring ? (
              <div style={{ paddingTop: 8 }}>
                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Search Fields</Label>
                    <InfoIcon tooltip={tip('searchFields') || ''} />
                  </div>
                  {searchableFieldOptions.length > 0 ? (
                    <>
                      <SelectWithDescription
                        multiple
                        closeOnSelect={false}
                        value={csvToList(draft.searchFields)}
                        onChangeValues={(values) => setField('searchFields', listToCsv(values))}
                        options={searchableFieldOptions}
                      />
                      <div className={styles.smallHint}>Searchable fields from the selected index.</div>
                    </>
                  ) : (
                    <Input
                      value={draft.searchFields}
                      onChange={(e) => setField('searchFields', e.target.value)}
                      placeholder="field1,field2"
                    />
                  )}
                </div>

                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Scoring Profile</Label>
                      <InfoIcon tooltip={tip('scoringProfile') || ''} />
                    </div>
                    {indexScoringProfilesCount > 0 ? (
                      <SelectWithDescription
                        value={draft.scoringProfile}
                        onChange={(e) => setField('scoringProfile', e.target.value)}
                        options={scoringProfileOptionsFromIndex}
                      />
                    ) : (
                      <Input
                        value={draft.scoringProfile}
                        onChange={(e) => setField('scoringProfile', e.target.value)}
                        placeholder="optional"
                      />
                    )}
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
                    <Input type="number" value={draft.minimumCoverage} onChange={(e) => setField('minimumCoverage', Number(e.target.value))} />
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
              </div>
            ) : null}

            <div
              className={styles.sectionHeader}
              role="button"
              tabIndex={0}
              onClick={() =>
                setAdvancedSectionsOpen((s) => ({
                  ...s,
                  facetsHighlight: !s.facetsHighlight
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAdvancedSectionsOpen((s) => ({
                    ...s,
                    facetsHighlight: !s.facetsHighlight
                  }));
                }
              }}
            >
              <div className={styles.sectionTitle}>
                <i className={`fas fa-chevron-${advancedSectionsOpen.facetsHighlight ? 'down' : 'right'}`}></i>
                Facets & Highlighting
              </div>
              <span className={styles.badge}>{advancedSectionsOpen.facetsHighlight ? 'Hide' : 'Show'}</span>
            </div>
            {advancedSectionsOpen.facetsHighlight ? (
              <div style={{ paddingTop: 8 }}>
                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Facets</Label>
                    <InfoIcon tooltip={tip('facets') || ''} />
                  </div>
                  {facetableFieldOptions.length > 0 ? (
                    <div className={styles.inlineRow} style={{ marginBottom: 8 }}>
                      <div className={styles.fieldRow}>
                        <SelectWithDescription
                          value={facetFieldPick}
                          onChange={(e) => setFacetFieldPick(e.target.value)}
                          options={[{ value: '', label: 'Pick facetable field', description: undefined }, ...facetableFieldOptions]}
                        />
                      </div>
                      <div className={styles.fieldRow} style={{ maxWidth: 140 }}>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            if (!facetFieldPick) return;
                            setField('facets', Array.from(new Set([...(draft.facets || []), facetFieldPick])));
                          }}
                          disabled={!facetFieldPick}
                          title="Add a simple facet expression"
                        >
                          <i className="fas fa-plus"></i> Add
                        </Button>
                      </div>
                    </div>
                  ) : null}
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
                  {searchableFieldOptions.length > 0 ? (
                    <>
                      <SelectWithDescription
                        multiple
                        closeOnSelect={false}
                        value={csvToList(draft.highlight)}
                        onChangeValues={(values) => setField('highlight', listToCsv(values))}
                        options={searchableFieldOptions}
                      />
                      <div className={styles.smallHint}>Searchable fields from the selected index.</div>
                    </>
                  ) : (
                    <Input value={draft.highlight} onChange={(e) => setField('highlight', e.target.value)} placeholder="field1,field2" />
                  )}
                  <div className={styles.inlineRow} style={{ marginTop: 8 }}>
                    <div className={styles.fieldRow}>
                      <div className={styles.labelRow}>
                        <Label>Pre Tag</Label>
                        <InfoIcon tooltip={tip('highlightPreTag') || ''} />
                      </div>
                      <Input
                        value={draft.highlightPreTag}
                        onChange={(e) => setField('highlightPreTag', e.target.value)}
                        placeholder="<em>"
                      />
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={styles.labelRow}>
                        <Label>Post Tag</Label>
                        <InfoIcon tooltip={tip('highlightPostTag') || ''} />
                      </div>
                      <Input
                        value={draft.highlightPostTag}
                        onChange={(e) => setField('highlightPostTag', e.target.value)}
                        placeholder="</em>"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={styles.sectionHeader}
              role="button"
              tabIndex={0}
              onClick={() =>
                setAdvancedSectionsOpen((s) => ({
                  ...s,
                  semantic: !s.semantic
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAdvancedSectionsOpen((s) => ({
                    ...s,
                    semantic: !s.semantic
                  }));
                }
              }}
            >
              <div className={styles.sectionTitle}>
                <i className={`fas fa-chevron-${advancedSectionsOpen.semantic ? 'down' : 'right'}`}></i>
                Semantic
              </div>
              <span className={styles.badge}>{advancedSectionsOpen.semantic ? 'Hide' : 'Show'}</span>
            </div>
            {advancedSectionsOpen.semantic ? (
              <div style={{ paddingTop: 8 }}>
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

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Semantic Configuration</Label>
                    <InfoIcon tooltip={tip('semanticConfiguration') || ''} />
                  </div>
                  {indexSemanticConfigurationsCount > 0 ? (
                    <SelectWithDescription
                      value={draft.semanticConfiguration}
                      onChange={(e) => setField('semanticConfiguration', e.target.value)}
                      options={semanticConfigOptionsFromIndex}
                    />
                  ) : (
                    <Input
                      value={draft.semanticConfiguration}
                      onChange={(e) => setField('semanticConfiguration', e.target.value)}
                      placeholder="optional"
                    />
                  )}
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Semantic Fields</Label>
                    <InfoIcon tooltip={tip('semanticFields') || ''} />
                  </div>
                  {searchableFieldOptions.length > 0 ? (
                    <SelectWithDescription
                      multiple
                      closeOnSelect={false}
                      value={csvToList(draft.semanticFields)}
                      onChangeValues={(values) => setField('semanticFields', listToCsv(values))}
                      options={searchableFieldOptions}
                    />
                  ) : (
                    <Input value={draft.semanticFields} onChange={(e) => setField('semanticFields', e.target.value)} placeholder="field1,field2" />
                  )}
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Semantic Query</Label>
                    <InfoIcon tooltip={tip('semanticQuery') || ''} />
                  </div>
                  <TextArea rows={2} value={draft.semanticQuery} onChange={(e) => setField('semanticQuery', e.target.value)} placeholder="optional" />
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
              </div>
            ) : null}

            <div
              className={styles.sectionHeader}
              role="button"
              tabIndex={0}
              onClick={() =>
                setAdvancedSectionsOpen((s) => ({
                  ...s,
                  languageRewrites: !s.languageRewrites
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAdvancedSectionsOpen((s) => ({
                    ...s,
                    languageRewrites: !s.languageRewrites
                  }));
                }
              }}
            >
              <div className={styles.sectionTitle}>
                <i className={`fas fa-chevron-${advancedSectionsOpen.languageRewrites ? 'down' : 'right'}`}></i>
                Language & Rewrites
              </div>
              <span className={styles.badge}>{advancedSectionsOpen.languageRewrites ? 'Hide' : 'Show'}</span>
            </div>
            {advancedSectionsOpen.languageRewrites ? (
              <div style={{ paddingTop: 8 }}>
                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Query Language</Label>
                      <InfoIcon tooltip={tip('queryLanguage') || ''} />
                    </div>
                    <SelectWithDescription
                      value={draft.queryLanguage}
                      onChange={(e) => setField('queryLanguage', e.target.value)}
                      options={queryLanguageOptions}
                    />
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Speller</Label>
                      <InfoIcon tooltip={tip('speller') || ''} />
                    </div>
                    <SelectWithDescription value={draft.speller} onChange={(e) => setField('speller', e.target.value)} options={spellerOptions} />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Query Rewrites</Label>
                    <InfoIcon tooltip={tip('queryRewrites') || ''} />
                  </div>
                  <SelectWithDescription
                    value={draft.queryRewrites}
                    onChange={(e) => setField('queryRewrites', e.target.value)}
                    options={queryRewritesOptions}
                  />
                  <div className={styles.smallHint}>
                    For advanced syntax like <code>generative|count-3</code>, use the Request JSON editor.
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={styles.sectionHeader}
              role="button"
              tabIndex={0}
              onClick={() =>
                setAdvancedSectionsOpen((s) => ({
                  ...s,
                  diagnostics: !s.diagnostics
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAdvancedSectionsOpen((s) => ({
                    ...s,
                    diagnostics: !s.diagnostics
                  }));
                }
              }}
            >
              <div className={styles.sectionTitle}>
                <i className={`fas fa-chevron-${advancedSectionsOpen.diagnostics ? 'down' : 'right'}`}></i>
                Diagnostics & Session
              </div>
              <span className={styles.badge}>{advancedSectionsOpen.diagnostics ? 'Hide' : 'Show'}</span>
            </div>
            {advancedSectionsOpen.diagnostics ? (
              <div style={{ paddingTop: 8 }}>
                <div className={styles.inlineRow}>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Debug</Label>
                      <InfoIcon tooltip={tip('debug') || ''} />
                    </div>
                    <SelectWithDescription
                      multiple
                      closeOnSelect={false}
                      value={debugSelectedValues}
                      onChangeValues={(values) => {
                        const v = (values || []).map((x) => String(x).trim()).filter(Boolean);
                        // If user selects 'disabled', clear everything.
                        if (v.includes('disabled')) {
                          setField('debug', 'disabled');
                          return;
                        }
                        // If user selects 'all', force just 'all'.
                        if (v.includes('all')) {
                          setField('debug', 'all');
                          return;
                        }
                        setField('debug', v.length > 0 ? v.join('|') : 'disabled');
                      }}
                      options={debugOptions}
                    />
                    <div className={styles.smallHint}>Supports multiple selections; sends pipe-separated value to the API.</div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.labelRow}>
                      <Label>Session Id</Label>
                      <InfoIcon tooltip={tip('sessionId') || ''} />
                    </div>
                    <Input value={draft.sessionId} onChange={(e) => setField('sessionId', e.target.value)} placeholder="optional" />
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={styles.sectionHeader}
              role="button"
              tabIndex={0}
              onClick={() =>
                setAdvancedSectionsOpen((s) => ({
                  ...s,
                  vectorHybrid: !s.vectorHybrid
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAdvancedSectionsOpen((s) => ({
                    ...s,
                    vectorHybrid: !s.vectorHybrid
                  }));
                }
              }}
            >
              <div className={styles.sectionTitle}>
                <i className={`fas fa-chevron-${advancedSectionsOpen.vectorHybrid ? 'down' : 'right'}`}></i>
                Vector / Hybrid
                <span className={styles.badge}>{draft.vectorQueries.length} queries</span>
              </div>
              <span className={styles.badge}>{advancedSectionsOpen.vectorHybrid ? 'Hide' : 'Show'}</span>
            </div>
            {advancedSectionsOpen.vectorHybrid ? (
              <div style={{ paddingTop: 8 }}>
                <div className={styles.fieldRow}>
                  <div className={styles.labelRow}>
                    <Label>Hybrid Search Overrides</Label>
                    <InfoIcon tooltip={tip('hybridSearch') || ''} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={draft.hybridSearchEnabled} onChange={(e) => setField('hybridSearchEnabled', e.target.checked)} />
                    Use custom hybrid settings
                  </label>
                  <div className={styles.smallHint}>Only include these settings when you want to override the defaults.</div>
                </div>

                {draft.hybridSearchEnabled ? (
                  <div className={styles.inlineRow}>
                    <div className={styles.fieldRow}>
                      <div className={styles.labelRow}>
                        <Label>Count And Facet Mode</Label>
                      </div>
                      <SelectWithDescription
                        value={draft.hybridCountAndFacetMode}
                        onChange={(e) => setField('hybridCountAndFacetMode', e.target.value)}
                        options={hybridCountAndFacetModeOptions}
                      />
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.labelRow}>
                        <Label>Max Text Recall Size</Label>
                      </div>
                      <Input
                        type="number"
                        value={draft.hybridMaxTextRecallSize}
                        onChange={(e) => {
                          const v = e.target.value;
                          setField('hybridMaxTextRecallSize', v === '' ? '' : Number(v));
                        }}
                        placeholder="1000"
                      />
                    </div>
                  </div>
                ) : null}

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
                  <div className={styles.smallHint}>Uses the shared VectorQuery config. Editing here will disable “Vector Search (simple)”.</div>
                </div>
              </div>
            ) : null}
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
              setDraft((d) => ({ ...d, basicVectorEnabled: false, vectorFilterMode: nextMode, vectorQueries: nextQueries }));
            }}
          />
        ) : null}
      </div>
    </Card>
  );
};
