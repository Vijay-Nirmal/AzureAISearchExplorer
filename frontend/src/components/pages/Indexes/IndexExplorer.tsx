import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { indexesService } from '../../../services/indexesService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Modal } from '../../common/Modal';
import { TruncatedTextCell } from '../../common/TruncatedTextCell';
// import { Breadcrumbs } from '../../common/Breadcrumbs';
import { JsonViewerModal } from '../../common/JsonViewerModal';
import { JsonView } from '../../common/JsonView';
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
    const { activeConnectionId, setBreadcrumbs } = useLayout();
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
    const [viewDetails, setViewDetails] = useState<string | null>(null);
    const [viewJsonItem, setViewJsonItem] = useState<any | null>(null);
    
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
        setBreadcrumbs([
            { label: 'Indexes', onClick: onBack },
            { label: indexName },
            { label: 'Explorer' }
        ]);
        
        runQuery();
        
        return () => {
             setBreadcrumbs([]);
        };
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-color)' }}>Explorer</span>
                    <span style={{ color: '#888' }}>{' | '}</span>
                    <span style={{ color: 'var(--accent-color)' }}>{indexName}</span>
                </div>
                <Button onClick={onBack}><i className="fas fa-arrow-left"></i> Back</Button>
            </div>

            <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
                {/* Query Controls Sub-Sidebar */}
                <div style={{ width: '300px', minWidth: '300px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Tabs / Toolbar */}
                    <div style={{ height: '40px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
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
                            <div style={{ flex: 1, padding: '0', overflow: 'hidden' }}>
                                <JsonView 
                                    data={response || '// Setup query and click Run'} 
                                    options={{ 
                                        lineNumbers: 'on', 
                                        minimap: { enabled: true } 
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === 'table' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                {/* Column definitions */}
                                <div style={{ padding: '8px', borderBottom: '1px solid #333', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#888' }}>Cols:</span>
                                    <Input placeholder="Header" value={newColHeader} onChange={e => setNewColHeader(e.target.value)} style={{ width: '100px', padding: '4px' }} />
                                    <Input placeholder="Path (e.g. Address.City)" value={newColPath} onChange={e => setNewColPath(e.target.value)} style={{ width: '150px', padding: '4px' }} />
                                    <button className="icon-btn" onClick={addColumn}><i className="fas fa-plus"></i></button>
                                </div>
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px', padding: '8px', borderBottom: '1px solid #444', backgroundColor: '#2d2d2d' }}></th>
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
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        <Button 
                                                            variant="icon"
                                                            onClick={() => setViewJsonItem(item)}
                                                            title="View Full JSON"
                                                        >
                                                            <i className="fas fa-code"></i>
                                                        </Button>
                                                    </td>
                                                    {columns.map((col, cIdx) => {
                                                        const value = String(resolvePath(item, col.path) ?? '');
                                                        return <TruncatedTextCell key={cIdx} value={value} onExpand={setViewDetails} />;
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* View Details Modal */}
            <Modal
                isOpen={viewDetails !== null}
                onClose={() => setViewDetails(null)}
                title="Cell Content"
                footer={(
                    <>
                         <Button variant="secondary" onClick={() => viewDetails && navigator.clipboard.writeText(viewDetails)}>
                            <i className="fas fa-copy"></i> Copy
                        </Button>
                        <Button onClick={() => setViewDetails(null)}>Close</Button>
                    </>
                )}
            >
                <textarea 
                    readOnly
                    style={{ 
                        width: '100%', height: '100%', minHeight: '300px',
                        backgroundColor: '#1e1e1e', color: '#d4d4d4', 
                        border: 'none', fontFamily: 'Consolas', resize: 'none'
                    }}
                    value={viewDetails || ''}
                />
            </Modal>
            
            <JsonViewerModal
                isOpen={viewJsonItem !== null}
                onClose={() => setViewJsonItem(null)}
                title="Document JSON"
                data={viewJsonItem}
            />
        </div>
    );
};

export default IndexExplorer;
