import React, { useCallback, useState } from 'react';
import DataSourceList from './DataSourceList';
import DataSourceBuilder from './DataSourceBuilder';

const DataSourcesPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const handleView = useCallback((name: string) => {
    setSelected(name);
    setView('builder');
  }, []);

  const handleEdit = useCallback((name: string) => {
    setSelected(name);
    setView('builder');
  }, []);

  const handleCreate = useCallback(() => {
    setSelected(undefined);
    setView('builder');
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelected(undefined);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {view === 'list' && (
        <DataSourceList
          onView={handleView}
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      )}

      {view === 'builder' && (
        <DataSourceBuilder dataSourceName={selected} onBack={handleBack} />
      )}
    </div>
  );
};

export default DataSourcesPage;
