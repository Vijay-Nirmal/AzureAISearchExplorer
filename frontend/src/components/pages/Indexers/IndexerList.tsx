import React, { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexersService } from '../../../services/indexersService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import type { IndexerListItem } from '../../../types/IndexerModels';

interface IndexerListProps {
  onEdit: (indexerName: string) => void;
  onRuns: (indexerName: string) => void;
  onCreate: () => void;
}

const IndexerList: React.FC<IndexerListProps> = ({ onEdit, onRuns, onCreate }) => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();
  const [indexers, setIndexers] = useState<IndexerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchIndexers = async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const data = await indexersService.listIndexers(activeConnectionId);
      setIndexers(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load indexers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBreadcrumbs([{ label: 'Indexers' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    void fetchIndexers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnectionId]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return indexers;
    return indexers.filter((x) => x.name.toLowerCase().includes(f));
  }, [indexers, filter]);

  const handleDelete = async (indexerName: string) => {
    if (!activeConnectionId) return;
    if (!confirm(`Are you sure you want to delete indexer '${indexerName}'?`)) return;

    try {
      await indexersService.deleteIndexer(activeConnectionId, indexerName);
      await fetchIndexers();
    } catch (error) {
      console.error(error);
      alert('Failed to delete indexer');
    }
  };

  const statusPill = (disabled?: boolean) => {
    const isDisabled = !!disabled;
    return (
      <span
        style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '999px',
          border: '1px solid var(--border-color)',
          background: isDisabled ? 'var(--status-warn-bg)' : 'var(--status-ok-bg)',
          color: isDisabled ? 'var(--status-warn-text)' : 'var(--status-ok-text)',
          opacity: 0.95
        }}
        title={isDisabled ? 'Disabled' : 'Enabled'}
      >
        {isDisabled ? 'Disabled' : 'Enabled'}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button variant="primary" onClick={onCreate}>
          <i className="fas fa-plus"></i> Create Indexer
        </Button>
        <Button onClick={fetchIndexers}>
          <i className="fas fa-sync"></i> Refresh
        </Button>

        <div style={{ marginLeft: 'auto' }}>
          <Input
            placeholder="Filter indexers..."
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
                <th style={{ padding: '8px 16px' }}>Status</th>
                <th style={{ padding: '8px 16px' }}>Datasource</th>
                <th style={{ padding: '8px 16px' }}>Target Index</th>
                <th style={{ padding: '8px 16px' }}>Skillset</th>
                <th style={{ padding: '8px 16px', width: '210px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center' }}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-color)', opacity: 0.7 }}>
                    No indexers found.
                  </td>
                </tr>
              ) : (
                filtered.map((idx) => (
                  <tr key={idx.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 16px', color: 'var(--accent-color)' }}>
                      <i className="fas fa-robot" style={{ marginRight: '8px', opacity: 0.7 }}></i>
                      {idx.name}
                      {idx.description ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-color)', opacity: 0.7, marginTop: '2px' }}>{idx.description}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: '8px 16px' }}>{statusPill(idx.disabled)}</td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{idx.dataSourceName || '-'}</td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{idx.targetIndexName || '-'}</td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{idx.skillsetName || '-'}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="icon" onClick={() => onRuns(idx.name)} title="Runs / Status">
                          <i className="fas fa-chart-line"></i>
                        </Button>
                        <Button variant="icon" onClick={() => onEdit(idx.name)} title="Edit">
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button variant="icon" onClick={() => handleDelete(idx.name)} title="Delete">
                          <i className="fas fa-trash"></i>
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
    </div>
  );
};

export default IndexerList;
