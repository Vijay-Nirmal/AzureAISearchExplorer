import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { JsonEditorModal } from '../../../common/JsonEditorModal';
import { confirmService } from '../../../../services/confirmService';
import { ConfigDrivenObjectForm } from '../../../common/configDriven/ConfigDrivenObjectForm';
import { applyDefaultsForType, getResolvedTypeDefinitions, normalizeBySchema } from '../../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema } from '../../../common/configDriven/configDrivenTypes';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';
import { alertService } from '../../../../services/alertService';

import schemaJson from '../../../../data/constants/config/Skillset/knowledgeStoreConfig.json';

interface SkillsetKnowledgeStoreTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

const SkillsetKnowledgeStoreTabInner: React.FC<SkillsetKnowledgeStoreTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const schema = schemaJson as unknown as ConfigDrivenSchema;

  const commitTimerRef = useRef<number | null>(null);

  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const v = skillsetDef.knowledgeStore;
    return isPlainObject(v) ? v : {};
  });
  const [present, setPresent] = useState<boolean>(() => !!skillsetDef.knowledgeStore);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    };
  }, []);

  const scheduleCommit = (next: Record<string, unknown>) => {
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = window.setTimeout(() => {
      setSkillsetDef(prev => ({ ...prev, knowledgeStore: next }));
    }, 250);
  };

  const add = () => {
    const type = getResolvedTypeDefinitions(schema)[0]?.discriminatorValue;
    const next = type ? applyDefaultsForType(schema, type, {}) : {};
    setPresent(true);
    setDraft(next);
    setSkillsetDef(prev => ({ ...prev, knowledgeStore: next }));
    setErrors({});
  };

  const remove = async () => {
    const confirmed = await confirmService.confirm({
      title: 'Remove Knowledge Store',
      message: 'Remove knowledgeStore configuration from this skillset?'
    });
    if (!confirmed) return;
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
    setPresent(false);
    setDraft({});
    setSkillsetDef(prev => ({ ...prev, knowledgeStore: undefined }));
    setErrors({});
  };

  const setKnowledgeStoreAutoNormalized = (nextDraft: Record<string, unknown>) => {
    const result = normalizeBySchema(schema, nextDraft, { preserveUnknown: true });
    if (!result.value) {
      setDraft(nextDraft);
      scheduleCommit(nextDraft);
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setDraft(result.value);
    scheduleCommit(result.value);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '8px', backgroundColor: 'var(--active-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!present ? (
            <Button onClick={add}>
              <i className="fas fa-plus"></i> Add
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setJsonEditorOpen(true)}
                title="Edit raw JSON"
              >
                <i className="fas fa-pen"></i> Edit JSON
              </Button>
              <Button variant="secondary" onClick={remove}>
                <i className="fas fa-trash"></i> Remove
              </Button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Card style={{ maxWidth: '1100px' }}>
          {!present ? (
            <div style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.75, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                Add a knowledge store configuration to project enriched data into Azure Storage.
              </div>
              <div>
                <Button onClick={add}>
                  <i className="fas fa-plus"></i> Add
                </Button>
              </div>
            </div>
          ) : (
            <ConfigDrivenObjectForm
              schema={schema}
              value={draft}
              onChange={(next) => setKnowledgeStoreAutoNormalized(next)}
              errors={errors}
              nestedPresentation="accordion"
              accordionSingleOpen={false}
              accordionDefaultExpanded={false}
            />
          )}
        </Card>
      </div>

      <JsonEditorModal
        isOpen={jsonEditorOpen}
        onClose={() => setJsonEditorOpen(false)}
        title="Edit knowledgeStore JSON"
        value={draft}
        onSave={(nextValue) => {
          if (nextValue !== null && (typeof nextValue !== 'object' || Array.isArray(nextValue))) {
            alertService.show({ title: 'Validation', message: 'knowledgeStore must be a JSON object.' });
            return;
          }
          if (!nextValue) {
            if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
            setPresent(false);
            setDraft({});
            setSkillsetDef(prev => ({ ...prev, knowledgeStore: undefined }));
            setErrors({});
            setJsonEditorOpen(false);
            return;
          }
          setPresent(true);
          setKnowledgeStoreAutoNormalized(nextValue as Record<string, unknown>);
          setJsonEditorOpen(false);
        }}
      />
    </div>
  );
};

const SkillsetKnowledgeStoreTab: React.FC<SkillsetKnowledgeStoreTabProps> = (props) => {
  const resetKey = `${props.skillsetDef.name}:${props.skillsetDef['@odata.etag'] ?? ''}`;
  return <SkillsetKnowledgeStoreTabInner key={resetKey} {...props} />;
};

export default SkillsetKnowledgeStoreTab;
