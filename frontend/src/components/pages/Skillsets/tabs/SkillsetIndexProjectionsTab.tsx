import React, { useState } from 'react';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { JsonEditorModal } from '../../../common/JsonEditorModal';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';

interface SkillsetIndexProjectionsTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}


const SkillsetIndexProjectionsTab: React.FC<SkillsetIndexProjectionsTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const value = skillsetDef.indexProjections ?? null;

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
              setSkillsetDef(prev => ({ ...prev, indexProjections: undefined }));
            }}
          >
            <i className="fas fa-trash"></i> Clear
          </Button>
        </div>
      </div>

      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <Card style={{ maxWidth: '1100px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.75, marginBottom: '12px' }}>
            Configure projections to secondary index(es) (JSON-only for now).
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(value, null, 2)}
          </div>
        </Card>
      </div>

      <JsonEditorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit indexProjections"
        value={value}
        onSave={(nextValue) => {
          if (nextValue !== null && (typeof nextValue !== 'object' || Array.isArray(nextValue))) {
            alert('indexProjections must be a JSON object.');
            return;
          }
          setSkillsetDef(prev => ({ ...prev, indexProjections: (nextValue as Record<string, unknown>) || undefined }));
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export default SkillsetIndexProjectionsTab;
