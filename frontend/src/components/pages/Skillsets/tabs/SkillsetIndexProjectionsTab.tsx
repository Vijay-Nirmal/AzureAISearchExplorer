import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { JsonEditorModal } from '../../../common/JsonEditorModal';
import { ConfigDrivenObjectForm } from '../../../common/configDriven/ConfigDrivenObjectForm';
import { applyDefaultsForType, getResolvedTypeDefinitions, normalizeBySchema } from '../../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../../common/configDriven/configDrivenTypes';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';

import typeJson from '../../../../data/constants/config/Skillset/IndexProjections/types/SearchIndexerIndexProjection.json';

interface SkillsetIndexProjectionsTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

const typeDef = typeJson as unknown as ConfigDrivenTypeDefinition;

const schema: ConfigDrivenSchema = {
  entity: {
    title: 'Index Projections',
    description: typeDef.description,
    discriminatorKey: '@odata.type',
    nameKey: 'name'
  },
  commonFields: [],
  types: [typeDef]
};

const SkillsetIndexProjectionsTabInner: React.FC<SkillsetIndexProjectionsTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const commitTimerRef = useRef<number | null>(null);

  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const v = skillsetDef.indexProjections;
    return isPlainObject(v) ? v : {};
  });
  const [present, setPresent] = useState<boolean>(() => isPlainObject(skillsetDef.indexProjections));

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    };
  }, []);

  const scheduleCommit = (next: Record<string, unknown>) => {
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = window.setTimeout(() => {
      setSkillsetDef(prev => ({ ...prev, indexProjections: next }));
    }, 250);
  };

  const cleanEmptyFields = (obj: Record<string, unknown>) => {
    const parameters = obj.parameters;
    if (isPlainObject(parameters) && Object.keys(parameters).length === 0) delete obj.parameters;

    const selectors = obj.selectors;
    if (Array.isArray(selectors) && selectors.length === 0) delete obj.selectors;
  };

  const setIndexProjectionsAutoNormalized = (nextDraft: Record<string, unknown>) => {
    const result = normalizeBySchema(schema, nextDraft, { preserveUnknown: true });
    if (!result.value) {
      setDraft(nextDraft);
      scheduleCommit(nextDraft);
      setErrors(result.errors);
      return;
    }

    cleanEmptyFields(result.value);
    setErrors({});
    setDraft(result.value);
    scheduleCommit(result.value);
  };

  const add = () => {
    const type = getResolvedTypeDefinitions(schema)[0]?.discriminatorValue;
    const next = type ? applyDefaultsForType(schema, type, {}) : {};
    setPresent(true);
    setDraft(next);
    setSkillsetDef(prev => ({ ...prev, indexProjections: next }));
    setErrors({});
  };

  const remove = () => {
    if (!window.confirm('Remove indexProjections configuration from this skillset?')) return;
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
    setPresent(false);
    setDraft({});
    setSkillsetDef(prev => ({ ...prev, indexProjections: undefined }));
    setErrors({});
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
                variant="icon"
                onClick={() => setJsonEditorOpen(true)}
                title="Edit raw JSON"
              >
                <i className="fas fa-code"></i>
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
                Configure projections to secondary search index(es).
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
              onChange={(next) => setIndexProjectionsAutoNormalized(next)}
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
        title="Edit indexProjections JSON"
        value={draft}
        onSave={(nextValue) => {
          if (nextValue !== null && (typeof nextValue !== 'object' || Array.isArray(nextValue))) {
            alert('indexProjections must be a JSON object.');
            return;
          }
          if (!nextValue) {
            if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
            setPresent(false);
            setDraft({});
            setSkillsetDef(prev => ({ ...prev, indexProjections: undefined }));
            setErrors({});
            setJsonEditorOpen(false);
            return;
          }
          setPresent(true);
          setIndexProjectionsAutoNormalized(nextValue as Record<string, unknown>);
          setJsonEditorOpen(false);
        }}
      />
    </div>
  );
};

const SkillsetIndexProjectionsTab: React.FC<SkillsetIndexProjectionsTabProps> = (props) => {
  const resetKey = `${props.skillsetDef.name}:${props.skillsetDef['@odata.etag'] ?? ''}`;
  return <SkillsetIndexProjectionsTabInner key={resetKey} {...props} />;
};

export default SkillsetIndexProjectionsTab;
