import React from 'react';
import { Button } from '../../common/Button';
import { InfoIcon } from '../../common/InfoIcon';

import searchIndexPropertyDescriptions from '../../../data/constants/searchIndexPropertyDescriptions.json';

import type { SearchIndex } from '../../../types/IndexModels';

interface IndexOverviewTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
    onNavigateToTab: (tabId: string) => void;
}

type SearchIndexPropertyRow = {
    name: keyof typeof searchIndexPropertyDescriptions;
    typeDisplay: string;
    tabId: string;
};

const rows: SearchIndexPropertyRow[] = [
    { name: 'fields', typeDisplay: 'SearchField[]', tabId: 'fields' },
    { name: 'vectorSearch', typeDisplay: 'VectorSearch', tabId: 'vector' },
    { name: 'suggesters', typeDisplay: 'Suggester[]', tabId: 'suggesters' },
    { name: 'scoringProfiles', typeDisplay: 'ScoringProfile[]', tabId: 'scoring' },
    { name: 'corsOptions', typeDisplay: 'CorsOptions', tabId: 'cors' },

    { name: 'analyzers', typeDisplay: 'LexicalAnalyzer[]', tabId: 'analyzers' },
    { name: 'charFilters', typeDisplay: 'CharFilter[]', tabId: 'charFilters' },
    { name: 'normalizers', typeDisplay: 'LexicalNormalizer[]', tabId: 'normalizers' },
    { name: 'tokenizers', typeDisplay: 'LexicalTokenizer[]', tabId: 'tokenizers' },
    { name: 'tokenFilters', typeDisplay: 'TokenFilter[]', tabId: 'tokenFilters' },

    { name: 'semantic', typeDisplay: 'SemanticSettings', tabId: 'semantic' },
    { name: 'similarity', typeDisplay: 'Similarity', tabId: 'similarity' },
    { name: 'encryptionKey', typeDisplay: 'SearchResourceEncryptionKey', tabId: 'encryptionKey' }
];

export const IndexOverviewTab: React.FC<IndexOverviewTabProps> = ({ onNavigateToTab }) => {
    return (
        <div style={{ flex: 1, overflow: 'auto' }}>
            <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2d2d2d', zIndex: 1 }}>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>
                        <th style={{ padding: '8px 16px', width: '220px' }}>Name</th>
                        <th style={{ padding: '8px 16px', width: '260px' }}>Type</th>
                        <th style={{ padding: '8px 16px' }}>Description</th>
                        <th style={{ padding: '8px 16px', width: '120px' }}>Tab</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => {
                        const tooltip = searchIndexPropertyDescriptions[row.name] || '';
                        return (
                            <tr key={row.name} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '8px 16px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        {row.name}
                                        <InfoIcon tooltip={tooltip} />
                                    </span>
                                </td>
                                <td style={{ padding: '8px 16px', color: '#ccc' }}>{row.typeDisplay}</td>
                                <td style={{ padding: '8px 16px', color: '#aaa' }}>
                                    <span
                                        style={{
                                            display: 'block',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '65vw'
                                        }}
                                        title={tooltip}
                                    >
                                        {tooltip}
                                    </span>
                                </td>
                                <td style={{ padding: '8px 16px' }}>
                                    <Button variant="secondary" onClick={() => onNavigateToTab(row.tabId)}>
                                        Open
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
