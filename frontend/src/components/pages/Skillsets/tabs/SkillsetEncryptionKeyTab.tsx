import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { JsonEditorModal } from '../../../common/JsonEditorModal';
import { ConfigDrivenObjectForm } from '../../../common/configDriven/ConfigDrivenObjectForm';
import { applyDefaultsForType, getResolvedTypeDefinitions, normalizeBySchema } from '../../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema } from '../../../common/configDriven/configDrivenTypes';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';

import schemaJson from '../../../../data/constants/config/Skillset/encryptionKeyConfig.json';

interface SkillsetEncryptionKeyTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

const SkillsetEncryptionKeyTabInner: React.FC<SkillsetEncryptionKeyTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const schema = schemaJson as unknown as ConfigDrivenSchema;

  const commitTimerRef = useRef<number | null>(null);

  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const v = skillsetDef.encryptionKey;
    return isPlainObject(v) ? v : {};
  });
  const [present, setPresent] = useState<boolean>(() => !!skillsetDef.encryptionKey);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    };
  }, []);

  const scheduleCommit = (next: Record<string, unknown>) => {
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = window.setTimeout(() => {
      setSkillsetDef(prev => ({ ...prev, encryptionKey: next }));
    }, 250);
  };

  const add = () => {
    const type = getResolvedTypeDefinitions(schema)[0]?.discriminatorValue;
    const next = type ? applyDefaultsForType(schema, type, {}) : {};
    setPresent(true);
    setDraft(next);
    setSkillsetDef(prev => ({ ...prev, encryptionKey: next }));
    setErrors({});
  };

  const remove = () => {
    if (!window.confirm('Remove encryptionKey configuration from this skillset?')) return;
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
    setPresent(false);
    setDraft({});
    setSkillsetDef(prev => ({ ...prev, encryptionKey: undefined }));
    setErrors({});
  };

  const deleteIfEmptyObject = (obj: Record<string, unknown>, key: string) => {
    const v = obj[key];
    if (isPlainObject(v) && Object.keys(v).length === 0) delete obj[key];
  };

  const cleanEmptyObjects = (obj: Record<string, unknown>) => {
    deleteIfEmptyObject(obj, 'accessCredentials');
    deleteIfEmptyObject(obj, 'identity');
  };

  const setEncryptionKeyAutoNormalized = (nextDraft: Record<string, unknown>) => {
    const result = normalizeBySchema(schema, nextDraft, { preserveUnknown: true });
    if (!result.value) {
      setDraft(nextDraft);
      scheduleCommit(nextDraft);
      setErrors(result.errors);
      return;
    }

    cleanEmptyObjects(result.value);
    setDraft(result.value);
    scheduleCommit(result.value);
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
                Add a customer-managed encryption key configuration to protect data at rest.
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
              onChange={(next) => setEncryptionKeyAutoNormalized(next)}
              layoutMode="split-complex"
              errors={errors}
            />
          )}
        </Card>
      </div>

      <JsonEditorModal
        isOpen={jsonEditorOpen}
        onClose={() => setJsonEditorOpen(false)}
        title="Edit encryptionKey JSON"
        value={draft}
        onSave={(nextValue) => {
          if (nextValue !== null && (typeof nextValue !== 'object' || Array.isArray(nextValue))) {
            alert('encryptionKey must be a JSON object.');
            return;
          }
          if (!nextValue) {
            if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
            setPresent(false);
            setDraft({});
            setSkillsetDef(prev => ({ ...prev, encryptionKey: undefined }));
            setErrors({});
            setJsonEditorOpen(false);
            return;
          }
          setPresent(true);
          setEncryptionKeyAutoNormalized(nextValue as Record<string, unknown>);
          setJsonEditorOpen(false);
        }}
      />
    </div>
  );
};

const SkillsetEncryptionKeyTab: React.FC<SkillsetEncryptionKeyTabProps> = (props) => {
  const resetKey = `${props.skillsetDef.name}:${props.skillsetDef['@odata.etag'] ?? ''}`;
  return <SkillsetEncryptionKeyTabInner key={resetKey} {...props} />;
};

export default SkillsetEncryptionKeyTab;
