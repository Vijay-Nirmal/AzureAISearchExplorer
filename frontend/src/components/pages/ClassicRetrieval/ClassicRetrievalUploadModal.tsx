import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '../../common/Button';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { Select } from '../../common/Select';
import { JsonView } from '../../common/JsonView';

import styles from './ClassicRetrievalPage.module.css';

type UploadAction = 'upload' | 'mergeOrUpload' | 'merge';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialJsonText?: string;
  defaultAction?: UploadAction;
  lockAction?: boolean;
  onSubmit: (payload: unknown) => Promise<void>;
};

const ensureAction = (item: Record<string, unknown>, action: UploadAction): Record<string, unknown> => {
  if (Object.prototype.hasOwnProperty.call(item, '@search.action')) return item;
  return { '@search.action': action, ...item };
};

const normalizeBatch = (parsed: unknown, action: UploadAction): { value: Record<string, unknown>[] } => {
  if (!parsed) throw new Error('JSON payload cannot be empty.');

  if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    const rec = parsed as Record<string, unknown>;
    if (Array.isArray(rec.value)) {
      const value = rec.value.map((x, idx) => {
        if (!x || typeof x !== 'object') throw new Error(`Item at index ${idx} is not an object.`);
        return ensureAction(x as Record<string, unknown>, action);
      });
      return { ...rec, value } as { value: Record<string, unknown>[] };
    }
  }

  const docs = Array.isArray(parsed) ? parsed : [parsed];
  const value = docs.map((x, idx) => {
    if (!x || typeof x !== 'object') throw new Error(`Item at index ${idx} is not an object.`);
    return ensureAction(x as Record<string, unknown>, action);
  });

  return { value };
};

export const ClassicRetrievalUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  initialJsonText,
  defaultAction = 'upload',
  lockAction,
  onSubmit
}) => {
  const [jsonText, setJsonText] = useState<string>(initialJsonText || '');
  const [action, setAction] = useState<UploadAction>(defaultAction);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setJsonText(initialJsonText || '');
    setAction(defaultAction);
    setParseError(null);
    setSubmitError(null);
  }, [defaultAction, initialJsonText, isOpen]);

  const actionOptions = useMemo(
    () => [
      { value: 'upload', label: 'upload', description: 'Insert new docs; replace existing docs.' },
      { value: 'mergeOrUpload', label: 'mergeOrUpload', description: 'Merge if exists; upload if missing.' },
      { value: 'merge', label: 'merge', description: 'Merge fields into existing documents.' }
    ],
    []
  );

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setJsonText(text);
      setParseError(null);
      setSubmitError(null);
    };
    reader.readAsText(file);
  }, []);

  const submit = useCallback(async () => {
    try {
      const parsed = JSON.parse(jsonText || '{}') as unknown;
      const payload = normalizeBatch(parsed, action);
      setParseError(null);
      setSubmitError(null);
      setBusy(true);
      await onSubmit(payload);
      setBusy(false);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setBusy(false);
      if (message.toLowerCase().includes('json')) setParseError(message);
      else setSubmitError(message || 'Upload failed');
    }
  }, [action, jsonText, onClose, onSubmit]);

  const resetToInitial = useCallback(() => {
    setJsonText(initialJsonText || '');
    setAction(defaultAction);
    setParseError(null);
    setSubmitError(null);
  }, [defaultAction, initialJsonText]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="min(1200px, 95vw)"
      footer={
        <>
          <Button variant="secondary" onClick={resetToInitial} title="Reset to original content">
            <i className="fas fa-rotate-left"></i> Reset
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy} title="Send indexing request">
            <i className="fas fa-upload"></i> Submit
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <div className={styles.inlineRow}>
          <div className={styles.fieldRow}>
            <div className={styles.labelRow}>
              <Label>Action</Label>
            </div>
            <Select value={action} onChange={(e) => setAction(e.target.value as UploadAction)} disabled={lockAction}>
              {actionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {lockAction ? <div className={styles.smallHint}>Action is locked for this operation.</div> : null}
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.labelRow}>
            <Label>JSON File</Label>
          </div>
          <div className={styles.fileRow}>
            <input
              ref={fileInputRef}
              className={styles.fileInputHidden}
              type="file"
              accept="application/json"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              title="Choose JSON file"
            >
              <i className="fas fa-file-arrow-up"></i> Choose File
            </Button>
          </div>
          <div className={styles.smallHint}>Accepts a single document, an array of documents, or a batch with a value array.</div>
        </div>

        {parseError ? (
          <div className={styles.requestJsonError}>
            <i className="fas fa-triangle-exclamation"></i> {parseError}
          </div>
        ) : null}
        {submitError ? (
          <div className={styles.requestJsonError}>
            <i className="fas fa-triangle-exclamation"></i> {submitError}
          </div>
        ) : null}

        <div
          style={{
            height: 'min(70vh, 800px)',
            minHeight: '360px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <JsonView
            data={jsonText || '{}'}
            readOnly={false}
            onChange={(val) => setJsonText(val ?? '')}
            options={{ lineNumbers: 'on', minimap: { enabled: true } }}
          />
        </div>

        <div className={styles.smallHint}>
          Supported formats: a single document object, an array of documents, or a full batch with a <code>value</code> array.
        </div>
      </div>
    </Modal>
  );
};
