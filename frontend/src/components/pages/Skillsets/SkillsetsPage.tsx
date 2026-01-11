import React, { useCallback, useState } from 'react';
import SkillsetList from './SkillsetList';
import SkillsetBuilder from './SkillsetBuilder';

const SkillsetsPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [selectedSkillset, setSelectedSkillset] = useState<string | undefined>(undefined);

  const handleEdit = useCallback((skillsetName: string) => {
    setSelectedSkillset(skillsetName);
    setView('builder');
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedSkillset(undefined);
    setView('builder');
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelectedSkillset(undefined);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {view === 'list' && (
        <SkillsetList
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      )}

      {view === 'builder' && (
        <SkillsetBuilder
          skillsetName={selectedSkillset}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default SkillsetsPage;
