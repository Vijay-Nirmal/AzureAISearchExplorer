import React, { useState } from 'react';

import { Button } from '../../common/Button';
import { JsonView } from '../../common/JsonView';
import { Modal } from '../../common/Modal';

import styles from './ClassicRetrievalPage.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;

  payloadText: string;
  canRun: boolean;
  loading: boolean;

  onRunWithBody: (body: unknown) => Promise<void>;
};

export const ClassicRetrievalRequestJsonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  payloadText,
  canRun,
  loading,
  onRunWithBody
}) => {
  if (!isOpen) return null;

  return (
    <ClassicRetrievalRequestJsonModalInner
      isOpen={isOpen}
      onClose={onClose}
      payloadText={payloadText}
      canRun={canRun}
      loading={loading}
      onRunWithBody={onRunWithBody}
    />
  );
};

const ClassicRetrievalRequestJsonModalInner: React.FC<Props> = ({
  isOpen,
  onClose,
  payloadText,
  canRun,
  loading,
  onRunWithBody
}) => {
  const [requestJsonText, setRequestJsonText] = useState(payloadText);
  const [requestJsonParseError, setRequestJsonParseError] = useState<string | null>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Request Body"
      width="min(1200px, 95vw)"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setRequestJsonText(payloadText);
              setRequestJsonParseError(null);
            }}
            title="Reset to the current request builder values"
          >
            <i className="fas fa-rotate-left"></i> Reset
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(requestJsonText)}
            title="Copy request JSON"
          >
            <i className="fas fa-copy"></i> Copy
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const parsed = JSON.parse(requestJsonText) as unknown;
                setRequestJsonParseError(null);
                await onRunWithBody(parsed);
                onClose();
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                setRequestJsonParseError(msg || 'Invalid JSON');
              }
            }}
            disabled={loading || !canRun}
            title="Run the edited request JSON"
          >
            <i className="fas fa-play"></i> Run Edited
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {requestJsonParseError ? (
          <div className={styles.requestJsonError}>
            <i className="fas fa-triangle-exclamation"></i> {requestJsonParseError}
          </div>
        ) : null}

        <div
          style={{
            height: 'min(70vh, 800px)',
            minHeight: '420px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <JsonView
            data={requestJsonText || '{}'}
            readOnly={false}
            onChange={(val) => setRequestJsonText(val ?? '')}
            options={{ lineNumbers: 'on', minimap: { enabled: true } }}
          />
        </div>
      </div>
    </Modal>
  );
};
