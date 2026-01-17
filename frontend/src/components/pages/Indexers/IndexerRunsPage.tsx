import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexersService } from '../../../services/indexersService';
import { alertService } from '../../../services/alertService';
import { confirmService } from '../../../services/confirmService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { InfoIcon } from '../../common/InfoIcon';
import { Modal } from '../../common/Modal';
import { TextArea } from '../../common/TextArea';
import { JsonView } from '../../common/JsonView';
import { Input } from '../../common/Input';
import { TruncatedTextCell } from '../../common/TruncatedTextCell';

const RunsHistoryChart = React.lazy(() => import('./RunsHistoryChart'));

import type {
  IndexerExecutionResult,
  SearchIndexerError,
  SearchIndexerStatus,
  SearchIndexerWarning
} from '../../../types/IndexerStatusModels';
import { getFieldTooltipFromSchema, getResolvedFieldDefinition, getResolvedFieldOptions } from '../../common/configDriven/configDrivenUtils';
import { indexerStatusSchema, INDEXER_STATUS_DISCRIMINATOR } from './indexerStatusTooltips';

interface IndexerRunsPageProps {
  indexerName: string;
  onBack: () => void;
  onEdit: (indexerName: string) => void;
}

type RunDetailsTab = 'summary' | 'errors' | 'warnings' | 'raw';
type RunDetailsState = { run: IndexerExecutionResult; tab: RunDetailsTab };

const parseIso = (v?: string) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateTime = (v?: string) => {
  const d = parseIso(v);
  if (!d) return '-';
  return d.toLocaleString();
};

const formatDuration = (start?: string, end?: string) => {
  const s = parseIso(start);
  const e = parseIso(end);
  if (!s || !e) return '-';
  const ms = e.getTime() - s.getTime();
  if (ms < 0) return '-';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return `${min}m ${rem}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
};

const countOrDash = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString() : '-');

type ChartRow = {
  t: number;
  processed: number;
  failed: number;
  errors: number;
  warnings: number;
  status: string;
  statusDetail: string;
};

const IndexerRunsPage: React.FC<IndexerRunsPageProps> = ({ indexerName, onBack, onEdit }) => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();

  const onBackRef = useRef(onBack);
  const onEditRef = useRef(onEdit);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);
  useEffect(() => {
    onEditRef.current = onEdit;
  }, [onEdit]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SearchIndexerStatus | null>(null);
  const [runDetails, setRunDetails] = useState<RunDetailsState | null>(null);
  const [runIssuesFilter, setRunIssuesFilter] = useState('');
  const [expandedCellText, setExpandedCellText] = useState<string | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [docKeysText, setDocKeysText] = useState('');
  const [dsIdsText, setDsIdsText] = useState('');

  const refresh = async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const s = await indexersService.getIndexerStatus(activeConnectionId, indexerName);
      setStatus(s);
    } catch (error) {
      console.error(error);
      alertService.show({ title: 'Error', message: 'Failed to load indexer status.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Indexers', onClick: () => onBackRef.current() },
      { label: indexerName, onClick: () => onEditRef.current(indexerName) },
      { label: 'Runs & Status' }
    ]);
    return () => setBreadcrumbs([]);
  }, [indexerName, setBreadcrumbs]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnectionId, indexerName]);

  const execHistory = useMemo(() => status?.executionHistory ?? [], [status]);

  const chartRows = useMemo<ChartRow[]>(() => {
    const rows = execHistory
      .map((r) => {
        const t = parseIso(r.startTime)?.getTime();
        if (!t) return null;
        return {
          t,
          processed: typeof r.itemsProcessed === 'number' ? r.itemsProcessed : 0,
          failed: typeof r.itemsFailed === 'number' ? r.itemsFailed : 0,
          errors: Array.isArray(r.errors) ? r.errors.length : 0,
          warnings: Array.isArray(r.warnings) ? r.warnings.length : 0,
          status: String(r.status || ''),
          statusDetail: String(r.statusDetail || '')
        };
      })
      .filter(Boolean) as ChartRow[];

    // history is reverse chronological; chart left-to-right
    return rows.slice().reverse();
  }, [execHistory]);

  const statusFieldTooltip = (fieldKey: string) =>
    getFieldTooltipFromSchema(indexerStatusSchema, INDEXER_STATUS_DISCRIMINATOR, fieldKey);

  const describeEnumValue = (fieldKey: string, value: string | undefined) => {
    if (!value) return undefined;
    const def = getResolvedFieldDefinition(indexerStatusSchema, INDEXER_STATUS_DISCRIMINATOR, fieldKey);
    if (!def) return undefined;
    const opt = getResolvedFieldOptions(def).find((o) => o.value === value);
    return opt?.description;
  };

  const runAction = async (kind: 'run' | 'reset' | 'resync') => {
    if (!activeConnectionId) return;

    const verb = kind === 'run' ? 'run' : kind;
    const title = kind === 'run' ? 'Trigger a run now?' : kind === 'reset' ? 'Reset this indexer?' : 'Resync this indexer?';
    const confirmed = await confirmService.confirm({
      title: 'Confirm Action',
      message: `${title}\n\nThis will ${verb} '${indexerName}'.`
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      if (kind === 'run') await indexersService.runIndexer(activeConnectionId, indexerName);
      if (kind === 'reset') await indexersService.resetIndexer(activeConnectionId, indexerName);
      if (kind === 'resync') await indexersService.resyncIndexer(activeConnectionId, indexerName);
      await refresh();
    } catch (error) {
      console.error(error);
      alertService.show({ title: 'Error', message: `Failed to ${verb} indexer.` });
    } finally {
      setLoading(false);
    }
  };

  const submitResetDocs = async () => {
    if (!activeConnectionId) return;

    const documentKeys = docKeysText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    const datasourceDocumentIds = dsIdsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (documentKeys.length === 0 && datasourceDocumentIds.length === 0) {
      alertService.show({ title: 'Validation', message: 'Provide at least one document key or datasource document id.' });
      return;
    }

    setLoading(true);
    try {
      await indexersService.resetDocuments(activeConnectionId, indexerName, { documentKeys, datasourceDocumentIds });
      setResetModalOpen(false);
      setDocKeysText('');
      setDsIdsText('');
      await refresh();
    } catch (error) {
      console.error(error);
      alertService.show({ title: 'Error', message: 'Failed to reset documents.' });
    } finally {
      setLoading(false);
    }
  };

  const overallStatus = String(status?.status || '-');
  const overallStatusDesc = describeEnumValue('status', status?.status);

  const last = status?.lastResult;

  const pill = (tone: 'ok' | 'warn' | 'error' | 'info', text: string) => {
    const colors = {
      ok: { bg: 'var(--status-ok-bg)', fg: 'var(--status-ok-text)' },
      warn: { bg: 'var(--status-warn-bg)', fg: 'var(--status-warn-text)' },
      error: { bg: 'var(--sidebar-bg)', fg: 'var(--status-error-text)' },
      info: { bg: 'var(--sidebar-bg)', fg: 'var(--text-color)' }
    } as const;

    return (
      <span
        style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '999px',
          border: '1px solid var(--border-color)',
          background: colors[tone].bg,
          color: colors[tone].fg
        }}
      >
        {text}
      </span>
    );
  };

  const lastTone = (() => {
    const s = String(last?.status || '').toLowerCase();
    if (s === 'success') return 'ok' as const;
    if (s.includes('progress')) return 'info' as const;
    if (s.includes('transient')) return 'warn' as const;
    if (s.includes('fail') || s.includes('error')) return 'error' as const;
    return 'info' as const;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.15 }}>{indexerName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {pill('info', `Overall: ${overallStatus}`)}
            {overallStatusDesc ? <InfoIcon tooltip={overallStatusDesc} /> : null}
            {last?.status ? pill(lastTone, `Last: ${String(last.status)}`) : null}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <Button onClick={refresh} disabled={loading}>
            <i className="fas fa-sync"></i> Refresh
          </Button>
          <Button variant="secondary" onClick={() => onEdit(indexerName)}>
            <i className="fas fa-edit"></i> Edit
          </Button>
          <Button onClick={onBack}>Back</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', flex: 1, minHeight: 0 }}>
        <Card style={{ padding: '16px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              History
              {statusFieldTooltip('executionHistory') ? <InfoIcon tooltip={statusFieldTooltip('executionHistory')!} /> : null}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={() => runAction('run')} disabled={loading} title="Trigger a run">
                <i className="fas fa-play"></i> Run
              </Button>
              <Button onClick={() => runAction('resync')} disabled={loading} title="Resync changed data">
                <i className="fas fa-arrows-rotate"></i> Resync
              </Button>
              <Button onClick={() => runAction('reset')} disabled={loading} title="Reset change tracking state">
                <i className="fas fa-undo"></i> Reset
              </Button>
              <Button onClick={() => setResetModalOpen(true)} disabled={loading} title="Reset specific documents">
                <i className="fas fa-filter"></i> Reset Docs
              </Button>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <Suspense
              fallback={
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', background: 'var(--sidebar-bg)' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Loading chart…</div>
                </div>
              }
            >
              <RunsHistoryChart rows={chartRows} />
            </Suspense>
          </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', backgroundColor: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 10px' }}>Start</th>
                  <th style={{ padding: '8px 10px' }}>Duration</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px' }}>Processed</th>
                  <th style={{ padding: '8px 10px' }}>Failed</th>
                  <th style={{ padding: '8px 10px' }}>Errors</th>
                  <th style={{ padding: '8px 10px' }}>Warnings</th>
                  <th style={{ padding: '8px 10px', width: '70px' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {execHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '16px', opacity: 0.7, textAlign: 'center' }}>
                      No execution history.
                    </td>
                  </tr>
                ) : (
                  execHistory.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 10px' }}>{formatDateTime(r.startTime)}</td>
                      <td style={{ padding: '8px 10px' }}>{formatDuration(r.startTime, r.endTime)}</td>
                      <td style={{ padding: '8px 10px' }}>{String(r.status || '-')}</td>
                      <td style={{ padding: '8px 10px' }}>{countOrDash(r.itemsProcessed)}</td>
                      <td style={{ padding: '8px 10px' }}>{countOrDash(r.itemsFailed)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{Array.isArray(r.errors) ? r.errors.length : 0}</span>
                        {Array.isArray(r.errors) && r.errors.length > 0 ? (
                          <Button
                            variant="icon"
                            title="View errors"
                            onClick={() => setRunDetails({ run: r, tab: 'errors' })}
                            style={{ marginLeft: '6px' }}
                          >
                            <i className="fas fa-triangle-exclamation"></i>
                          </Button>
                        ) : null}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{Array.isArray(r.warnings) ? r.warnings.length : 0}</span>
                        {Array.isArray(r.warnings) && r.warnings.length > 0 ? (
                          <Button
                            variant="icon"
                            title="View warnings"
                            onClick={() => setRunDetails({ run: r, tab: 'warnings' })}
                            style={{ marginLeft: '6px' }}
                          >
                            <i className="fas fa-circle-info"></i>
                          </Button>
                        ) : null}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <Button variant="icon" onClick={() => setRunDetails({ run: r, tab: 'summary' })} title="View run details">
                          <i className="fas fa-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
          <Card style={{ padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Current State
              {statusFieldTooltip('currentState') ? <InfoIcon tooltip={statusFieldTooltip('currentState')!} /> : null}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px' }}>
              <div style={{ opacity: 0.75 }}>Mode</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{String(status?.currentState?.mode || '-')}</div>
              <div style={{ opacity: 0.75 }}>Resets</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>
                {Array.isArray(status?.currentState?.resetDocumentKeys) ? status?.currentState?.resetDocumentKeys.length : 0} keys,
                {' '}
                {Array.isArray(status?.currentState?.resetDatasourceDocumentIds) ? status?.currentState?.resetDatasourceDocumentIds.length : 0} datasource ids
              </div>
            </div>
          </Card>

          <Card style={{ padding: '16px', overflow: 'auto', minHeight: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Last Result
              {statusFieldTooltip('lastResult') ? <InfoIcon tooltip={statusFieldTooltip('lastResult')!} /> : null}
            </div>

            {!last ? (
              <div style={{ marginTop: '10px', opacity: 0.7, fontSize: '12px' }}>No last result yet.</div>
            ) : (
              <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', fontSize: '12px' }}>
                <div style={{ opacity: 0.75 }}>Status</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{String(last.status || '-')}</div>

                <div style={{ opacity: 0.75 }}>Status detail</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{String(last.statusDetail || '-')}</div>

                <div style={{ opacity: 0.75 }}>Start</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{formatDateTime(last.startTime)}</div>

                <div style={{ opacity: 0.75 }}>End</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{formatDateTime(last.endTime)}</div>

                <div style={{ opacity: 0.75 }}>Processed</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{countOrDash(last.itemsProcessed)}</div>

                <div style={{ opacity: 0.75 }}>Failed</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{countOrDash(last.itemsFailed)}</div>

                {last.errorMessage ? (
                  <>
                    <div style={{ opacity: 0.75 }}>Error</div>
                    <div style={{ color: 'var(--status-error-text)' }}>{String(last.errorMessage)}</div>
                  </>
                ) : null}

                <div style={{ opacity: 0.75 }}>Errors / warnings</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>
                  {(Array.isArray(last.errors) ? last.errors.length : 0).toLocaleString()} /{' '}
                  {(Array.isArray(last.warnings) ? last.warnings.length : 0).toLocaleString()}
                </div>

                <div style={{ opacity: 0.75 }}>Raw</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ height: '260px', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <JsonView data={last as unknown as Record<string, unknown>} height="100%" />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset specific documents"
        width="720px"
        footer={
          <>
            <Button onClick={() => setResetModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitResetDocs} disabled={loading}>
              <i className="fas fa-check"></i> Submit
            </Button>
          </>
        }
      >
        <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '12px' }}>
          This tells the indexer to prioritize re-ingesting specific documents.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              Document keys
              <InfoIcon tooltip="Search index document keys (one per line)." />
            </div>
            <TextArea value={docKeysText} onChange={(e) => setDocKeysText(e.target.value)} placeholder="docKey-1\ndocKey-2" />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              Datasource document ids
              <InfoIcon tooltip="Datasource document ids (one per line). Use this when you know the source system IDs." />
            </div>
            <TextArea value={dsIdsText} onChange={(e) => setDsIdsText(e.target.value)} placeholder="sourceId-1\nsourceId-2" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!runDetails}
        onClose={() => {
          setRunDetails(null);
          setRunIssuesFilter('');
        }}
        title="Run details"
        width="820px"
        footer={
          <>
            <Button
              onClick={() => {
                setRunDetails(null);
                setRunIssuesFilter('');
              }}
            >
              Close
            </Button>
          </>
        }
      >
        {runDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(['summary', 'errors', 'warnings', 'raw'] as RunDetailsTab[]).map((t) => (
                <Button
                  key={t}
                  variant={runDetails.tab === t ? 'primary' : 'secondary'}
                  onClick={() => setRunDetails({ ...runDetails, tab: t })}
                >
                  {t === 'summary' ? 'Summary' : t === 'errors' ? 'Errors' : t === 'warnings' ? 'Warnings' : 'Raw JSON'}
                </Button>
              ))}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                {(runDetails.tab === 'errors' || runDetails.tab === 'warnings') && (
                  <div style={{ width: '260px' }}>
                    <Input
                      value={runIssuesFilter}
                      onChange={(e) => setRunIssuesFilter(e.target.value)}
                      placeholder="Filter by key/message..."
                    />
                  </div>
                )}
              </div>
            </div>

            {runDetails.tab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Card style={{ padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '8px' }}>Outcome</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', fontSize: '12px' }}>
                    <div style={{ opacity: 0.75 }}>Status</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{String(runDetails.run.status || '-')}</div>
                    <div style={{ opacity: 0.75 }}>Detail</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{String(runDetails.run.statusDetail || '-')}</div>
                    <div style={{ opacity: 0.75 }}>Mode</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{String(runDetails.run.mode || '-')}</div>
                    <div style={{ opacity: 0.75 }}>Start</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{formatDateTime(runDetails.run.startTime)}</div>
                    <div style={{ opacity: 0.75 }}>End</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{formatDateTime(runDetails.run.endTime)}</div>
                    <div style={{ opacity: 0.75 }}>Duration</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{formatDuration(runDetails.run.startTime, runDetails.run.endTime)}</div>
                  </div>
                </Card>

                <Card style={{ padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '8px' }}>Counts</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', fontSize: '12px' }}>
                    <div style={{ opacity: 0.75 }}>Processed</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{countOrDash(runDetails.run.itemsProcessed)}</div>
                    <div style={{ opacity: 0.75 }}>Failed</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{countOrDash(runDetails.run.itemsFailed)}</div>
                    <div style={{ opacity: 0.75 }}>Errors</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{Array.isArray(runDetails.run.errors) ? runDetails.run.errors.length : 0}</div>
                    <div style={{ opacity: 0.75 }}>Warnings</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{Array.isArray(runDetails.run.warnings) ? runDetails.run.warnings.length : 0}</div>
                  </div>

                  {runDetails.run.errorMessage ? (
                    <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '6px' }}>Top-level error</div>
                      <div style={{ color: 'var(--status-error-text)', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{String(runDetails.run.errorMessage)}</div>
                    </div>
                  ) : null}
                </Card>
              </div>
            )}

            {(runDetails.tab === 'errors' || runDetails.tab === 'warnings') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {runDetails.tab === 'errors'
                    ? 'Errors are document-level failures encountered during indexing.'
                    : 'Warnings are non-fatal issues encountered during indexing.'}
                </div>

                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    maxWidth: '100%'
                  }}
                >
                  <table
                    className="data-grid"
                    style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', tableLayout: 'fixed' }}
                  >
                    <thead>
                      <tr style={{ textAlign: 'left', backgroundColor: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 10px', width: '340px' }}>Key</th>
                        <th style={{ padding: '8px 10px' }}>Message</th>
                        <th style={{ padding: '8px 10px', width: '160px' }}>Name</th>
                        <th style={{ padding: '8px 10px', width: '110px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const list: Array<SearchIndexerError | SearchIndexerWarning> =
                          runDetails.tab === 'errors'
                            ? (Array.isArray(runDetails.run.errors) ? runDetails.run.errors : [])
                            : (Array.isArray(runDetails.run.warnings) ? runDetails.run.warnings : []);

                        const getIssueMessage = (it: SearchIndexerError | SearchIndexerWarning): string => {
                          if (typeof (it as SearchIndexerError).errorMessage === 'string') return (it as SearchIndexerError).errorMessage!;
                          if (typeof (it as SearchIndexerWarning).message === 'string') return (it as SearchIndexerWarning).message!;
                          return '';
                        };

                        const f = runIssuesFilter.trim().toLowerCase();
                        const filtered = !f
                          ? list
                          : list.filter((it) => {
                              const key = String(it.key || '').toLowerCase();
                              const msg = String(getIssueMessage(it) || '').toLowerCase();
                              const name = String(it.name || '').toLowerCase();
                              const details = String(it.details || '').toLowerCase();
                              return key.includes(f) || msg.includes(f) || name.includes(f) || details.includes(f);
                            });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} style={{ padding: '14px', opacity: 0.7, textAlign: 'center' }}>
                                No {runDetails.tab}.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((it, i) => {
                          const key = String(it.key || '-');
                          const message = String(getIssueMessage(it) || '-');
                          const name = String(it.name || '-');
                          const statusCode = (it as SearchIndexerError).statusCode;
                          const details = String(it.details || '').trim();
                          const docLink = String(it.documentationLink || '').trim();

                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <TruncatedTextCell value={key} onExpand={setExpandedCellText} maxWidth="340px" />
                              <td style={{ padding: '8px 10px', overflow: 'hidden' }}>
                                <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message}</div>
                                {details ? (
                                  <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                    {details}
                                  </div>
                                ) : null}
                                {docLink ? (
                                  <div style={{ marginTop: '6px', fontSize: '11px' }}>
                                    <a href={docLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>
                                      Documentation
                                    </a>
                                  </div>
                                ) : null}
                              </td>
                              <TruncatedTextCell value={name} onExpand={setExpandedCellText} maxWidth="160px" />
                              <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                                {typeof statusCode === 'number' ? statusCode : '-'}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {runDetails.tab === 'raw' && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: '55vh', minHeight: '320px' }}>
                <JsonView data={runDetails.run as unknown as Record<string, unknown>} height="100%" />
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={expandedCellText !== null}
        onClose={() => setExpandedCellText(null)}
        title="Full value"
        width="820px"
        footer={<Button onClick={() => setExpandedCellText(null)}>Close</Button>}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '12px',
            background: 'var(--sidebar-bg)'
          }}
        >
          {expandedCellText ?? ''}
        </div>
      </Modal>
    </div>
  );
};

export default IndexerRunsPage;
