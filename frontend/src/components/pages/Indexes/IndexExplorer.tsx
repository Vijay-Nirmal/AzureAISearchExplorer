import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import type { SearchOptions, QueryResponse } from '../../../types/IndexModels';

interface IndexExplorerProps {
    indexName: string;
    onBack: () => void;
}

interface ColumnDef {
    header: string;
    path: string;
}

const IndexExplorer: React.FC<IndexExplorerProps> = ({ indexName, onBack }) => {
    const { activeConnectionId } = useLayout();
    const [searchText, setSearchText] = useState('*');
    const [options, setOptions] = useState<SearchOptions>({
        includeTotalCount: true,
        top: 50,
        skip: 0,
        queryType: 'simple',
        searchMode: 'any'
    });
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<QueryResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'json' | 'table'>('json');
    
    // Table Columns state
    const [columns, setColumns] = useState<ColumnDef[]>([
        { header: 'Score', path: '@search.score' },
        { header: 'ID', path: 'id' } // Default, might need adjusting
    ]);
    const [newColHeader, setNewColHeader] = useState('');
    const [newColPath, setNewColPath] = useState('');

    const runQuery = async () => {
        if (!activeConnectionId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await indexesService.queryIndex(activeConnectionId, indexName, searchText, options);
            setResponse(result);

            // Auto-discover columns if empty or just default
            if (result.results.length > 0 && columns.length <= 2) {
                const first = result.results[0];
                const newCols = Object.keys(first)
                    .filter(k => k !== '@search.score' && k !== '@search.highlights')
                    .slice(0, 5) // Limit to first 5 fields
                    .map(k => ({ header: k, path: k }));
                // Keep Score
                setColumns([{ header: 'Score', path: '@search.score' }, ...newCols]);
            }
        } catch (err: any) {
            setError(err.message || "Query failed");
        } finally {
            setLoading(false);
        }
    };

    // Execute on mount
    useEffect(() => {
        runQuery();
    }, []);

    const resolvePath = (obj: any, path: string) => {
        if (path.startsWith('$')) path = path.substring(1);
        if (path.startsWith('.')) path = path.substring(1);
        
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const addColumn = () => {
        if (newColHeader && newColPath) {
            setColumns([...columns, { header: newColHeader, path: newColPath }]);
            setNewColHeader('');
            setNewColPath('');
        }
    };

    const removeColumn = (index: number) => {
        const newCols = [...columns];
        newCols.splice(index, 1);
        setColumns(newCols);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#252526' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="breadcrumbs" style={{ fontSize: '13px', color: '#888' }}>
                        <span style={{ cursor:'pointer' }} onClick={onBack}>Indexes</span> 
                        <i className="fas fa-chevron-right" style={{ fontSize:'10px', margin:'0 6px' }}></i> 
                        <span className="current" style={{ fontWeight: 600, color: 'var(--text-color)' }}>{indexName}</span> 
                        <i className="fas fa-chevron-right" style={{ fontSize:'10px', margin:'0 6px' }}></i> 
                        <span className="current">Explorer</span>
                    </div>
                </div>
                <Button onClick={onBack}><i className="fas fa-arrow-left"></i> Back</Button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Query Controls Sub-Sidebar */}
                <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', backgroundColor: '#252526' }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: '#ddd', fontSize: '11px', textTransform: 'uppercase' }}>
                        Query Parameters
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Search Text (search)</label>
                            <Input value={searchText} onChange={e => setSearchText(e.target.value)} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Query Type</label>
                            <Select value={options.queryType} onChange={e => setOptions({...options, queryType: e.target.value as any})}>
                                <option value="simple">simple</option>
                                <option value="full">full (Lucene)</option>
                                <option value="semantic">semantic</option>
                            </Select>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Search Mode</label>
                            <Select value={options.searchMode} onChange={e => setOptions({...options, searchMode: e.target.value as any})}>
                                <option value="any">any</option>
                                <option value="all">all</option>
                            </Select>
                        </div>
                        <div style={{ margin: '16px 0', borderTop: '1px solid #3e3e42' }}></div>
                        
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>$filter (OData)</label>
                            <Input value={options.filter || ''} onChange={e => setOptions({...options, filter: e.target.value})} placeholder="Rating gt 4" />
                        </div>
                         <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>$select (Fields)</label>
                            <Input value={options.select?.join(',') || ''} onChange={e => setOptions({...options, select: e.target.value ? e.target.value.split(',').map(s=>s.trim()) : undefined})} placeholder="HotelId, Rating" />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>$orderby</label>
                             <Input value={options.orderBy?.join(',') || ''} onChange={e => setOptions({...options, orderBy: e.target.value ? e.target.value.split(',').map(s=>s.trim()) : undefined})} placeholder="Rating desc" />
                        </div>
                         <div style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>$top</label>
                                <Input type="number" value={options.top} onChange={e => setOptions({...options, top: parseInt(e.target.value)})} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>$skip</label>
                                <Input type="number" value={options.skip} onChange={e => setOptions({...options, skip: parseInt(e.target.value)})} />
                            </div>
                        </div>
                         <div style={{ marginBottom: '12px' }}>
                             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa' }}>
                                <input type="checkbox" checked={options.includeTotalCount} onChange={e => setOptions({...options, includeTotalCount: e.target.checked})} style={{ width: 'auto' }} />
                                Include Count ($count)
                             </label>
                        </div>
                    </div>
                    <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
                        <Button variant="primary" style={{ width: '100%' }} onClick={runQuery} disabled={loading}>
                            {loading ? 'Running...' : 'Run Query'}
                        </Button>
                    </div>
                </div>

                {/* Results Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
                    {/* Tabs / Toolbar */}
                    <div style={{ height: '40px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#252526' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div 
                                onClick={() => setActiveTab('json')}
                                style={{ 
                                    padding: '0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%',
                                    borderBottom: activeTab === 'json' ? '3px solid var(--accent-color)' : '3px solid transparent',
                                    fontWeight: activeTab === 'json' ? 600 : 400,
                                    color: activeTab === 'json' ? '#fff' : '#888'
                                }}
                            >
                                JSON
                            </div>
                             <div 
                                onClick={() => setActiveTab('table')}
                                style={{ 
                                    padding: '0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%',
                                    borderBottom: activeTab === 'table' ? '3px solid var(--accent-color)' : '3px solid transparent',
                                    fontWeight: activeTab === 'table' ? 600 : 400,
                                    color: activeTab === 'table' ? '#fff' : '#888'
                                }}
                            >
                                Table (JSONPath)
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', color: '#888', fontSize: '12px' }}>
                           {response?.count !== undefined ? `Count: ${response.count}` : ''} {response ? `| Returned: ${response.results.length}` : ''}
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {error && <div style={{ padding: '10px', color: '#f48771', borderBottom: '1px solid #333' }}>Error: {error}</div>}
                        
                        {activeTab === 'json' && (
                            <div style={{ flex: 1, padding: '0', overflow: 'auto', backgroundColor: '#1e1e1e' }}>
                                <pre style={{ margin: 0, padding: '16px', fontFamily: 'Consolas, monospace', fontSize: '13px', color: '#9cdcfe' }}>
                                    {response ? JSON.stringify(response, null, 2) : '// Setup query and click Run'}
                                </pre>
                            </div>
                        )}

                        {activeTab === 'table' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                {/* Column definitions */}
                                <div style={{ padding: '8px', borderBottom: '1px solid #333', background: '#252526', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#888' }}>Cols:</span>
                                    <Input placeholder="Header" value={newColHeader} onChange={e => setNewColHeader(e.target.value)} style={{ width: '100px', padding: '4px' }} />
                                    <Input placeholder="Path (e.g. Address.City)" value={newColPath} onChange={e => setNewColPath(e.target.value)} style={{ width: '150px', padding: '4px' }} />
                                    <button className="icon-btn" onClick={addColumn}><i className="fas fa-plus"></i></button>
                                </div>
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                {columns.map((col, idx) => (
                                                    <th key={idx} style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #444', backgroundColor: '#2d2d2d' }}>
                                                        {col.header} 
                                                        <span style={{ color: '#666', fontSize: '10px', marginLeft: '4px' }}>{col.path}</span>
                                                        <i className="fas fa-times" style={{ marginLeft: '8px', cursor: 'pointer', color: '#666' }} onClick={() => removeColumn(idx)}></i>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {response?.results.map((item, rIdx) => (
                                                <tr key={rIdx} style={{ borderBottom: '1px solid #333' }}>
                                                    {columns.map((col, cIdx) => (
                                                        <td key={cIdx} style={{ padding: '8px', color: '#ccc' }}>
                                                            {String(resolvePath(item, col.path) ?? '')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndexExplorer;
