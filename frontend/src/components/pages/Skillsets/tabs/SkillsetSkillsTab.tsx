import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { JsonEditorModal } from '../../../common/JsonEditorModal';
import { ConfigDrivenObjectForm } from '../../../common/configDriven/ConfigDrivenObjectForm';
import type { ConfigDrivenSchema } from '../../../common/configDriven/configDrivenTypes';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';
import { alertService } from '../../../../services/alertService';

import skillsSchemaJson from '../../../../data/constants/config/Skillset/Skills/skillsConfig.json';

interface SkillsetSkillsTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

const skillsSchema = skillsSchemaJson as unknown as ConfigDrivenSchema;

const wrapperSchema: ConfigDrivenSchema = {
  entity: {
    title: 'Skills',
    description: 'A list of skills executed by the indexer.',
    discriminatorKey: '__type',
    nameKey: '__name'
  },
  commonFields: [],
  types: [
    {
      discriminatorValue: 'SkillsWrapper',
      label: 'SkillsWrapper',
      fields: [
        {
          key: 'skills',
          label: 'Skills',
          type: 'objectArray',
          presentation: 'table',
          tooltip: 'A list of skills in the skillset.',
          schema: skillsSchema
        }
      ]
    }
  ]
};

const SkillsetSkillsTabInner: React.FC<SkillsetSkillsTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const commitTimerRef = useRef<number | null>(null);

  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const skills = Array.isArray(skillsetDef.skills) ? skillsetDef.skills.filter(isPlainObject) : [];
    return { skills };
  });

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    };
  }, []);

  const skills = useMemo(() => {
    const raw = draft.skills;
    if (!Array.isArray(raw)) return [] as Record<string, unknown>[];
    return raw.filter(isPlainObject);
  }, [draft.skills]);

  const scheduleCommit = (nextSkills: Record<string, unknown>[]) => {
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = window.setTimeout(() => {
      setSkillsetDef(prev => ({ ...prev, skills: nextSkills }));
    }, 250);
  };

  const setWrapperValue = (next: Record<string, unknown>) => {
    const raw = next.skills;
    const nextSkills = Array.isArray(raw) ? raw.filter(isPlainObject) : [];
    const wrapper = { ...next, skills: nextSkills };
    setDraft(wrapper);
    scheduleCommit(nextSkills);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="icon" onClick={() => setJsonEditorOpen(true)} title="Edit JSON">
            <i className="fas fa-code"></i>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft({ skills: [] });
              setSkillsetDef(prev => ({ ...prev, skills: [] }));
            }}
          >
            <i className="fas fa-broom"></i> Clear
          </Button>
        </div>
      </div>

      <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Card style={{ width: '100%' }}>
          <ConfigDrivenObjectForm
            schema={wrapperSchema}
            value={draft}
            onChange={setWrapperValue}
            layoutMode="split-complex"
            nestedPresentation="inline"
          />
        </Card>
      </div>

      <JsonEditorModal
        isOpen={jsonEditorOpen}
        onClose={() => setJsonEditorOpen(false)}
        title="Edit skills"
        value={skills}
        onSave={(nextValue) => {
          if (nextValue !== null && !Array.isArray(nextValue)) {
            alertService.show({ title: 'Validation', message: 'Skills must be a JSON array.' });
            return;
          }
          const nextSkills = Array.isArray(nextValue)
            ? (nextValue as unknown[]).filter(isPlainObject)
            : [];
          setDraft({ skills: nextSkills });
          setSkillsetDef(prev => ({ ...prev, skills: nextSkills }));
          setJsonEditorOpen(false);
        }}
      />
    </div>
  );
};

const SkillsetSkillsTab: React.FC<SkillsetSkillsTabProps> = (props) => {
  const resetKey = `${props.skillsetDef.name}:${props.skillsetDef['@odata.etag'] ?? ''}`;
  return <SkillsetSkillsTabInner key={resetKey} {...props} />;
};

export default SkillsetSkillsTab;
