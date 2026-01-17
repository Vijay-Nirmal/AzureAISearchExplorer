import React, { useEffect, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { alertService } from '../../../services/alertService';
import { confirmService } from '../../../services/confirmService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';


interface IndexListProps {
    onQuery: (indexName: string) => void;
    onEdit: (indexName: string) => void;
    onCreate: () => void;
}

const IndexList: React.FC<IndexListProps> = ({ onQuery, onEdit, onCreate }) => {
    const { activeConnectionId } = useLayout();
    const [indexes, setIndexes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchIndexes = async () => {
        if (!activeConnectionId) return;
        setLoading(true);
        try {
            const data = await indexesService.listIndexes(activeConnectionId);
            setIndexes(data);
        } catch (error) {
            console.error(error);
            // Ideally show notification
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIndexes();
    }, [activeConnectionId]);

    const handleDelete = async (indexName: string) => {
        if (!activeConnectionId) return;
        const confirmed = await confirmService.confirm({
            title: 'Delete Index',
            message: `Are you sure you want to delete index '${indexName}'?`
        });
        if (!confirmed) return;
        try {
            await indexesService.deleteIndex(activeConnectionId, indexName);
            fetchIndexes();
        } catch (error) {
            console.error(error);
            alertService.show({ title: 'Error', message: 'Failed to delete index.' });
        }
    };

    const filteredIndexes = indexes.filter(idx => idx.name.toLowerCase().includes(filter.toLowerCase()));

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
            <div className="actions" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <Button variant="primary" onClick={onCreate}>
                    <i className="fas fa-plus"></i> Create Index
                </Button>
                <Button onClick={fetchIndexes}>
                    <i className="fas fa-sync"></i> Refresh
                </Button>
                <div style={{ marginLeft: 'auto' }}>
                    <Input 
                        placeholder="Filter indexes..." 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: '200px' }}
                    />
                </div>
            </div>

            <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflow: 'auto', flex: 1 }}>
                    <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', backgroundColor: '#2d2d2d', borderBottom: '1px solid #3e3e42' }}>
                                <th style={{ padding: '8px 16px' }}>Name</th>
                                <th style={{ padding: '8px 16px' }}>Document Count</th>
                                <th style={{ padding: '8px 16px' }}>Storage Size</th>
                                <th style={{ padding: '8px 16px' }}>Vector Index</th>
                                <th style={{ padding: '8px 16px' }}>Fields</th>
                                <th style={{ padding: '8px 16px', width: '140px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center' }}>Loading...</td></tr>
                            ) : filteredIndexes.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#888' }}>No indexes found.</td></tr>
                            ) : (
                                filteredIndexes.map((idx) => (
                                    <tr key={idx.name} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '8px 16px', color: 'var(--accent-color)' }}>
                                            <i className="fas fa-table" style={{ marginRight: '8px', color: '#888' }}></i>
                                            {idx.name}
                                        </td>
                                        <td style={{ padding: '8px 16px' }}>{idx.stats?.documentCount?.toLocaleString() || '-'}</td>
                                        <td style={{ padding: '8px 16px' }}>{idx.stats?.storageSize ? formatBytes(idx.stats.storageSize) : '-'}</td>
                                        <td style={{ padding: '8px 16px' }}>
                                            {idx.vectorSearch ? <span style={{ color: '#4caf50' }}>Yes</span> : <span style={{ color: '#888' }}>No</span>}
                                        </td>
                                        <td style={{ padding: '8px 16px' }}>{idx.fields?.length || 0}</td>
                                        <td style={{ padding: '8px 16px' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="icon-btn" title="Query" onClick={() => onQuery(idx.name)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                                                    <i className="fas fa-search"></i>
                                                </button>
                                                <button className="icon-btn" title="Edit" onClick={() => onEdit(idx.name)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                                                    <i className="fas fa-pen"></i>
                                                </button>
                                                <button className="icon-btn" title="Delete" onClick={() => handleDelete(idx.name)} style={{ background: 'none', border: 'none', color: '#f48771', cursor: 'pointer' }}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
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

export default IndexList;
