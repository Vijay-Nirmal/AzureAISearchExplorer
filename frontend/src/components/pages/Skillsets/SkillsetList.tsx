import React, { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { skillsetsService } from '../../../services/skillsetsService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import type { SkillsetListItem } from '../../../types/SkillsetModels';

interface SkillsetListProps {
  onEdit: (skillsetName: string) => void;
  onCreate: () => void;
}

const SkillsetList: React.FC<SkillsetListProps> = ({ onEdit, onCreate }) => {
  const { activeConnectionId } = useLayout();
  const [skillsets, setSkillsets] = useState<SkillsetListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchSkillsets = async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    try {
      const data = await skillsetsService.listSkillsets(activeConnectionId);
      setSkillsets(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load skillsets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillsets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnectionId]);

  const handleDelete = async (skillsetName: string) => {
    if (!activeConnectionId) return;
    if (confirm(`Are you sure you want to delete skillset '${skillsetName}'?`)) {
      try {
        await skillsetsService.deleteSkillset(activeConnectionId, skillsetName);
        fetchSkillsets();
      } catch (error) {
        console.error(error);
        alert('Failed to delete skillset');
      }
    }
  };

  const filteredSkillsets = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return skillsets;
    return skillsets.filter(s => s.name.toLowerCase().includes(f));
  }, [skillsets, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div className="actions" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Button variant="primary" onClick={onCreate}>
          <i className="fas fa-plus"></i> Create Skillset
        </Button>
        <Button onClick={fetchSkillsets}>
          <i className="fas fa-sync"></i> Refresh
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Input
            placeholder="Filter skillsets..."
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
                <th style={{ padding: '8px 16px', width: '120px' }}>Skills</th>
                <th style={{ padding: '8px 16px' }}>Description</th>
                <th style={{ padding: '8px 16px', width: '180px' }}>ETag</th>
                <th style={{ padding: '8px 16px', width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center' }}>Loading...</td></tr>
              ) : filteredSkillsets.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-color)', opacity: 0.75 }}>No skillsets found.</td></tr>
              ) : (
                filteredSkillsets.map((s, idx) => (
                  <tr key={s.name || s.eTag || `row-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 16px', color: 'var(--accent-color)', cursor: 'pointer' }} onClick={() => onEdit(s.name)}>
                      {s.name}
                    </td>
                    <td style={{ padding: '8px 16px' }}>{s.skillsCount}</td>
                    <td style={{ padding: '8px 16px', color: 'var(--text-color)', opacity: 0.9 }}>
                      {s.description || <span style={{ opacity: 0.6 }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 16px', color: 'var(--text-color)', opacity: 0.8 }}>
                      {s.eTag ? <span title={s.eTag}>{s.eTag}</span> : <span style={{ opacity: 0.6 }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 16px', display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" onClick={() => onEdit(s.name)}>
                        <i className="fas fa-edit"></i> Edit
                      </Button>
                      <Button variant="secondary" onClick={() => handleDelete(s.name)}>
                        <i className="fas fa-trash"></i>
                      </Button>
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

export default SkillsetList;
