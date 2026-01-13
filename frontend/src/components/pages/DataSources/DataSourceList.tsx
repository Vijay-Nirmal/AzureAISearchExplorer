import React, { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { datasourcesService } from '../../../services/datasourcesService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import type { DataSourceListItem } from '../../../types/DataSourceModels';

interface DataSourceListProps {
  onView: (dataSourceName: string) => void;
  onEdit: (dataSourceName: string) => void;
  onCreate: () => void;
}

const DataSourceList: React.FC<DataSourceListProps> = ({ onView, onEdit, onCreate }) => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();
  const [items, setItems] = useState<DataSourceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchDataSources = async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const data = await datasourcesService.listDataSources(activeConnectionId);
      setItems(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load data sources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBreadcrumbs([{ label: 'Data Sources' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    void fetchDataSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnectionId]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter(i => (i.name || '').toLowerCase().includes(f));
  }, [filter, items]);

  const handleDelete = async (name: string) => {
    if (!activeConnectionId) return;
    if (!confirm(`Are you sure you want to delete data source '${name}'?`)) return;
    try {
      await datasourcesService.deleteDataSource(activeConnectionId, name);
      await fetchDataSources();
    } catch (error) {
      console.error(error);
      alert('Failed to delete data source.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Button variant="primary" onClick={onCreate}>
          <i className="fas fa-plus"></i> Create Data Source
        </Button>
        <Button onClick={fetchDataSources}>
          <i className="fas fa-sync"></i> Refresh
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Input
            placeholder="Filter data sources..."
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
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--hover-color)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 16px' }}>Name</th>
                <th style={{ padding: '8px 16px' }}>Type</th>
                <th style={{ padding: '8px 16px' }}>Container</th>
                <th style={{ padding: '8px 16px' }}>Description</th>
                <th style={{ padding: '8px 16px', width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', opacity: 0.7 }}>No data sources found.</td></tr>
              ) : (
                filtered.map((ds) => (
                  <tr key={ds.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td
                      style={{ padding: '8px 16px', color: 'var(--accent-color)', cursor: 'pointer' }}
                      title="Open data source"
                      onClick={() => onView(ds.name)}
                    >
                      <i className="fas fa-database" style={{ marginRight: '8px', opacity: 0.7 }}></i>
                      {ds.name}
                    </td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{ds.type || '-'}</td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{ds.containerName || '-'}</td>
                    <td style={{ padding: '8px 16px', maxWidth: '520px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ds.description || '-'}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="icon" title="Open" onClick={() => onView(ds.name)} icon={<i className="fas fa-eye"></i>} />
                        <Button variant="icon" title="Edit" onClick={() => onEdit(ds.name)} icon={<i className="fas fa-pen"></i>} />
                        <Button variant="icon" title="Delete" onClick={() => handleDelete(ds.name)} icon={<i className="fas fa-trash"></i>} />
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

export default DataSourceList;
