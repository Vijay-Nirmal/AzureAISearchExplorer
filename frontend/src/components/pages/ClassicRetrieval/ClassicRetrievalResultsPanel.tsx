import React, { useState } from 'react';

import { Card } from '../../common/Card';
import { JsonView } from '../../common/JsonView';

import type { ColumnDef, TabId } from './classicRetrievalTypes';
import styles from './ClassicRetrievalPage.module.css';
import { ClassicRetrievalInsights } from './ClassicRetrievalInsights';
import { ClassicRetrievalResultsTable } from './ClassicRetrievalResultsTable';

type ResponseTips = {
  count?: string;
  coverage?: string;
  answers?: string;
};

type Props = {
  loading: boolean;
  error: string | null;

  rawResponse: Record<string, unknown> | null;
  results: Record<string, unknown>[];
  answers: unknown[];
  count: unknown;
  coverage: unknown;
  responseTips: ResponseTips;
  scoreTip?: string;

  columns: ColumnDef[];
  keyFieldName: string | null;

  onAddColumn: (col: ColumnDef) => void;
  onRemoveColumn: (idx: number) => void;
  onResetColumns: () => void;

  onOpenDetails: (doc: Record<string, unknown>) => void;
  onViewDocumentJson: (doc: Record<string, unknown>) => void;
  onExpandCell: (value: string) => void;

  cellValue: (doc: Record<string, unknown>, path: string) => string;
};

export const ClassicRetrievalResultsPanel: React.FC<Props> = ({
  loading,
  error,
  rawResponse,
  results,
  answers,
  count,
  coverage,
  responseTips,
  scoreTip,
  columns,
  keyFieldName,
  onAddColumn,
  onRemoveColumn,
  onResetColumns,
  onOpenDetails,
  onViewDocumentJson,
  onExpandCell,
  cellValue
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('table');

  return (
    <Card className={styles.panel} style={{ padding: 0 }}>
      <div className={styles.tabs}>
        <div className={`${styles.tab} ${activeTab === 'table' ? styles.tabActive : ''}`} onClick={() => setActiveTab('table')}>
          <i className="fas fa-table"></i>&nbsp;Table
        </div>
        <div
          className={`${styles.tab} ${activeTab === 'insights' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <i className="fas fa-chart-column"></i>&nbsp;Insights
        </div>
        <div className={`${styles.tab} ${activeTab === 'json' ? styles.tabActive : ''}`} onClick={() => setActiveTab('json')}>
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
              <i className="fas fa-percent"></i> {(coverage as number).toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.resultsBody}>
        {activeTab === 'table' ? (
          <ClassicRetrievalResultsTable
            loading={loading}
            error={error}
            rawResponse={rawResponse}
            results={results}
            columns={columns}
            keyFieldName={keyFieldName}
            scoreTip={scoreTip}
            onAddColumn={onAddColumn}
            onRemoveColumn={onRemoveColumn}
            onResetColumns={onResetColumns}
            onOpenDetails={onOpenDetails}
            onViewDocumentJson={onViewDocumentJson}
            onExpandCell={onExpandCell}
            cellValue={cellValue}
          />
        ) : null}
        {activeTab === 'insights' ? (
          <ClassicRetrievalInsights
            rawResponse={rawResponse}
            results={results}
            answers={answers}
            count={count}
            coverage={coverage}
            responseTips={responseTips}
          />
        ) : null}
        {activeTab === 'json' ? (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <JsonView data={rawResponse || '// Setup query and click Run'} options={{ lineNumbers: 'on', minimap: { enabled: true } }} />
          </div>
        ) : null}
      </div>
    </Card>
  );
};
