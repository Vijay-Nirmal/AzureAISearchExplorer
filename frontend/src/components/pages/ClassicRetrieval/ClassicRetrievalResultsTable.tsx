import React, { useCallback, useState } from 'react';

import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { InfoIcon } from '../../common/InfoIcon';
import { TruncatedTextCell } from '../../common/TruncatedTextCell';

import type { ColumnDef } from './classicRetrievalTypes';
import styles from './ClassicRetrievalPage.module.css';

type Props = {
  loading: boolean;
  error: string | null;
  rawResponse: Record<string, unknown> | null;
  results: Record<string, unknown>[];

  columns: ColumnDef[];
  keyFieldName: string | null;

  scoreTip?: string;

  onAddColumn: (col: ColumnDef) => void;
  onRemoveColumn: (idx: number) => void;
  onResetColumns: () => void;

  onOpenDetails: (doc: Record<string, unknown>) => void;
  onViewDocumentJson: (doc: Record<string, unknown>) => void;
  onExpandCell: (value: string) => void;

  cellValue: (doc: Record<string, unknown>, path: string) => string;
};

export const ClassicRetrievalResultsTable: React.FC<Props> = ({
  loading,
  error,
  rawResponse,
  results,
  columns,
  keyFieldName,
  scoreTip,
  onAddColumn,
  onRemoveColumn,
  onResetColumns,
  onOpenDetails,
  onViewDocumentJson,
  onExpandCell,
  cellValue
}) => {
  const [newColHeader, setNewColHeader] = useState('');
  const [newColPath, setNewColPath] = useState('');

  const addColumn = useCallback(() => {
    const header = newColHeader.trim();
    const path = newColPath.trim();
    if (!header || !path) return;
    onAddColumn({ header, path });
    setNewColHeader('');
    setNewColPath('');
  }, [newColHeader, newColPath, onAddColumn]);

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
            <Button variant="secondary" onClick={onResetColumns} title="Reset columns">
              Reset
            </Button>
          </div>
        </div>
        <div className={styles.smallHint}>
          Path supports dot notation ("Field.SubField"). The index key field is detected from the index schema.
        </div>
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
                        {col.path === '@search.score' ? (
                          <InfoIcon tooltip={scoreTip || 'Relevance score of the document.'} />
                        ) : null}
                        {keyFieldName && col.path === keyFieldName ? (
                          <span title="Index key field" style={{ marginLeft: 6, opacity: 0.85 }}>
                            <i className="fas fa-key"></i>
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.thPath}>{col.path}</span>
                    </div>
                    <Button
                      variant="icon"
                      className={styles.iconBtn}
                      title="Remove column"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveColumn(idx);
                      }}
                      icon={<i className="fas fa-times"></i>}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((doc, i) => (
              <tr key={i} className={styles.row} onClick={() => onOpenDetails(doc)}>
                <td className={styles.td} style={{ width: 44 }}>
                  <Button
                    variant="icon"
                    className={styles.iconBtn}
                    title="View document JSON"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocumentJson(doc);
                    }}
                    icon={<i className="fas fa-code"></i>}
                  />
                </td>
                {columns.map((col, cIdx) => {
                  const value = cellValue(doc, col.path);
                  return (
                    <TruncatedTextCell
                      key={cIdx}
                      value={value}
                      onExpand={onExpandCell}
                      maxWidth="420px"
                      compact
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
