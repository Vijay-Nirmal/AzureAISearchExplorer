import React, { useState, useCallback, useMemo } from 'react';
import IndexList from './IndexList';
import IndexBuilder from './IndexBuilder';
import ClassicRetrievalPage from '../ClassicRetrieval/ClassicRetrievalPage';

const IndexesPage: React.FC = () => {
    const [view, setView] = useState<'list' | 'explorer' | 'builder'>('list');
    const [selectedIndex, setSelectedIndex] = useState<string | undefined>(undefined);

    const handleQuery = useCallback((indexName: string) => {
        setSelectedIndex(indexName);
        setView('explorer');
    }, []);

    const handleEdit = useCallback((indexName: string) => {
        setSelectedIndex(indexName);
        setView('builder');
    }, []);

    const handleCreate = useCallback(() => {
        setSelectedIndex(undefined); // New
        setView('builder');
    }, []);

    const handleBack = useCallback(() => {
        setView('list');
        setSelectedIndex(undefined);
    }, []);

    const explorerBreadcrumbs = useMemo(() => {
        if (!selectedIndex) return [];
        return [
            { label: 'Indexes', onClick: handleBack },
            { label: selectedIndex },
            { label: 'Explorer' }
        ];
    }, [handleBack, selectedIndex]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {view === 'list' && (
                <IndexList 
                    onQuery={handleQuery}
                    onEdit={handleEdit}
                    onCreate={handleCreate}
                />
            )}
            
            {view === 'explorer' && selectedIndex && (
                <ClassicRetrievalPage
                    indexName={selectedIndex}
                    onBack={handleBack}
                    breadcrumbs={explorerBreadcrumbs}
                />
            )}

            {view === 'builder' && (
                <IndexBuilder 
                    indexName={selectedIndex}
                    onBack={handleBack}
                />
            )}
        </div>
    );
};

export default IndexesPage;
