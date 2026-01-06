import React, { useState } from 'react';
import IndexList from './IndexList';
import IndexExplorer from './IndexExplorer';
import IndexBuilder from './IndexBuilder';

const IndexesPage: React.FC = () => {
    const [view, setView] = useState<'list' | 'explorer' | 'builder'>('list');
    const [selectedIndex, setSelectedIndex] = useState<string | undefined>(undefined);

    const handleQuery = (indexName: string) => {
        setSelectedIndex(indexName);
        setView('explorer');
    };

    const handleEdit = (indexName: string) => {
        setSelectedIndex(indexName);
        setView('builder');
    };

    const handleCreate = () => {
        setSelectedIndex(undefined); // New
        setView('builder');
    };

    const handleBack = () => {
        setView('list');
        setSelectedIndex(undefined);
    };

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
                <IndexExplorer 
                    indexName={selectedIndex}
                    onBack={handleBack}
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
