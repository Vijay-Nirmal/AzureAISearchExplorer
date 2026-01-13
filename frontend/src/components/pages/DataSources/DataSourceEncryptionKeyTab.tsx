import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { ConfigDrivenObjectForm } from '../../common/configDriven/ConfigDrivenObjectForm';
import { applyDefaultsForType, getResolvedTypeDefinitions, normalizeBySchema } from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';
import type { SearchIndexerDataSourceConnection } from '../../../types/DataSourceModels';

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

interface DataSourceEncryptionKeyTabProps {
  schema: ConfigDrivenSchema;
  dataSourceDef: SearchIndexerDataSourceConnection;
  setDataSourceDef: React.Dispatch<React.SetStateAction<SearchIndexerDataSourceConnection>>;
}

const DataSourceEncryptionKeyTabInner: React.FC<DataSourceEncryptionKeyTabProps> = ({ schema, dataSourceDef, setDataSourceDef }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const commitTimerRef = useRef<number | null>(null);

  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const v = dataSourceDef.encryptionKey;
    return isPlainObject(v) ? v : {};
  });
  const [present, setPresent] = useState<boolean>(() => !!dataSourceDef.encryptionKey);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const v = dataSourceDef.encryptionKey;
    setPresent(!!v);
    setDraft(isPlainObject(v) ? v : {});
    setErrors({});
  }, [dataSourceDef.name, dataSourceDef['@odata.etag']]);

  const scheduleCommit = (next: Record<string, unknown> | undefined) => {
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = window.setTimeout(() => {
      setDataSourceDef(prev => ({ ...prev, encryptionKey: next }));
    }, 200);
  };

  const add = () => {
    const type = getResolvedTypeDefinitions(schema)[0]?.discriminatorValue;
    const next = type ? applyDefaultsForType(schema, type, {}) : {};
    setPresent(true);
    setDraft(next);
    setErrors({});
    setDataSourceDef(prev => ({ ...prev, encryptionKey: next }));
  };

  const remove = () => {
    if (!window.confirm('Remove encryptionKey configuration from this data source?')) return;
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
    setPresent(false);
    setDraft({});
    setErrors({});
    setDataSourceDef(prev => ({ ...prev, encryptionKey: undefined }));
  };

  const setEncryptionKeyAutoNormalized = (nextDraft: Record<string, unknown>) => {
    const result = normalizeBySchema(schema, nextDraft, { preserveUnknown: true });
    if (!result.value) {
      setDraft(nextDraft);
      scheduleCommit(nextDraft);
      setErrors(result.errors);
      return;
    }

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
            <Button variant="secondary" onClick={remove}>
              <i className="fas fa-trash"></i> Remove
            </Button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Card style={{ maxWidth: '1100px' }}>
          {!present ? (
            <div style={{ fontSize: '12px', opacity: 0.75, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
    </div>
  );
};

const DataSourceEncryptionKeyTab: React.FC<DataSourceEncryptionKeyTabProps> = (props) => {
  const resetKey = `${props.dataSourceDef.name}:${props.dataSourceDef['@odata.etag'] ?? ''}`;
  return <DataSourceEncryptionKeyTabInner key={resetKey} {...props} />;
};

export default DataSourceEncryptionKeyTab;
