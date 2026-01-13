import React, { useCallback, useState } from 'react';
import IndexerList from './IndexerList';
import IndexerBuilder from './IndexerBuilder';
import IndexerRunsPage from './IndexerRunsPage';

const IndexersPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'builder' | 'runs'>('list');
  const [selectedIndexer, setSelectedIndexer] = useState<string | undefined>(undefined);

  const handleEdit = useCallback((indexerName: string) => {
    setSelectedIndexer(indexerName);
    setView('builder');
  }, []);

  const handleRuns = useCallback((indexerName: string) => {
    setSelectedIndexer(indexerName);
    setView('runs');
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedIndexer(undefined);
    setView('builder');
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelectedIndexer(undefined);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {view === 'list' && (
        <IndexerList
          onEdit={handleEdit}
          onRuns={handleRuns}
          onCreate={handleCreate}
        />
      )}

      {view === 'builder' && (
        <IndexerBuilder
          indexerName={selectedIndexer}
          onBack={handleBack}
          onRuns={(name) => handleRuns(name)}
        />
      )}

      {view === 'runs' && selectedIndexer && (
        <IndexerRunsPage
          indexerName={selectedIndexer}
          onBack={handleBack}
          onEdit={(name) => handleEdit(name)}
        />
      )}
    </div>
  );
};

export default IndexersPage;
