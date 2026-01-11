import React, { useState } from 'react';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { JsonEditorModal } from '../../../common/JsonEditorModal';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';

interface SkillsetSkillsTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}

const SkillsetSkillsTab: React.FC<SkillsetSkillsTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const skills = skillsetDef.skills || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => setIsOpen(true)}>
            <i className="fas fa-code"></i> Edit JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSkillsetDef(prev => ({ ...prev, skills: [] }));
            }}
          >
            <i className="fas fa-broom"></i> Clear
          </Button>
        </div>
      </div>

      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <Card style={{ maxWidth: '1100px' }}>
          <div style={{ color: 'var(--text-color)', opacity: 0.75, fontSize: '12px', marginBottom: '12px' }}>
            Count: <span style={{ color: 'var(--text-color)' }}>{skills.length}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.75, marginBottom: '12px' }}>
            Skills UI will be config-driven later; for now edit raw JSON.
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(skills, null, 2)}
          </div>
        </Card>
      </div>

      <JsonEditorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit skills"
        value={skills}
        onSave={(nextValue) => {
          if (nextValue !== null && !Array.isArray(nextValue)) {
            alert('Skills must be a JSON array.');
            return;
          }
          setSkillsetDef(prev => ({ ...prev, skills: (nextValue as unknown[]) || [] }));
        }}
      />
    </div>
  );
};

export default SkillsetSkillsTab;
